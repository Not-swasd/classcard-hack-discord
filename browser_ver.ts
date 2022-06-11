console.clear();
import * as playwright from "playwright";
import * as readline from "readline";
import axios from "axios";
import * as fs from "fs";
import * as chalk from "chalk";
if (!fs.existsSync("./config.json")) fs.writeFileSync("./config.json", JSON.stringify({ id: "", password: "" }, null, 4));
let config: { id: string, password: string };
try {
    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
} catch {
    config = { id: "", password: "" };
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
};

(async function () {
    if (!config.id) config.id = await question("ID: ");
    if (!config.password) config.password = await question("Password: ");
    process.stdout.write(chalk.yellowBright("[CCH] 브라우저를 실행하는 중..."));
    const browser = await playwright.chromium.launch({ "headless": false });
    const context = await browser.newContext({ "viewport": null });
    const page = await context.newPage();
    context.on("page", (page) => page.close());
    console.info(chalk.greenBright("\r[CCH] 브라우저가 실행되었습니다.     "));
    const transformRequest = (jsonData: Object = {}) => Object.entries(jsonData).map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join('&');
    process.stdout.write("[CCH] 로그인 중... ");
    await page.goto("https://www.classcard.net");
    let cookies = await context.cookies();
    let response = await axios.post("https://www.classcard.net/LoginProc", transformRequest({
        "sess_key": cookies.find(x => x.name === "ci_session")!.value,
        "redirect": "",
        "login_id": config.id,
        "login_pwd": config.password
    })).catch(reason => {
        console.error(reason);
        process.exit(1);
    });
    if (!response.data || response.data.result !== "ok") {
        console.error(chalk.redBright(`\r[CCH] 로그인 실패. (msg: ${response.data.msg}) `));
        process.exit(1);
    };
    response.headers['set-cookie']?.forEach(cookie => context.addCookies([
        {
            name: cookie.split(";")[0].split("=")[0],
            value: cookie.split(";")[0].split("=")[1],
            domain: "www.classcard.net",
            path: cookie.split("path=")[1].split(";")[0]
        }
    ]));
    console.info(chalk.greenBright("\r[CCH] 로그인 성공.    "));
    await page.goto("https://www.classcard.net/Main");
    console.clear();
    console.info(chalk.yellowBright("[CCH] 세트 페이지로 이동해주세요."));
    let setid: string;
    let ing = "";
    const names = {
        "Memorize": "암기학습",
        "Recall": "리콜학습",
        "Spell": "스펠학습",
        "Match": "매칭게임",
        "Crash": "크래시게임",
        "Scramble": "스크램블",
    };
    const evalContents = { //https://github.com/Nua07/classcardHack/ 참고.
        "std": `(() => {
                arr_send_card_idx = [0];
                arr_send_score = [0];
    
                for(var i = 0;i < study_data.length; i++) {
                    arr_send_card_idx.push(study_data[i].card_idx);
                    arr_send_score.push(1);
                };
    
                sendLearnAll();
            })()`.trim(),
        "testTimeLock": `(() => {
                var temp = $("div.flip-card");
                for(var i = 0; i < temp.length; i++) {
                    temp[i].setAttribute("data-limit1", Infinity);
                    temp[i].setAttribute("data-limit2", Infinity);
                };
            })()`.trim(),
        "gameCustomScore": (game: string, score: string | number) => `(() => {
                jQuery(function ($) {
                    let send_data = [ ${game === "Match" ? `ggk.d(100, 0)` : game === "Scramble" ? "ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0), ggk.d(50, 0)" : ""} ];
                    for (var i = 0; i < (${score} / ${["Match", "Scramble"].includes(game) ? "100" : "10"}); i++) send_data.push(ggk.d(${["Match", "Scramble"].includes(game) ? "100" : "10"}, 1));
                    console.log(send_data);
                    
                    $data = { set_idx: set_idx, arr_key: ggk.a(), arr_score: send_data, tid: tid };
                    if("${game}" === "Crash") {
                        $data.activity = 5;
                    } else if (["Match", "Scramble"].includes("${game}")) {
                        $data.activity = 4;
                    };
                    jQuery.ajax({
                        url: "/Match/save",
                        global: false,
                        type: "POST",
                        data: $data,
                        dataType: "json",
                        async: checkAjaxAsync(),
                        success: function (data) {
                            console.log(data);
                            if (data.result == 'ok') {
                                if (data.tid !== undefined) {
                                    tid = data.tid;
                                }
                
                                if (is_teacher) {
                                    showRankPopup(0, class_idx, set_idx, $data.activity, 10, ${score});
                                } else {
                                    showRankPopup(c_u, class_idx, set_idx, $data.activity, 10, ${score});
                                };
                            } else {
                                showAlert('오류', data.msg);
                                location.reload();
                            }
                        },
                        error: function (response, textStatus, errorThrown) {
                            console.log('response', response);
                            showAlert('오류', response);
                            location.reload();
                        }
                    });
                });
            })()`.trim(),
        "crashPause": "(() => { crash.pause(); })()".trim(),
    };
    let setStatus: {
        "Memorize": number,
        "Recall": number,
        "Spell": number,
        "type": string
    };
    let setName: string;
    page.route("**/*", (route, req) => {
        if (req.url().includes("match.js")) route.fulfill({
            status: 200,
            body: fs.readFileSync("./ccfiles/match.js", "utf8")
        });
        else if (req.url().includes("crash.js")) route.fulfill({
            status: 200,
            body: fs.readFileSync("./ccfiles/crash.js", "utf8")
        });
        else if (req.url().includes("match_sentence.js")) route.fulfill({
            status: 200,
            body: fs.readFileSync("./ccfiles/match_sentence.js", "utf8")
        });
        else if (req.url().includes("class_test.js")) route.fulfill({
            status: 200,
            body: fs.readFileSync("./ccfiles/class_test.js", "utf8")
        });
        else if (!req.url().startsWith("https://www.classcard.net") && !req.url().startsWith("https://b.classcard.net")) route.abort();
        else route.continue();
    });
    page.on("load", async p => {
        if (ing === "Match" && p.url().includes("/Match")) return;
        while (ing || (!!setid && setStatus["Memorize"] != 0 && !setStatus["Memorize"])) {
            await sleep(300);
            if (!!setid && !setStatus["Memorize"]) await getSetInfo(true).then((r) => { if (!!r) setStatus = r });
        };
        if (!!setid) await logSetInfo();
        // if (!p.url().startsWith("https://www.classcard.net")) {
        //     console.error(chalk.redBright(`[CCH] 잘못된 세트URL입니다. (url: ${p.url()})`));
        //     process.exit(1);
        // };
        if (!!setid && !p.url().includes(setid)) {
            setid = "";
            setName = "";
            ing = "";
            console.clear();
            console.info(chalk.yellowBright("[CCH] 세트 페이지로 이동해주세요."));
        };
        if (!setid) {
            if (p.url().match(/https:\/\/www.classcard.net\/set\/[0-9]+\/?/)) {
                setid = p.url().split("/")[4];
                let s = await getSetInfo(true);
                if (!!s) setStatus = s;
                logSetInfo();
            };
            return;
        };
        if (p.url().includes("/ClassTest")) page.evaluate(evalContents["testTimeLock"]).catch(() => false);
        let name = p.url().split(".net/")[1].split("/")[0] as "Memorize" | "Recall" | "Spell" | "Match" | "Crash" | "Scramble";
        if (["Memorize", "Recall", "Spell", "Match", "Crash"].includes(name)) {
            console.clear();
            ing = name;
            if (name === "Match" && setStatus.type === "sentence") name = "Scramble";
            console.info(chalk.yellowBright(`[CCH] ${names[name]} 페이지에 접속하셨습니다. 잠시만 기다려주세요.`));
            if (p.url().includes("/Match") || p.url().includes("/Crash")) {
                let score = 0;
                while (score == 0) {
                    console.clear();
                    console.info(chalk.yellowBright(`[CCH] ${names[name]} 페이지에 접속하셨습니다.`));
                    score = Number(await question(chalk.yellowBright(`[CCH] 원하는 점수를 입력해주세요 (${["Match", "Scramble"].includes(name) ? "100" : "10"}단위, 최대 990000점): `)));
                    if (isNaN(score) || score < (["Match", "Scramble"].includes(name) ? 100 : 10) || score > 990000 || score % (["Match", "Scramble"].includes(name) ? 100 : 10) != 0) {
                        score = 0;
                        console.error(chalk.redBright("[CCH] 올바르지 않은 점수입니다."));
                        await sleep(700);
                        continue;
                    };
                };
                let result = (await page.evaluate(evalContents["gameCustomScore"](name, score)).catch(() => false)) === undefined;
                console.info(chalk[result ? "greenBright" : "redBright"]("[CCH] " + (result ? "성공" : "실패") + "! 종료 버튼을 누르거나 세트페이지로 이동하세요."));
            } else {
                name = name as "Memorize" | "Recall" | "Spell";
                let result = (await page.evaluate(evalContents.std).catch(() => false)) === undefined;
                if (["Memorize", "Recall", "Spell"].includes(name)) {
                    let temp = await getSetInfo(false);
                    if (!temp || temp[name] !== (Number(setStatus[name].toString().slice(0, -2) + "00") + 100)) result = false;
                    if (!!temp) setStatus = temp;
                };
                console.info(chalk[result ? "greenBright" : "redBright"]("[CCH] " + (result ? "성공" : "실패") + "!"));
                await sleep(200);
                await page.goto(`https://www.classcard.net/set/${setid}`);
            };
            await sleep(700);
        };
        ing = "";
    });

    async function logSetInfo() {
        console.clear();
        console.info(chalk.greenBright(`[CCH] 세트 이름: ${setName}\n      세트 ID: ${setid}\n      암기: ${setStatus.Memorize}%\n      리콜: ${setStatus.Recall}%\n      스펠: ${setStatus.Spell}%`));
        console.info(chalk.yellowBright("[CCH] 지원 목록: " + Object.values(names).join(", ")));
    };

    async function getSetInfo(first: boolean) {
        let response = await axios.get(`https://www.classcard.net/set/${setid}`, { "headers": { "Cookie": "ci_session=" + cookies.find(x => x.name === "ci_session")!.value + ";" } }).catch(() => { return { data: false } });
        if (!response.data) return false;
        if (!first) response = await axios.get(`https://www.classcard.net/set/${setid}`, { "headers": { "Cookie": "ci_session=" + cookies.find(x => x.name === "ci_session")!.value + ";" } }).catch(() => { return { data: false } });
        setName = response.data.split('set-name-header">')[1].split('<!-- <span')[0].trim();
        let type = response.data.split("set-icon revers ")[1].split('"')[0];
        return {
            Memorize: Number(response.data.split('mem-total-rate" data-rate="')[1].split('"')[0].trim()),
            Recall: Number(response.data.split('recall-total-rate" data-rate="')[1].split('"')[0].trim()),
            Spell: Number(response.data.split('spell-total-rate" data-rate="')[1].split('"')[0].trim()),
            type
        };
    };
})();

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
};

async function question(question: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let answer: string = await new Promise(resolve => rl.question(question, resolve));
    rl.close();
    return answer;
};