import * as readline from 'readline';
import ClassCard, { learningType, activities } from "./classcard";
import { Writable } from "stream";


(async function () {
    let id: string = await question("아이디: ");
    let password: string = await question("비밀번호: ", true);
    let setId: string = await question("세트 아이디: ");
    let tilda: "암기학습" | "리콜학습" | "스펠학습" | "매칭" | "스크램블" | "크래시";
    let score: number;
    console.clear();
    let cch = new ClassCard();
    let loginResult = await cch.login(id, password);
    console.info(loginResult?.message);
    if (!loginResult?.success) return;
    const classes = await cch.getClasses().then(c => c?.data);
    console.log("Classes:", classes);
    // let folder = await cch.getFolders().then(r => r?.data!);
    // console.log(folder)
    // const sets = await cch.getSets(folder["이용한 세트"]).then(c => c?.data);
    // console.log("Sets:", sets);
    await cch.setSetInfo(setId).then(r => {
        console.log(r?.message);
        if (!r?.success) process.exit();
    }); //sets[0].id
    while (true) {
        console.clear();
        console.log("Set info:", cch.getSetInfo());
        console.log("User info:", cch.getUserInfo());
        console.log("작업 목록: " + Object.keys(activities).filter(k => {
            if (k.length <= 1) return false;
            if (k === "매칭" && cch.getSetInfo().type === "sentence") return false;
            if (k === "스크램블" && cch.getSetInfo().type === "word") return false;
            return true;
        }).join(", "));
        tilda = (await question("할 작업: ")) as "암기학습" | "리콜학습" | "스펠학습" | "매칭" | "스크램블" | "크래시";
        if (activities[tilda]) {
            if (tilda === "암기학습" || tilda === "리콜학습" || tilda === "스펠학습") await cch.sendLearnAll(learningType[tilda]).then(console.log);
            else {
                score = Number(await question("설정할 게임 점수: "));
                score && await cch.sendScore(activities[tilda], score).then(console.log);
            };
            await question("");
        };
    };


})();

async function question(question: string, hide?: boolean) {
    var mutableStdout = new Writable({
        write: (chunk: string | Uint8Array, encoding: BufferEncoding, callback: (err?: Error) => void) => {
            if (!hide) process.stdout.write(chunk, encoding);
            callback();
        }
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true
    });

    let answer: string = await new Promise(resolve => {
        if (hide) {
            process.stdout.write(question);
            rl.question("", resolve);
        } else {
            rl.question(question, resolve);
        };
    });
    hide && console.log();
    rl.close();
    return answer;
};