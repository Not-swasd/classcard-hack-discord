import * as readline from "readline";
import { QuizBattle } from "./classcard";

(async () => {
    let battle_id = Number(await question("배틀 코드: "));
    if (!battle_id) return;
    let name = await question("이름: ");
    if (!name) return;
    let qb = new QuizBattle(battle_id);
    await qb.init();
    await qb.join(name);
    qb.leave()
    console.log(qb.battleInfo.quest_list.length);
})();

async function question(question: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let answer: string = await new Promise(resolve => rl.question(question, resolve));
    rl.close();
    return answer;
};