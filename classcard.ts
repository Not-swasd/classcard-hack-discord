import axios, { Axios, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import Websocket = require("ws");
// import * as fs from "fs";
import FormData = require("form-data");
import EventEmitter = require("events");

enum setType {
    "word" = 1, //단어
    "term", //용어
    "quest" = 4, //문제
    "sentence", //문장
    "drill", //드릴
    "listen", //듣기
    "answer" //정답
};
enum learningType {
    "암기학습" = "Memorize",
    "리콜학습" = "Recall",
    "스펠학습" = "Spell"
};
enum activities {
    "암기학습" = 1,
    "리콜학습",
    "스펠학습",
    "매칭" = 4,
    "스크램블" = 4,
    "크래시",
};
const folder: { [key: string]: string } = {
    "이용한 세트": "Main",
    "만든 세트": "make",
    "클래스": "ClassMain"
};

export default class ClassCard {
    private jar: CookieJar;
    private client: Axios;
    set: {
        id: string,
        name: string,
        type: string,
        study_data: { "card_idx": string }[]
    };
    class: {
        id: string,
        name: string
    };
    user: {
        name: string,
        id: string,
        isPro: boolean,
        isTeacher: boolean
    };
    // folders: {
    //     "name": string,
    //     "id": string,
    //     "default": boolean
    // }[]
    private sessionInterval!: NodeJS.Timer;
    constructor() {
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({ jar: this.jar, headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36" } }));
        this.set = {
            id: "",
            name: "",
            type: "",
            study_data: []
        };
        this.class = {
            id: "",
            name: ""
        };
        this.user = {
            name: "",
            id: "",
            isPro: false,
            isTeacher: false,
        };
        // this.folders = [];
    };

    async getCookieValue(name: string): Promise<string> {
        try {
            return (await this.jar.getCookies("https://www.classcard.net")).map(cookie => cookie.toString()).find(cookie => cookie.startsWith(name))!.match(new RegExp(`(?<=${name}=)(.*?)(?=;)`))![0];
        } catch (e) {
            return "";
        };
    };

    getSetInfo(): typeof this.set {
        return this.set;
    };

    getUserInfo(): typeof this.user {
        return this.user;
    };

    async setSetInfo(setId: string): Promise<{ success: boolean, message: string, data?: { id: string, name: string, type: string, study_data: { card_idx: string }[] }, error?: { message: string, stack: string | undefined } } | null> {
        try {
            let res: AxiosResponse | false = await this.client.get("https://www.classcard.net/set/" + setId).catch(() => false);
            if (!res || !res.data || res.data.includes("삭제된 세트") || res.data.includes("이 세트는 제작자가 비공개로 지정한 세트입니다")) throw new Error("세트 정보를 가져올 수 없습니다.");
            res.data = res.data.replace(/\r?\n/g, "");
            this.set.id = setId;
            this.set.name = res.data.match(/(?<=set-name-header">)(.*?)(?=<!-- <span)/)[0].trim();
            this.set.type = res.data.match(/(?<=set-icon revers )(.*?)(?=")/)[0];
            let study_data: any = JSON.parse(res.data.match(/(?<=var study_data = )\[{(.*?)}\](?=;)/)[0]);
            study_data.forEach((x: any) => Object.keys(x).forEach((key: any) => key !== "card_idx" && delete x[key]));
            this.set.study_data = study_data;
            this.class.id = res.data.match(/(?<=var class_idx = )(.*?)(?=;)/)[0];
            this.class.name = res.data.match(/(?<=var class_name = ')(.*?)(?=';)/)[0];
            //api
            // let res: AxiosResponse | false = await this.client.get("https://classcard.net/api/sets/info?set_idx=" + setId).catch(() => false); // 비공개 세트도 접속 가능
            // if (!res.data || !res.data.res_data || res.data.result.code !== 200) throw new Error((res.data && res.data.result.msg) || "세트 정보를 가져올 수 없습니다.");
            // if (res.data.res_data.open_yn !== "1") throw new Error("이 세트는 비공개 세트입니다.");
            // this.set.id = setId;
            // this.set.name = res.data.res_data.name;
            // this.set.type = res.data.res_data.set_type;
            // let study_data: any = await this.client.get("https://classcard.net/api/sets/cards?set_idx=" + setId).then(res => res.data.res_data.cards).catch(() => false);
            // if(!study_data) throw new Error("세트 정보를 가져올 수 없습니다.");
            // study_data.forEach((x: any) => Object.keys(x).forEach((key: any) => key !== "card_idx" && delete x[key]));
            // this.set.study_data = study_data;
            // return { success: true, message: "세트 정보가 설정되었습니다.", data: this.set };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
        return null;
    };

    async setClassInfo(classId: string | number) {
        try {
            let res: AxiosResponse | false = await this.client.get("https://classcard.net/class/" + classId).catch(() => false);
            if (!res || !res.data || !res.data.res_data) throw new Error("클래스 정보를 가져올 수 없습니다.");
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
    };

    async getSets(f: string, classID?: string): Promise<{ success: boolean, message: string, data?: { id: string, name: string, type: number }[], error?: { message: string, stack: string | undefined } } | null> {
        try {
            if (f === "클래스" && !classID) f = "이용한 세트";
            let res: AxiosResponse = await this.client.get(`https://www.classcard.net/${folder[f]}/${f === "클래스" ? classID : ""}`).catch(() => { throw new Error("세트 목록을 가져올 수 없습니다.") });
            let sets = (res.data.replace(/\r?\n/g, "").match(/(?<=<div class="set-items )(.*?)(?=(<\/a>|<\/span>)<span class="text-gray font-14 font-normal)/g) || []).map((htmlset: string) => { return { "name": htmlset.split('span class="set-name-copy-text">')[1], "id": htmlset.match(/(?<=data-idx=")([0-9]*?)(?=")/)![0], "type": Number(htmlset.match(/(?<=data-type=")([0-9]*?)(?=")/)![0]) } });
            return {
                success: true,
                message: "성공",
                data: sets
            };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
        return null;
    };

    async getClasses(): Promise<{ success: boolean, message: string, data?: { id: string, name: string, isFolder: false }[], error?: { message: string, stack: string | undefined } } | null> {
        try {
            let res: AxiosResponse = await this.client.get("https://www.classcard.net/Main").catch(() => { throw new Error("클래스 목록을 가져올 수 없습니다.") });
            let classes = (res.data.replace(/\r?\n/g, "").match(/(?<=<a class="left-class-items)(.*?)(?=<\/div><\/div><\/a>)/g) || []).map((htmlset: string) => { return { "name": htmlset.split('<div class="cc-ellipsis l1">')[1], "id": htmlset.match(/(?<=href="\/ClassMain\/)(.*?)(?=" >)/)![0], "isFolder": false } });
            //api
            // let res: AxiosRsponse | false = await this.client.get("https://classcard.net/api/users/page?u_idx=" + this.user.id).catch(() => false);
            // if (!res || !res.data || !res.data.res_data || res.data.result.code !== "200") throw new Error((res && res.data && res.data.result.msg) || "클래스 목록을 가져올 수 없습니다.");
            // let classes = res.data.res_data.class;
            return {
                success: true,
                message: "성공",
                data: classes
            };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
        return null;
    };

    async login(id: string, password: string) {
        try {
            //api
            // let res: AxiosResponse = await this.client.post(`https://classcard.net/api/users/login?` + transformRequest({
            //     "login": 1,
            //     "id": id,
            //     "pw": password
            // }));
            // if (!res || !res.data || !res.data.res_data || res.data.result.code !== "200") throw new Error((!res && !res.data && res.data.result.msg) || "알 수 없는 오류입니다.");
            // this.user.isTeacher = res.data.res_data.user_type === 1;
            // this.user.name = res.data.res_data.name;
            // this.user.id = res.data.res_data.user_idx;
            // this.user.isPro = typeof Number(res.data.res_data.b_s_idx) === "number" && Number(res.data.res_data.b_s_idx) > 0;
            // this.user.token = res.data.res_data.token;
            // this.client.defaults.headers.common["Authorization"] = this.user.id + " " + this.user.token;
            await this.client.get("https://www.classcard.net");
            let session_key: string = await this.getCookieValue("ci_session");
            let res: AxiosResponse = await this.client.post("https://www.classcard.net/LoginProc", transformRequest({
                "sess_key": session_key,
                "redirect": "",
                "login_id": id,
                "login_pwd": password,
                "login_remember": "on"
            }));
            const reasons: { [key: string]: string } = {
                "id": "아이디",
                "pwd": "비밀번호"
            };
            if (!res || !res.data || res.data.result !== "ok") throw new Error(!res || !res.data ? "알 수 없는 오류입니다." : `${Object.keys(reasons).includes(res.data.msg) ? reasons[res.data.msg] : res.data.msg}가 잘못되었습니다.`);
            res = await this.client.get("https://www.classcard.net/Main");
            this.user.isPro = !res.data.replace(/\r?\n/g, "").match(/(?<=<span class="label label-)(.*?)(?=<\/span>)/)[0].includes("STANDARD");
            let nt = res.data.replace(/\r?\n/g, "").match(/(?<=<br><span class="font-bold">)(.*?)(?=<\/span>)/)[0];
            if (nt) {
                this.user.isTeacher = nt.split('<span class="font-12">')[1].includes("선생님");
                this.user.name = nt.split('<span class="font-12">')[0].trim();
            };
            await this.getFolders(res.data).then(f => f?.success && f.data && Object.keys(f.data!).forEach(key => folder[key] = f.data[key]));
            //api 
            // let result = await this.getFolders(res.data);
            // if (result?.success && result.data) this.user.folders = result.data;
            return {
                success: true,
                message: "로그인 성공",
                data: res.data
            };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
    };

    async getFolders(data?: string) {
        try {
            if (!data) data = await this.client.get("https://www.classcard.net/Main").then(res => res.data);
            data = data?.split('<div class="m-t-sm left-sl-list">')[1].split(".go-auth-school-link")[0].replace(/\r?\n/g, "");
            let folders: { [key: string]: string } = {};
            data?.split("</a>").forEach((i: string) => {
                let folderName = (i.match(/(?<="left-sl-item">)(.*?)(?=<\/div>)/) || [""])[0].trim();
                let href = (i.match(/(?<=href="\/)(.*?)(?=">)/) || [""])[0].trim();
                if (!!folderName && !!href) folders[folderName] = href;
            });
            //api
            // let res: AxiosResponse = await this.client.get("https://classcard.net/api/sets/folders").catch(() => false);
            // if (!res || !res.data || !res.data.res_data) throw new Error("폴더 목록을 가져올 수 없습니다.");
            // let folders: { "name": string, "id": string, "default": boolean }[] = [
            //     {
            //         "name": "이용한 세트",
            //         "id": "Main",
            //         "default": true
            //     },
            //     {
            //         "name": "만든 세트",
            //         "id": "make",
            //         "default": true
            //     }
            // ]; //sl_
            // if (this.user.isTeacher) folders.push({ "name": "구독중인 폴더", "id": "Subscription", "default": true });
            // res.data.res_data.forEach((i: {
            //     "sl_idx": string,
            //     "sl_order": string,
            //     "sl_type": string,
            //     "img_path": unknown,
            //     "open_yn": string,
            //     "allow_edit_yn": string,
            //     "set_order_type": string,
            //     "set_cnt": string,
            //     "owner_user_idx": string,
            //     "sl_name": string,
            //     "order_type": string,
            //     "cat": unknown,
            //     "publisher": unknown 
            // }) => i.sl_name && i.sl_idx && folders.push({ "name": i.sl_name, "id": i.sl_idx, "default": false }));
            return {
                success: true,
                message: "성공",
                data: folders
            };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
    };

    async getTotal(): Promise<{ success: boolean, message: string, data?: { Memorize: number, Recall: number, Spell: number }, error?: { message: string, stack: string | undefined } } | null> {
        try {
            if (!this.set.id) throw new Error("세트를 설정해주세요.");
            let res: AxiosResponse = await this.client.get(`https://www.classcard.net/set/${this.set.id}`).catch(() => { throw new Error("세트 정보를 가져올 수 없습니다.") });
            
            return {
                success: true,
                message: "성공",
                data: {
                    Memorize: Number(res.data.match(/(?<=mem-total-rate" data-rate=")(.*?)(?=")/)[0].trim()),
                    Recall: Number(res.data.match(/(?<=recall-total-rate" data-rate=")(.*?)(?=")/)[0].trim()),
                    Spell: Number(res.data.match(/(?<=spell-total-rate" data-rate=")(.*?)(?=")/)[0].trim())
                }
            };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
        return null;
    };

    async sendLearnAll(type: learningType, scoreCheck: boolean = true): Promise<{ success: boolean, message: string, data?: { before: number, after: number }, error?: { message: string, stack: string | undefined } } | null> {
        try {
            if (!this.set.id) throw new Error("세트를 설정해주세요.");
            let activity = 0;
            if (type === learningType["암기학습"]) {
                activity = 1;
            } else if (type === learningType["리콜학습"]) {
                activity = 2;
            } else if (type === learningType["스펠학습"]) {
                activity = 3;
            } else {
                throw new Error("알 수 없는 학습 타입입니다.");
            };
            // let data: FormData = new FormData();
            // data.append("set_idx_2", this.set.id);
            // data.append("card_idx[]", "0");
            // data.append("score[]", "0");
            // for (const card_idx in this.set.study_data) {
            //     data.append("card_idx[]", card_idx);
            //     data.append("score[]", "1");
            // };
            // data.append("activity", "1");
            // data.append("last_section", "1");
            // data.append("last_round", "1");
            // data.append("is_know_card", "1");
            // data.append("is_w_pro", this.user.isPro ? "1" : "0");
            // data.append("view_cnt", this.set.study_data.length.toString());
            // data.append("user_idx", this.user.id);
            let before: number;
            let after: number;
            while (true) {
                before = scoreCheck ? await this.getTotal().then(t => t!.data![type]) : 0;
                // await this.client.post("https://www.classcard.net/ViewSetAsync/learnAll", data);
                await this.client.post("https://www.classcard.net/ViewSetAsync/resetAllLog", transformRequest({
                    set_idx: this.set.id,
                    activity,
                    user_idx: this.user.id,
                    view_cnt: this.set.study_data.length,
                }));
                after = scoreCheck ? await this.getTotal().then(t => t!.data![type]) : 0;
                if (!scoreCheck || (after >= (Number(before.toString().slice(0, -2) + "00") + 100))) break;
            };
            return {
                success: true,
                message: "성공",
                data: {
                    before,
                    after
                }
            };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
        return null;
    };

    async sendScore(game: activities, score: number, fetchRank?: boolean) {
        try {
            if (!this.set.id) throw new Error("세트를 설정해주세요.");
            if (![4, 5].includes(game)) throw new Error("지원하지 않는 게임입니다.");
            // let res: AxiosResponse = await this.client.get("https://www.classcard.net/set/" + this.set.id);
            // if(res.data.includes("세트 학습은 유료이용 학원/학교에서만 이용가능합니다. 선생님께 문의해 주세요.")) throw new Error(this.set.type + "세트 학습은 유료이용 학원/학교에서만 이용가능합니다. 선생님께 문의해 주세요.");
            // let url: string = "https://www.classcard.net/" + res.data.match(new RegExp(`(?<=chkCardCount2\\('\\/)${game === "5" ? "Crash" : "Match"}\\/(.*?)(?=', 'bottom_${game === "5" ? "crash" : "match"}'\\);)`))[0];
            // if (!url) throw new Error("알 수 없는 오류입니다.");
            let res: AxiosResponse = await this.client.get(`https://www.classcard.net/${game === 4 ? "Match" : "Crash"}/${this.set.id}?c=${this.class.id}&s=1`);
            let tid: string = res.data.match(/(?<=var tid = ')(.*?)(?=';)/)[0];
            res.data = res.data.replace(/\r?\n/g, "");
            let ggk: any = res.data.match(/(?<=var )ggk = {(.*?)}};/)[0];
            if (!tid || !ggk) throw new Error("ggk또는 tid를 찾을 수 없습니다.");
            eval(ggk);
            let send_data: any[] = [];
            if (game === 4 && this.set.type === "1") send_data.push(ggk.d(100, 0));
            else if (game === 4 && this.set.type === "5") for (let i = 0; i < 20; i++) send_data.push(ggk.d(50, 0));
            for (var i = 0; i < score / (game === 4 ? 100 : 10); i++) send_data.push(ggk.d(game === 4 ? 100 : 10, 1));
            // let data = {
            //     set_idx: this.set.id,
            //     // arr_key: ggk.a(),
            //     // arr_score: send_data,
            //     tid,
            //     activity: Number(game),
            // };
            let data: FormData = new FormData();
            data.append("set_idx", this.set.id);
            for (const v of ggk.a()) data.append("arr_key[]", v);
            for (let i = 0; i < send_data.length; i++) Object.keys(send_data[i]).forEach(v => data.append(`arr_score[${i}][${v}]`, send_data[i][v]));
            data.append("tid", tid);
            data.append("activity", game);

            await this.client.post("https://www.classcard.net/Match/save", data).then(res => { if (!res.data || res.data.result !== "ok") throw new Error("저장 실패 msg: " + res.data.msg); });

            let rank: { [key: string]: string | null } = {
                "class": null,
                "all": null,
            };
            if (fetchRank) {
                try {
                    let res: AxiosResponse = await this.client.post("https://www.classcard.net/MainAsync/getRank", transformRequest({
                        user_idx: this.user.id,
                        class_idx: this.class.id,
                        set_idx: this.set.id,
                        activity: game,
                        limit: 44444,
                        current_score: score
                    }), { timeout: 5000 }).catch(() => false) as AxiosResponse;
                    if (res && res.data) for (const t of ["class", "all"]) {
                        let rankObj = res.data[t + "_rank_list"].find((x: any) => x.is_me === 1);
                        if (!rankObj) rank[t] = t === "class" ? "반 순위를 보고싶다면 세트 목록 가져오기 -> 반 선택 -> 세트 설정 후 실행해주세요." : "순위가 44444등 보다 낮습니다.";
                        else rank[t] = rankObj.rank;
                    };
                } catch { };
            };
            return {
                success: true,
                message: "성공",
                data: {
                    game,
                    score,
                    rank
                }
            };
        } catch (e) {
            if (e instanceof Error) return {
                success: false,
                message: e.message,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            };
        };
    };
};

export class QuizBattle extends EventEmitter {
    private ws!: Websocket.WebSocket;
    battleID: number;
    private pongTimer!: NodeJS.Timeout;
    battleInfo!: {
        b_mode: number,
        test_id: number,
        test_time: number,
        b_user_idx: string,
        test_random: boolean,
        b_name: string,
        set_idx: number,
        set_name: string,
        set_type: number,
        quest_list: {
            test_card_idx: string,
            front: string,
            back: string,
            img_path: string,
            audio_path: string,
            example_sentence: string,
            q_option: string,
            subjective_yn: string,
            answer_option_no: string,
            option_info: [],
            example_front: string,
            example_back: string,
            example_data: string,
            back_data: string,
            front_quest: [],
            back_quest: [],
            exam_quest: [],
            weight: number
        }[]
    };
    userName: string;
    ready: boolean;
    joined: boolean;
    score: number;
    correct: number;
    wrong: number;
    classAvg: number;
    round: {
        remaining: number;
        correct: number;
        wrong: number;
        quest: { card_idx: string, score: number, correct_yn: number }[]
    };
    b_quest_idx: number;
    constructor(battleID: number) {
        super();
        this.battleID = battleID;
        this.score = 1000;
        this.correct = 0;
        this.wrong = 0;
        this.classAvg = 0;
        this.ready = false;
        this.joined = false;
        this.userName = "";
        this.round = {
            remaining: 5,
            correct: 0,
            wrong: 0,
            quest: []
        };
        this.b_quest_idx = 0;
    };

    init(): Promise<boolean> {
        return new Promise((resolve) => {
            let port = 800;
            if (this.battleID > 18999 && this.battleID < 28000) {
                port = 801;
            } else if (this.battleID > 27999 && this.battleID < 37000) {
                port = 802;
            } else if (this.battleID > 36999 && this.battleID < 46000) {
                port = 803;
            } else if (this.battleID > 45999 && this.battleID < 55000) {
                port = 804;
            } else if (this.battleID > 54999 && this.battleID < 64000) {
                port = 805;
            } else if (this.battleID > 63999 && this.battleID < 73000) {
                port = 806;
            } else if (this.battleID > 72999 && this.battleID < 82000) {
                port = 807;
            } else if (this.battleID > 81999 && this.battleID < 91000) {
                port = 808;
            } else if (this.battleID > 90999 && this.battleID < 100000) {
                port = 809;
            };
            this.ws = new Websocket("wss://mobile3.classcard.net/wss_" + port);
            this.ws.on("message", (m: Websocket.RawData) => this.onMessage(m)); // 일부러 () => 한거임. onMessage에서 this가 Websocket의 this로 인식 됨.
            this.ws.on("open", async () => {
                this.sendPong();
                this.sendMessage({
                    battle_id: this.battleID,
                    cmd: "b_check",
                    is_auto: false,
                    major_ver: 8,
                    minor_ver: 0
                });
                while (!this.ready) await sleep(500);
                resolve(true);
            });
        });
    };

    sendMessage(message: string | Object): void {
        if (this.ws.readyState === this.ws.CLOSED || this.ws.readyState === this.ws.CLOSING || this.ws.readyState === this.ws.CONNECTING) return;
        this.ws.send(typeof message === "object" ? JSON.stringify(message) : message);
        this.sendPong();
    };

    sendPong(): void {
        if (this.pongTimer) clearTimeout(this.pongTimer);
        this.pongTimer = setTimeout(() => this.sendMessage({ cmd: 'pong' }), 10000);
    };

    addScore(correct: boolean): void {
        this.b_quest_idx++;
        if (this.b_quest_idx >= this.battleInfo.quest_list.length) {
            this.b_quest_idx = 0;
            this.makeQuest();
        };
        let quest = this.battleInfo.quest_list[this.b_quest_idx];
        this.round.remaining--;
        this.round.quest.push({
            card_idx: quest.test_card_idx,
            score: correct ? (100 * (quest?.weight || 1)) : 0,
            correct_yn: correct ? 1 : 0
        });
        if (correct) {
            this.round.correct++;
            this.correct++;
        } else {
            this.round.wrong++;
            this.wrong++;
        };
        this.score += correct ? (100 * (quest?.weight || 1)) : 0;
        if (this.round.remaining == 0) {
            if (this.round.wrong <= 0) this.score += 100;
            this.sendMessage({
                "cmd": "b_get_rank",
                "total_score": this.score,
                "unknown": 0,
                "quest": this.round.quest
            });
            this.round = {
                remaining: 5,
                correct: 0,
                wrong: 0,
                quest: []
            };
        };
    };

    async join(name: string) {
        this.userName = name;
        this.sendMessage({
            cmd: "b_join",
            battle_id: this.battleID,
            browser: "Chrome",
            is_add: 0,
            is_auto: false,
            major_ver: 8,
            minor_ver: 0,
            platform: "Windows 10",
            user_name: this.userName,
        });
        while (!this.joined) await sleep(500);
        return true;
    };

    leave(): boolean {
        if (this.ws.readyState !== this.ws.OPEN) return false;
        this.ws.close();
        return true;
    };

    async onMessage(message: Websocket.RawData) {
        let data: any = JSON.parse(message.toString());
        if (data.cmd === "b_check") {
            if (data.result == "fail") {
                this.ws.close();
                this.emit("error", (data.reason || "알 수 없는 오류입니다.") + " (1)");
                return;
            } else {
                this.ready = true;
            };
        };
        if (data.cmd === "b_join" && data.result === "ok") {
            if (data.b_mode === 2 || data.set_type === 5) {
                this.emit("error", "이 배틀 형식은 지원하지 않습니다. (2)");
                return;
            };
            this.battleInfo = {
                b_mode: data.b_mode,
                test_id: data.test_id,
                test_time: data.test_time,
                b_user_idx: data.b_user_idx,
                test_random: data.test_random,
                b_name: data.b_name,
                set_idx: data.set_idx,
                set_name: data.set_name,
                set_type: data.set_type,
                quest_list: []
            };
            await axios.post("https://b.classcard.net/ClassBattle/battle_quest", "test_id=" + this.battleInfo.test_id).then(res => this.battleInfo.quest_list = res.data.quest_list);
            this.makeQuest();
            this.sendMessage({
                cmd: "b_join",
                battle_id: this.battleID,
                browser: "Chrome",
                is_add: 1,
                is_auto: false,
                major_ver: 8,
                minor_ver: 0,
                platform: "Windows 10",
                user_name: this.userName,
            });
        };
        if (data.cmd === "b_team") this.joined = true;
        if (data.cmd === "b_out") {
            if (data.is_today) this.emit("error", "선생님이 오늘 자정까지 접속을 차단하였습니다. (3)");
            else this.emit("error", "선생님께서 배틀을 종료하셨거나 오류입니다. (4)");
            return;
        };
        if (data.avg_score) this.classAvg = data.avg_score;
        if (data.cmd === "b_test_start") {
            await sleep(3000);
            this.emit("start");
        };
        if (data.cmd === "b_test_end") {
            this.sendMessage({
                "cmd": "b_get_rank",
                "total_score": this.score,
                "unknown": 0,
                "quest": []
            });
            this.emit("end");
        };
    };

    makeQuest(): void { //클래스카드에서 가져옴. 코드 정리 한거임. 더 하기 귀찮ㅇ...
        if (this.battleInfo.set_type == 5) return;

        var items = [];
        var item;
        if (this.battleInfo.set_type == 4) {
            while (item = this.battleInfo.quest_list.shift()) {
                item.q_option = '2';
                item.option_info = item.front_quest;
                items.push(item);
            };
        } else {
            var total_cnt = this.battleInfo.quest_list.length;
            var es_cnt = Math.floor(total_cnt * 0.1);
            var img_cnt = Math.floor(total_cnt * 0.1);
            var audio_cnt = Math.floor(total_cnt * 0.1);
            var make_cnt = 0;
            var limit_cnt = 0;
            var loop_cnt = 0;

            if (audio_cnt > 0) {
                fy(this.battleInfo.quest_list);
                make_cnt = 0;
                loop_cnt = 0;
                limit_cnt = this.battleInfo.quest_list.length;

                while (item = this.battleInfo.quest_list.shift()) {
                    loop_cnt++;

                    if (!item.audio_path || item.audio_path == '0' || item.back_quest.length == 0 || item.subjective_yn == '1') {
                        this.battleInfo.quest_list.push(item);
                        if (loop_cnt < limit_cnt) continue;
                        else break;
                    };

                    item.q_option = '5';
                    item.option_info = item.back_quest;
                    items.push(item);
                    make_cnt++;

                    if (make_cnt >= audio_cnt || loop_cnt >= limit_cnt) break;
                };
            };

            if (es_cnt > 0) {
                fy(this.battleInfo.quest_list);
                make_cnt = 0;
                loop_cnt = 0;
                limit_cnt = this.battleInfo.quest_list.length;

                while (item = this.battleInfo.quest_list.shift()) {
                    loop_cnt++;

                    if (item.example_sentence === undefined || item.example_sentence == null || item.example_sentence.length == 0 || item.subjective_yn == '1') {
                        this.battleInfo.quest_list.push(item);
                        if (loop_cnt < limit_cnt) continue;
                        else break;
                    };

                    item.q_option = '3';
                    item.option_info = item.exam_quest;
                    items.push(item);
                    make_cnt++;

                    if (make_cnt >= es_cnt || loop_cnt >= limit_cnt) break;
                };
            };

            if (img_cnt > 0) {
                fy(this.battleInfo.quest_list);
                make_cnt = 0;
                loop_cnt = 0;
                limit_cnt = this.battleInfo.quest_list.length;

                while (item = this.battleInfo.quest_list.shift()) {
                    loop_cnt++;

                    if (!item.img_path || item.subjective_yn == '1') {
                        this.battleInfo.quest_list.push(item);
                        if (loop_cnt < limit_cnt) continue;
                        else break;
                    };

                    item.q_option = '4';
                    item.option_info = item.front_quest;
                    items.push(item);
                    make_cnt++;

                    if (make_cnt >= img_cnt || loop_cnt >= limit_cnt) break;
                };
            };

            fy(this.battleInfo.quest_list);
            var half_cnt = Math.floor(this.battleInfo.quest_list.length / 2);
            make_cnt = 0;
            loop_cnt = 0;
            limit_cnt = this.battleInfo.quest_list.length;

            if (half_cnt > 0) {
                while (item = this.battleInfo.quest_list.shift()) {
                    loop_cnt++;

                    if (!item.back || item.front_quest.length == 0 || item.subjective_yn == '1') {
                        this.battleInfo.quest_list.push(item);
                        if (loop_cnt < limit_cnt) continue;
                        else break;
                    };

                    item.q_option = '2';
                    item.option_info = item.front_quest;
                    items.push(item);
                    make_cnt++;

                    if (make_cnt >= half_cnt || loop_cnt >= limit_cnt) break;
                }
            }

            fy(this.battleInfo.quest_list);
            loop_cnt = 0;
            limit_cnt = this.battleInfo.quest_list.length;
            while (item = this.battleInfo.quest_list.shift()) {
                loop_cnt++;

                if (!item.front || item.back_quest.length == 0 || item.subjective_yn == '1') {
                    this.battleInfo.quest_list.push(item);
                    if (loop_cnt < limit_cnt) continue;
                    else break;
                };

                item.q_option = '1';
                item.option_info = item.back_quest;
                items.push(item);

                if (loop_cnt >= limit_cnt) break;
            };

            fy(this.battleInfo.quest_list);
            loop_cnt = 0;
            limit_cnt = this.battleInfo.quest_list.length;
            while (item = this.battleInfo.quest_list.shift()) {
                loop_cnt++;

                if (!item.img_path || item.subjective_yn == '1') {
                    this.battleInfo.quest_list.push(item);
                    if (loop_cnt < limit_cnt) continue;
                    else break;
                }

                item.q_option = '4';
                item.option_info = item.front_quest;
                items.push(item);
                make_cnt++;

                if (loop_cnt >= limit_cnt) break;
            };

            fy(this.battleInfo.quest_list);
            loop_cnt = 0;
            limit_cnt = this.battleInfo.quest_list.length;
            while (item = this.battleInfo.quest_list.shift()) {
                loop_cnt++;

                item.q_option = '2';
                item.option_info = item.front_quest;
                items.push(item);

                if (loop_cnt >= limit_cnt) break;
            };
        };

        items.map(quest => {
            quest.weight = 1;
            if (quest && (quest.q_option == "3" || quest.q_option == "4" || quest.q_option == "5")) quest.weight = 2;
            return quest;
        });

        this.battleInfo.quest_list = items;
        this.battleInfo.quest_list.sort(function (a, b) {
            var a1 = Number(a.test_card_idx);
            var b1 = Number(b.test_card_idx);

            if (a1 < b1) return -1;
            if (a1 > b1) return 1;
            return 0;
        });
    };
};

export declare interface QuizBattle {
    on(event: "error", listener: (error: string) => void): this;
    on(event: "start", listener: () => void): this;
    on(event: "end", listener: () => void): this;
};

function transformRequest(jsonData: Object = {}): string {
    return Object.entries(jsonData).map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join('&');
};

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
};

function fy(a: Array<object>, b?: any, c?: any, d?: any): void { //클래스카드에서 가져옴.
    c = a.length;
    while (c) b = Math.random() * (--c + 1) | 0, d = a[c], a[c] = a[b], a[b] = d
};

export { ClassCard, learningType, activities };