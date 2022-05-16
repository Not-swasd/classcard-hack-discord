import axios, { Axios, AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
// import * as fs from "fs";
const FormData = require("form-data");

enum setType {
    "word" = "1", //단어
    "term" = "2", //용어
    "quest" = "4", //문제
    "sentence" = "5", //문장
    "drill" = "6", //드릴
    "listen" = "7", //듣기
    "answer" = "8" //정답
}
enum learningType {
    "암기학습" = "Memorize",
    "리콜학습" = "Recall",
    "스펠학습" = "Spell"
};
enum activities {
    "암기학습" = "1",
    "리콜학습" = "2",
    "스펠학습" = "3",
    "매칭" = "4",
    "스크램블" = "4",
    "크래시" = "5",
};
enum folder {
    "이용한 세트" = "Main",
    "만든 세트" = "make",
    "클래스" = "ClassMain"
};
const gameUrl = {
    "4": "Match",
    "5": "Crash",
};
class ClassCard {
    jar: CookieJar;
    client: Axios;
    set: {
        id: string,
        name: string,
        type: string,
        study_data: { card_idx: string }[],
        class: {
            id: string,
            name: string
        }
    };
    user: {
        name: string,
        id: string,
        isPro: boolean,
        isTeacher: boolean
    };
    constructor() {
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({ jar: this.jar, headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36" } }));
        this.set = {
            id: "",
            name: "",
            type: "",
            study_data: [],
            class: {
                id: "",
                name: ""
            }
        };
        this.user = {
            name: "",
            id: "",
            isPro: false,
            isTeacher: false,
        };
    };

    async getCookieValue(name: string): Promise<string> {
        try {
            return (await this.jar.getCookies("https://www.classcard.net")).map(cookie => cookie.toString()).find(cookie => cookie.startsWith(name))!.match(new RegExp(`(?<=${name}=)(.*?)(?=;)`))![0];
        } catch (e) {
            return "";
        };
    };

    getSetInfo() {
        return this.set;
    };

    getUserInfo() {
        return this.user;
    };

    async setSetInfo(setId: string): Promise<{ success: boolean, message: string, data?: { id: string, name: string, type: string, study_data: { card_idx: string }[], class: { id: string, name: string } }, error?: { message: string, stack: string } }> {
        try {
            let res: AxiosResponse = await this.client.get("https://www.classcard.net/set/" + setId).catch(() => { throw new Error("세트 정보를 가져올 수 없습니다.") });
            if (!res.data || res.data.includes("삭제된 세트") || res.data.includes("이 세트는 제작자가 비공개로 지정한 세트입니다")) throw new Error("세트 정보를 가져올 수 없습니다.");
            res.data = res.data.replace(/\r?\n/g, "");
            this.set.id = setId;
            this.set.name = res.data.match(/(?<=set-name-header">)(.*?)(?=<!-- <span)/)[0].trim();
            this.set.type = res.data.match(/(?<=set-icon revers )(.*?)(?=")/)[0];
            this.set.study_data = JSON.parse(res.data.match(/(?<=var study_data = )\[{(.*?)}\](?=;)/)[0]);
            this.set.study_data.forEach(x => Object.keys(x).forEach(key => key !== "card_idx" && delete x[key]));
            this.set.class.id = res.data.match(/(?<=var class_idx = )(.*?)(?=;)/)[0];
            this.set.class.name = res.data.match(/(?<=var class_name = ')(.*?)(?=';)/)[0];
            return { success: true, message: "세트 정보가 설정되었습니다.", data: this.set };
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

    async getSets(f: folder, classID?: string): Promise<{ success: boolean, message: string, data?: { id: string, name: string, type: string }[], error?: { message: string, stack: string } }> {
        try {
            if (f === "ClassMain" && !classID) f = folder["이용한 세트"];
            let res: AxiosResponse = await this.client.get(`https://www.classcard.net/${f}/${f === "ClassMain" ? classID : ""}`).catch(() => { throw new Error("세트 목록을 가져올 수 없습니다.") });
            let sets = (res.data.replace(/\r?\n/g, "").match(/(?<=<div class="set-items )(.*?)(?=(<\/a>|<\/span>)<span class="text-gray font-14 font-normal)/g) || []).map((htmlset: string) => { return { "name": htmlset.split('span class="set-name-copy-text">')[1], "id": htmlset.match(/(?<=data-idx=")([0-9]*?)(?=")/)![0], "type": htmlset.match(/(?<=data-type=")([0-9]*?)(?=")/)![0] } });
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
    };

    async getClasses(): Promise<{ success: boolean, message: string, data?: { id: string, name: string }[], error?: { message: string, stack: string } }> {
        try {
            let res: AxiosResponse = await this.client.get("https://www.classcard.net/Main").catch(() => { throw new Error("클래스 목록을 가져올 수 없습니다.") });
            let classes = (res.data.replace(/\r?\n/g, "").match(/(?<=<a class="left-class-items)(.*?)(?=<\/div><\/div><\/a>)/g) || []).map((htmlset: string) => { return { "name": htmlset.split('<div class="cc-ellipsis l1">')[1], "id": htmlset.match(/(?<=href="\/ClassMain\/)(.*?)(?=" >)/)![0] } });
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

    };

    async login(id: string, password: string) {
        try {
            await this.client.get("https://www.classcard.net");
            let session_key = await this.getCookieValue("ci_session");
            let res: AxiosResponse = await this.client.post("https://www.classcard.net/LoginProc", transformRequest({
                "sess_key": session_key,
                "redirect": "",
                "login_id": id,
                "login_pwd": password
            }));
            const reasons: { [key: string]: string } = {
                "id": "아이디",
                "pwd": "비밀번호"
            };
            if (!res || !res.data || res.data.result !== "ok") throw new Error(!res || !res.data ? "알 수 없는 오류입니다." : `${Object.keys(reasons).includes(res.data.msg) ? reasons[res.data.msg] : res.data.msg}가 잘못되었습니다.`);
            this.user.id = res.data.msg;
            res = await this.client.get("https://www.classcard.net/Main");
            res.data = res.data.replace(/\r?\n/g, "");
            this.user.isPro = !res.data.match(/(?<=<span class="label label-)(.*?)(?=<\/span>)/)[0].includes("STANDARD");
            let nt = res.data.match(/(?<=<br><span class="font-bold">)(.*?)(?=<\/span>)/)[0];
            if (nt) {
                this.user.isTeacher = nt.split('<span class="font-12">')[1].includes("선생님");
                this.user.name = nt.split('<span class="font-12">')[0].trim();
            };
            await this.getFolders(res.data).then(f => f.success && Object.keys(f.data).forEach(key => folder[key] = f.data[key]));
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
            if (!data) data = await this.client.get("https://www.classcard.net/Main").then(res => res.data.replace(/\r?\n/g, ""));
            let folders = {};
            data.match(/<div class="m-t-sm left-sl-list".*<\/div><\/div><\/a>\s*<\/div>/)[0].split("</a>").forEach((i: string) => {
                let folderName = (i.match(/(?<="left-sl-item">)(.*?)(?=<\/div>)/) || [""])[0].trim();
                let href = (i.match(/(?<=href="\/)(.*?)(?=">)/) || [""])[0].trim();
                if (!!folderName && !!href) folders[folderName] = href;
            });
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

    async getTotal(): Promise<{ success: boolean, message: string, data?: { Memorize: number, Recall: number, Spell: number }, error?: { message: string, stack: string } }> {
        try {
            if(!this.set.id) throw new Error("세트를 설정해주세요.");
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
    };

    async sendLearnAll(type: learningType, scoreCheck: boolean = true): Promise<{ success: boolean, message: string, data?: { before: number, after: number }, error?: { message: string, stack: string } }> {
        try {
            if(!this.set.id) throw new Error("세트를 설정해주세요.");
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
                before = scoreCheck && await this.getTotal().then(t => t.data[type]);
                // await this.client.post("https://www.classcard.net/ViewSetAsync/learnAll", data);
                await this.client.post("https://www.classcard.net/ViewSetAsync/resetAllLog", transformRequest({
                    set_idx: this.set.id,
                    activity,
                    user_idx: this.user.id,
                    view_cnt: this.set.study_data.length,
                }));
                after = scoreCheck && await this.getTotal().then(t => t.data[type]);
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
    };

    async sendScore(game: activities, score: number) {
        try {
            if(!this.set.id) throw new Error("세트를 설정해주세요.");
            if (!["4", "5"].includes(game)) throw new Error("지원하지 않는 게임입니다.");
            // let res: AxiosResponse = await this.client.get("https://www.classcard.net/set/" + this.set.id);
            // if(res.data.includes("세트 학습은 유료이용 학원/학교에서만 이용가능합니다. 선생님께 문의해 주세요.")) throw new Error(this.set.type + "세트 학습은 유료이용 학원/학교에서만 이용가능합니다. 선생님께 문의해 주세요.");
            // let url: string = "https://www.classcard.net/" + res.data.match(new RegExp(`(?<=chkCardCount2\\('\\/)${game === "5" ? "Crash" : "Match"}\\/(.*?)(?=', 'bottom_${game === "5" ? "crash" : "match"}'\\);)`))[0];
            // if (!url) throw new Error("알 수 없는 오류입니다.");
            let res: AxiosResponse = await this.client.get(`https://www.classcard.net/${gameUrl[game]}/${this.set.id}?c=${this.set.class.id}&s=1`);
            let tid: string = res.data.match(/(?<=var tid = ')(.*?)(?=';)/)[0];
            res.data = res.data.replace(/\r?\n/g, "");
            let ggk: any = res.data.match(/(?<=var )ggk = {(.*?)}};/)[0];
            if (!tid || !ggk) throw new Error("GGK, TID를 찾을 수 없습니다.");
            eval(ggk);
            let send_data: any[] = [];
            if (game === "4" && this.set.type === setType["word"]) send_data.push(ggk.d(100, 0));
            else if (game === "4" && this.set.type === setType["sentence"]) for (let i = 0; i < 20; i++) send_data.push(ggk.d(50, 0));
            for (var i = 0; i < score / (game === "4" ? 100 : 10); i++) send_data.push(ggk.d(game === "4" ? 100 : 10, 1));
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
            for (let i = 0; i < send_data.length; i++) {
                Object.keys(send_data[i]).forEach(v => data.append(`arr_score[${i}][${v}]`, send_data[i][v]));
            };
            data.append("tid", tid);
            data.append("activity", game);

            await this.client.post("https://www.classcard.net/Match/save", data).then(res => { if (!res.data || res.data.result !== "ok") throw new Error("저장 실패 msg: " + res.data.msg); });
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

function transformRequest(jsonData: Object = {}) {
    return Object.entries(jsonData).map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join('&');
};

export { ClassCard, learningType, folder, activities };
export default ClassCard;