import Websocket = require("ws");
import * as readline from "readline";
import { QuizBattle } from "./classcard";
import axios from "axios";

(async () => {
    let battle_id = Number(await question("배틀 코드: "));
    if (!battle_id) return;
    let qb = new QuizBattle(battle_id);
    await qb.init();
    await qb.join("하이요");
    console.log(qb.battleInfo.quest_list.length);
})();
// (async () => {
//     let battle_id = Number(await question("배틀 코드: "));
//     if (!battle_id) return;
//     let port = 800;
//     if (battle_id > 18999 && battle_id < 28000) {
//         port = 801;
//     } else if (battle_id > 27999 && battle_id < 37000) {
//         port = 802;
//     } else if (battle_id > 36999 && battle_id < 46000) {
//         port = 803;
//     } else if (battle_id > 45999 && battle_id < 55000) {
//         port = 804;
//     } else if (battle_id > 54999 && battle_id < 64000) {
//         port = 805;
//     } else if (battle_id > 63999 && battle_id < 73000) {
//         port = 806;
//     } else if (battle_id > 72999 && battle_id < 82000) {
//         port = 807;
//     } else if (battle_id > 81999 && battle_id < 91000) {
//         port = 808;
//     } else if (battle_id > 90999 && battle_id < 100000) {
//         port = 809;
//     };
//     const ws = new Websocket("wss://mobile3.classcard.net/wss_" + port);
//     let pong_timer;
//     let name;
//     let total_score = 1000;
//     let battle_info;
//     let quest = [];
//     ws.on("open", async () => {
//         send_pong();
//         send_msg({
//             cmd: 'b_check',
//             battle_id: battle_id,
//             is_auto: false,
//             major_ver: 8,
//             minor_ver: 0
//         });
//         name = await question("이름: ");
//         send_msg({
//             cmd: "b_join",
//             battle_id,
//             browser: "Chrome",
//             is_add: 0,
//             is_auto: false,
//             major_ver: 8,
//             minor_ver: 0,
//             platform: "Windows 10",
//             user_name: name,
//         });
//     });

//     ws.on("message", async (message) => {
//         send_pong();
//         // battle.receive_msg(message.data);
//         let data = JSON.parse(message.toString());
//         console.log(data);
//         if (data.cmd === "b_join" && data.result === "ok") {
//             battle_info = data;
//             await axios.post("https://b.classcard.net/ClassBattle/battle_quest", "test_id=" + battle_info.test_id).then(res => battle_info.quest_list = res.data.quest_list);
//             console.log(battle_info, true)
//             send_msg({
//                 cmd: "b_join",
//                 battle_id,
//                 browser: "Chrome",
//                 is_add: 1,
//                 is_auto: false,
//                 major_ver: 8,
//                 minor_ver: 0,
//                 platform: "Windows 10",
//                 user_name: name,
//             });
//         };
//         if (data.cmd === "b_test_end") {
//             send_msg({
//                 cmd: "b_get_rank",
//                 quest: [],
//                 total_score,
//                 unknown: 0
//             });
//         };
//     });

//     ws.on("close", () => {
//         console.log("closed");
//     });

//     ws.on("error", (err) => {
//         console.error(err);
//     });

//     function addScore(correct: boolean = true) {
//         let randomQuest = battle_info.quest_list.shift();
//         quest.push({
//             card_idx: randomQuest.test_card_idx,
//             score: correct ? 100 : 0,
//             correct_yn: correct ? 1 : 0,
//         });
//         total_score += correct ? 100 : 0;
//     };

//     function sendGetRank() {
//         send_msg({
//             cmd: "b_get_rank",
//             quest,
//             total_score,
//             unknown: 0
//         });
//     };

//     function send_pong() {
//         if (pong_timer) clearTimeout(pong_timer);
//         pong_timer = setTimeout(() => send_msg({ cmd: 'pong' }), 10000);
//     };

//     function send_msg(msg: any) {
//         ws.send(typeof msg === "object" ? JSON.stringify(msg) : msg);
//         send_pong();
//     };
// })();

async function question(question: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let answer: string = await new Promise(resolve => rl.question(question, resolve));
    rl.close();
    return answer;
};