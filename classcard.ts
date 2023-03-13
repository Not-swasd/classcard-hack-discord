import axios, { AxiosInstance } from 'axios';
import Websocket from "ws";
import EventEmitter from "events";
import { URLSearchParams } from "url";
import qs from "querystring";
// import fs from "fs";

type Folder = {
    "id": number,
    "name": string,
    "default": boolean
};

type Class = {
    id: number,
    name: string
};

type User = {
    name: string,
    id: number,
    token: string,
    isPro: boolean,
    isTeacher: boolean
};

enum UserType {
    "teacher" = 1,
    "student"
};

enum SchoolType {
    "school" = 1,
    "hakwon"
};

type Card = {
    "card_idx": number
};

type fm_user_set_log = {
    bookmark_yn: string
    class_idx: string
    deleted: string
    last_card: string
    last_learn_activity: Activity
    last_learn_activity_progress: string
    last_learn_date: string
    last_round: string
    last_section: string
    learn_status: string
    mem_learn_card_cnt: string
    recall_learn_card_cnt: string
    section_size: string
    set_idx: string
    spell_learn_card_cnt: string
    user_idx: string
    view_type: string
};

type ClassSet = {
    id: number,
    name: string,
    type: number,
    lastLearnDate: string,
    study_data: Card[],
    dirty: boolean,
    log: fm_user_set_log
};

type sync_set_class_v3_ResponseData = {
    fm_set: {
        set_idx: string,
        user_idx: string,
        name: string,
        set_type: SetType,
        front_lang: string,
        back_lang: string,
        map_img_path: string,
        open_yn: string,
        allow_edit_yn: string,
        bg_path: string,
        footer_yn: string,
        footer_text: string,
        map_type: string,
        map_box_color: string,
        card_cnt: string,
        is_wrong_answer: string,
        deleted: string,
        ts: string,
        link_url: string,
        ptn_idx: string,
        user_info: {
            user_idx: string,
            login_id: string,
            name: string,
            join_route: string,
            profile_img: string,
            profile_open_yn: string,
            user_type: string,
            premium_type: string,
            school_type: string
        }
    }[],
    fm_user_set_log: fm_user_set_log[],
    fm_class: any[],
    g_class: any[],
    fm_class_set: any[],
    fm_user_class_learn_set: any,
    cc_new_cnt: string
};

type sets_v4_ResponseData = {
    set_idx: string,
    user_idx: string,
    name: string,
    set_type: SetType,
    front_lang: string,
    back_lang: string,
    map_img_path: string,
    open_yn: string,
    allow_edit_yn: string,
    bg_path: string,
    footer_yn: string,
    footer_text: string,
    map_type: string,
    map_box_color: string,
    card_cnt: string,
    std_user_idx: string,
    test_status: string,
    test_finish_date: string,
    test_type: string,
    test_q_type: string,
    q_type1_cnt: string,
    q_type2_cnt: string,
    q_type3_cnt: string,
    q_type4_cnt: string,
    test_q_img_yn: string,
    case_sensitive_yn: string,
    display_type: string,
    goal_score: string,
    dirty: string,
    ptn_idx: string,
    is_close_subscription: string,
    learn_status: string,
    learner_cnt: string
}[];

enum SetType {
    "word" = 1, // 단어
    "term", // 용어
    "quest" = 4, // 문제
    "sentence", // 문장
    "drill", // 드릴
    "listen", // 듣기
    "answer" // 정답
};

enum LearnType {
    "암기학습" = "Memorize",
    "리콜학습" = "Recall",
    "스펠학습" = "Spell"
};

enum Activity {
    "Memorize" = 1,
    "Recall",
    "Spell",
    "매칭" = 4,
    "스크램블" = 4,
    "크래시",
};

const n = "mobile"; // "stg";
const defaultLogObject = {
    bookmark_yn: "0",
    class_idx: "", //class.id
    deleted: "0",
    last_card: "0",
    last_learn_activity: "0",
    last_learn_activity_progress: "0",
    last_learn_date: "", //ClassCard.getTimestamp()
    last_round: "0",
    last_section: "0",
    learn_status: "0",
    mem_learn_card_cnt: "0",
    recall_learn_card_cnt: "0",
    section_size: "", //set.study_data.length
    set_idx: "", //set.id
    spell_learn_card_cnt: "0",
    user_idx: "", //user.id
    view_type: "6"
};

export default class ClassCard {
    private client: AxiosInstance;
    public set: ClassSet;
    public class: Class;
    public user: User;
    public last_ts: string;
    constructor() {
        this.client = axios.create({ headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20A392 [FBAN/FBIOS;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/16.0.3;FBSS/3;FBID/phone;FBLC/es_LA;FBOP/5] ClassCard/1.0.339 u_idx:0" } });
        this.client.interceptors.response.use((response) => {
            if (response.data?.result?.s_ts && response.data.result.s_ts.length) this.last_ts = response.data.result.s_ts;
            return response;
        }, function (error) {
            return Promise.reject(error);
        });
        this.set = {
            id: 0,
            name: "",
            type: 0,
            lastLearnDate: "",
            study_data: [],
            dirty: false,
            log: JSON.parse(JSON.stringify(defaultLogObject))
        };
        this.class = {
            id: 0,
            name: ""
        };
        this.user = {
            name: "",
            id: 0,
            token: "",
            isPro: false,
            isTeacher: false,
        };
        this.last_ts = "";
    };

    async login(id: string, password: string) {
        try {
            var res = await this.client.post(`https://${n}.classcard.net/api/users/login`, qs.stringify({
                "login": 1,
                "id": id,
                "pw": password
            }), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    security_id: "20ff464a2eeeec5588a7acc3408adf0d"
                }
            }).catch(x => x?.response || x);
            if (res?.data?.result?.code !== 200) throw new Error("아이디 또는 비밀번호를 확인해주세요. (0)", { cause: res });
            this.user = {
                isTeacher: res.data.res_data.user_type === 1,
                name: res.data.res_data.name,
                id: res.data.res_data.user_idx,
                isPro: typeof Number(res.data.res_data.b_s_idx) === "number" && Number(res.data.res_data.b_s_idx) > 0,
                token: res.data.res_data.token,
            };
            (this.client.defaults.headers as any)["Authorization"] = this.user.id + " " + this.user.token;
            (this.client.defaults.headers as any)["User-Agent"] = String((this.client.defaults.headers as any)["User-Agent"]).replace("u_idx:0", "u_idx:" + this.user.id);
            this.set.log.user_idx = String(this.user.id);
            return {
                success: true,
                message: "로그인 성공",
                data: res.data
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async sendLearnAll(activity: Activity) {
        try {
            if (!this.set.id || !this.class.id) throw new Error((!this.class.id ? "클래스 외부에서는 학습이 제한되니, 클래스로 이동하세요." : "세트 아이디 또는 클래스 아이디를 설정해야합니다.") + " (0)");
            let before: number | undefined;
            let after: number;
            while (typeof before !== "number") before = await this.getTotal(false).then(t => t.data ? t.data[Activity[activity] as "Memorize" | "Recall" | "Spell"] : undefined);
            // console.log(before, "bef");
            let params = new URLSearchParams();
            let cardLogDate = Date.now();
            var card_log_ts = ClassCard.getTimestamp(cardLogDate);
            let p = {
                "base_info": {
                    "s_ts": "",
                    "set_idx": "",
                    "user_idx": this.user.id
                },
                "req_data": {
                    "fm_user_card_log": [{
                        "activity": activity,
                        "card_idx": -1,
                        "class_idx": this.class.id,
                        "deleted": 0,
                        "score": (Math.floor(before / 100) + 1),
                        "set_idx": this.set.id,
                        "ts": card_log_ts,
                        "user_idx": this.user.id
                    }],
                    "fm_user_class_learn_set": [],
                    "fm_user_play_score": [],
                    "fm_user_set_log": [] as any
                }
            };
            let obj: { [key in Activity]: "mem_learn_card_cnt" | "recall_learn_card_cnt" | "spell_learn_card_cnt" } = {} as any;
            obj[Activity["Memorize"]] = "mem_learn_card_cnt";
            obj[Activity["Recall"]] = "recall_learn_card_cnt";
            obj[Activity["Spell"]] = "spell_learn_card_cnt";
            for (const card of this.set.study_data) {
                p.req_data.fm_user_card_log.push({
                    "activity": activity,
                    "card_idx": card.card_idx,
                    "class_idx": this.class.id,
                    "deleted": 1,
                    "score": 1,
                    "set_idx": this.set.id as number,
                    "ts": card_log_ts,
                    "user_idx": this.user.id
                });
                this.set.log[obj[activity]] = String(Number(this.set.log[obj[activity]]) + 1);
            };
            p.req_data.fm_user_set_log.push({
                "bookmark_yn": "0", // 로컬에 북마크 저장하는 듯
                "class_idx": this.class.id,
                "deleted": "0",
                "dirty": this.set.dirty ? 1 : 0,
                "last_card": p.req_data.fm_user_card_log.at(-1)?.card_idx,
                "last_learn_activity": activity,
                "last_learn_activity_progress": this.set.log.last_learn_activity_progress,
                "last_learn_date": ClassCard.getTimestamp(Date.now() - this.set.study_data.length * 100),
                "last_round": this.set.log.last_round,
                "last_section": this.set.log.last_section,
                "learn_status": this.set.log.learn_status,
                "mem_learn_card_cnt": this.set.log["mem_learn_card_cnt"],
                "recall_learn_card_cnt": this.set.log["recall_learn_card_cnt"],
                "spell_learn_card_cnt": this.set.log["spell_learn_card_cnt"],
                "reg_date": "",
                "section_size": 10, // 한 구간 당 카드 개수 (정확하지 않음) this.set.study_data.length < 10 ? 10 : this.set.study_data.length
                "set_idx": this.set.id,
                "study_type": "0", //알 수 없음
                "ts": ClassCard.getTimestamp(cardLogDate - 1000),
                "user_idx": this.user.id,
                "view_type": "6" // 학습단위. n개씩 구간 단위로 학습: 1; 중요 카드 학습: 4; 전체 카드 학습: 6
            });
            params.append("p", JSON.stringify(p));
            const response = await this.client.post(`https://${n}.classcard.net/sync/upsync_user_study_log`, params).catch(() => undefined);
            if (response?.data?.result?.code !== 200) throw new Error("서버와의 통신에 실패했습니다. (1)");
            const fm_user_set_log: sync_set_class_v3_ResponseData["fm_user_set_log"] = response.data.res_data.fm_user_set_log;
            if (fm_user_set_log.find(x => x.set_idx == String(this.set.id))) this.set.log = fm_user_set_log.find(x => x.set_idx == String(this.set.id))!;
            after = await this.getTotal(false).then(t => t.data![Activity[activity] as "Memorize" | "Recall" | "Spell"] || 0);
            // console.log("aft", after);
            return {
                success: true,
                message: "성공",
                data: {
                    before,
                    after
                }
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async addGameScore(game: Activity, score: number, fetchRank?: boolean) {
        try {
            if (!this.set.id || !this.class.id) throw new Error((!this.class.id ? "클래스 외부에서는 학습이 제한되니, 클래스로 이동하세요." : "세트 아이디 또는 클래스 아이디를 설정해야합니다.") + " (0)");
            if (![4, 5].includes(game)) throw new Error("지원하지 않는 게임입니다. (1)");
            let params = new URLSearchParams();
            params.append("p", JSON.stringify({
                "base_info": {
                    "s_ts": "",
                    "set_idx": this.set.id.toString(),
                    "user_idx": this.user.id.toString()
                },
                "req_data": {
                    "fm_user_card_log": [],
                    "fm_user_class_learn_set": [],
                    "fm_user_play_score": [{
                        "activity": game,
                        "class_idx": this.class.id,
                        "score": score,
                        "score_idx": 0, // 알 수 없음
                        "set_idx": this.set.id,
                        "user_idx": this.user.id
                    }],
                    "fm_user_set_log": []
                }
            }));
            let res = await this.client.post(`https://${n}.classcard.net/sync/upsync_user_study_log`, params).catch(x => x?.response || x);
            if (res?.data?.result?.code !== 200 || res.data.res_data.fm_user_play_score != 1) throw new Error("알 수 없는 오류가 발생했습니다. (2)", { cause: res });
            let s_ts = res.data.result.s_ts;
            let rank: { [key: string]: string | number | null } = {
                "class": null,
                "all": null,
            };
            if (fetchRank) {
                try {
                    let res = await this.client.get(`https://${n}.classcard.net/api/sets/activity_rank_combine_v2?class_idx=${this.class.id}&set_idx=${this.set.id}&activity=${game}&current_score=${score}&limit=100`);
                    if (res.data.result.code !== 200) throw new Error("알 수 없는 오류가 발생했습니다. (3)", { cause: res });
                    for (const t of ["class", "all"]) {
                        let rankObj = res.data[t + "_rank_list"].find((x: any) => x.user_idx === String(this.user.id) && x.reg_date === s_ts);
                        if (!rankObj) rank[t] = t === "class" ? "오류" : "순위가 100등 보다 낮습니다.";
                        else rank[t] = rankObj.rank;
                    };
                } catch { };
            };
            return {
                success: true,
                message: "성공",
                data: {
                    rank
                }
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async getSet(setId: number) {
        try {
            if (!this.class.id) throw new Error("클래스 외부에서는 학습이 제한되니, 클래스로 이동하세요. (0)");
            var classSets = await this.getSetsFromClass(this.class.id).then(x => x?.data);
            if (!classSets) throw new Error("알 수 없는 오류가 발생했습니다. (1)");
            var params = new URLSearchParams();
            params.append("p", JSON.stringify({
                "base_info": {
                    "answer_v": -1,
                    "class_idx": this.class.id.toString() || "",
                    "drill_v": -1,
                    "listen_v": -1,
                    "s_ts": "",
                    "set_idx": setId.toString(),
                    "user_idx": this.user.id.toString()
                }
            }));
            var cardRes = await this.client.post(`https://${n}.classcard.net/sync/sync_card`, params).catch(x => x?.response || x);
            if (cardRes?.data?.result?.code !== 200) throw new Error("알 수 없는 오류가 발생했습니다. (2)");
            var set = classSets.find(x => x.id == setId)!;
            set.study_data = cardRes.data.res_data.fm_card.map((x: any) => {
                return {
                    card_idx: Number(x.card_idx)
                };
            }).filter((x: Card) => typeof x.card_idx === "number") || [];
            return { success: true, message: "", data: set };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async setSet(setId: number) {
        try {
            let res = await this.getSet(setId);
            if (!res?.success) throw new Error((res?.message || "Unknown Error.") + " (0)", { cause: res });
            this.set = res.data!;
            this.set.log.set_idx = String(this.set.id);
            this.set.log.section_size = String(this.set.study_data.length);
            return { success: true, message: "세트가 설정되었습니다.", data: this.set };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async getClass(classId: number) {
        try {
            let res = await this.getClasses();
            let classInfo = res?.data?.find(x => x.id === classId);
            if (!classInfo) throw new Error(res?.message || "알 수 없는 오류가 발생했습니다." + " (0)", { cause: res });
            return {
                success: true,
                message: "",
                data: classInfo
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async setClass(classId: number) {
        try {
            let res = await this.getClass(classId);
            if (!res?.data) throw new Error(res?.message + " (0)", { cause: res });
            this.class = res.data;
            this.set.log.class_idx = String(this.class.id);
            return { success: true, message: "클래스가 설정되었습니다.", data: this.set };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async getTotal(getTestScore: boolean = true) {
        try {
            if (!this.set.id || !this.class.id) throw new Error((!this.class.id ? "클래스 외부에서는 학습이 제한되니, 클래스로 이동하세요." : "세트 아이디 또는 클래스 아이디를 설정해야합니다.") + " (0)");
            let data: {
                Memorize: number,
                Recall: number,
                Spell: number,
                Test: number[]
            } = {
                Memorize: 0,
                Recall: 0,
                Spell: 0,
                Test: []
            };
            if (getTestScore) try {
                let test_score_log: { score: string }[] = await this.client.get(`https://${n}.classcard.net/api/classes/set_test_v5?set_idx=${this.set.id}&class_idx=${this.class.id}`).then(res => res.data.res_data.test_score_log.reverse());
                data.Test = test_score_log.map(x => Number(x.score));
            } catch {
                data.Test = [];
            };
            let params = new URLSearchParams();
            params.append("p", JSON.stringify({
                "base_info": {
                    "s_ts": "",
                    "set_idx": this.set.id || "",
                    "user_idx": this.user.id || "",
                    // "answer_v": -1,
                    // "listen_v": -1,
                    // "drill_v": -1
                }
            }));
            var sync_card: {
                "user_idx": string,
                "set_idx": string,
                "class_idx": string,
                "activity": string,
                "card_idx": string,
                "score": string,
                "deleted": string,
                "ts": string
            }[] = await this.client.post(`https://${n}.classcard.net/sync/sync_card`, params).then(res => res.data.res_data.fm_user_card_log).catch(() => undefined);
            const globalFilter = (c: typeof sync_card[number]) => c.deleted === "0" && c.user_idx && c.set_idx && c.class_idx == String(this.class.id);

            let done = sync_card.filter(c => c.score === "1" && c.card_idx !== "-1" && globalFilter(c));
            for (var t of (["Memorize", "Recall", "Spell"] as ("Memorize" | "Recall" | "Spell")[])) {
                data[t] = Math.round((done.filter(c => c.activity === String(Activity[t])).length / this.set.study_data.length! * 100) * 1e2) / 1e2;
            };
            let repeat = sync_card.filter(c => c.card_idx === "-1" && globalFilter(c));
            for (var t of (["Memorize", "Recall", "Spell"] as ("Memorize" | "Recall" | "Spell")[])) {
                data[t] += repeat.filter(c => c.activity === String(Activity[t])).map(c => Number(c.score)).reduce((partialSum, a) => partialSum + a, 0) * 100;
            };
            // fs.writeFileSync("./sync_card__d_X.json", JSON.stringify(sync_card.filter(c => c.deleted === "0"), null, 4));
            return {
                success: true,
                message: "성공",
                data
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    // 클래스가 무조건 설정되어야 세트에 대한 학습과 게임을 할 수 있기때문에 클래스만 남김.
    async getSetsFromClass(classId: number) { // folderName: "클래스" | "이용한 세트" | "만든 세트" | string
        try {
            // if (folderName === "클래스" && !classId) throw new Error("클래스 아이디를 인자로 전달해야 합니다. (0)");
            let sets: ClassSet[] = [];
            const syncedData = (await this.getSyncedData()).data;
            if (!syncedData) throw new Error("데이터를 가져오는데 실패했습니다. (0)");
            // if (folderName === "이용한 세트" || folderName === "만든 세트") {
            //     sets = syncedData.res_data.fm_set
            //         .filter(set => Number(set.set_idx) > 0 && set.is_wrong_answer === "0" && set.deleted === "0" && (folderName === "이용한 세트" ? syncedData.res_data.fm_user_set_log.find(s => s.set_idx === set.set_idx) : Number(set.user_idx) == this.user.id))
            //         .map(set => {
            //             return {
            //                 id: Number(set.set_idx),
            //                 name: set.name,
            //                 type: Number(set.set_type),
            //                 lastLearnDate: syncedData.res_data.fm_user_set_log.find(s => s.set_idx === set.set_idx)?.last_learn_date || ""
            //             };
            //         });
            // } else {
            //     var folders = await this.getFolders().then(r => r?.data || []);
            //     let res = await this.client.get(folderName === "클래스" ? (`https://${n}.classcard.net/api/classes/sets_v4?class_idx=${classId}`) : `https://${n}.classcard.net/api/sets/folder_sets?sl_idx=${folders.find(f => f.name === folderName)?.id}&offset=1&limit=1000&ft=`).catch(x => x?.response || x);
            //     if (res?.data?.result?.code !== 200) throw new Error("세트 목록을 가져오는 중 오류가 발생했습니다. (2)", { cause: res });
            //     if (folderName === "클래스" && classId) await this.setClass(classId).then(r => {
            //         if (!r?.success) throw new Error((r?.message || "알 수 없는 오류가 발생했습니다.") + " (3)", { cause: r });
            //     });
            //     sets = (res.data.res_data as { set_idx: string, name?: string, set_name?: string, set_type: string }[]).map(set => {
            //         return {
            //             id: Number(set.set_idx),
            //             name: set.name || set.set_name || "",
            //             type: Number(set.set_type),
            //             lastLearnDate: syncedData.res_data.fm_user_set_log.find(s => s.set_idx === set.set_idx)?.last_learn_date || ""
            //         };
            //     });
            // };
            const res = await this.client.get(`https://${n}.classcard.net/api/classes/sets_v4?class_idx=${classId}`).catch(x => x?.response || x);
            if (res?.data?.result?.code !== 200) throw new Error("세트 목록을 가져오는 중 오류가 발생했습니다. (2)", { cause: res });
            const data: sets_v4_ResponseData = res.data.res_data;
            await this.setClass(classId).then(r => {
                if (!r?.success) throw new Error((r?.message || "알 수 없는 오류가 발생했습니다.") + " (3)", { cause: r });
            });
            sets = data.map(set => {
                return {
                    id: Number(set.set_idx),
                    name: set.name,
                    type: Number(set.set_type),
                    lastLearnDate: syncedData.fm_user_set_log.find(s => s.set_idx === set.set_idx)?.last_learn_date || "",
                    dirty: set.dirty === "1",
                    study_data: [],
                    log: syncedData.fm_user_set_log.find(s => s.set_idx === set.set_idx) || Object.assign(JSON.parse(JSON.stringify(defaultLogObject)), { set_idx: set.set_idx, user_idx: this.user.id, class_idx: classId, last_learn_date: ClassCard.getTimestamp(), section_size: "10" })
                };
            });
            return {
                success: true,
                message: "성공",
                data: sets
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async getSyncedData() {
        try {
            let params = new URLSearchParams();
            params.append("p", JSON.stringify({
                "base_info": {
                    "g_class_full_sync": 1,
                    "s_ts": "",
                    "set_idx": "",
                    "user_idx": this.user.id
                }
            }));
            const response = await this.client.post(`https://${n}.classcard.net/sync/sync_set_class_v3`, params).catch(x => x?.response || x);
            if (response?.data?.result?.code !== 200) throw new Error("데이터를 동기화하는 중 오류가 발생했습니다. (0)", { cause: response });
            return {
                success: true,
                message: "성공",
                data: response.data.res_data as sync_set_class_v3_ResponseData
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async getClasses() {
        try {
            let params = new URLSearchParams();
            params.append("p", JSON.stringify({
                "base_info": {
                    "g_class_full_sync": 1,
                    "s_ts": "",
                    "set_idx": "",
                    "user_idx": this.user.id
                }
            }));
            let res = await this.client.post(`https://${n}.classcard.net/sync/sync_set_class_v3`, params).catch(x => x?.response || x);
            if (res?.data?.result?.code !== 200) throw new Error("클래스 목록을 가져오는 중 오류가 발생했습니다.", { cause: res });
            let classes = [...(res.data.res_data.fm_class as { class_idx: string, name: string }[]).map(c => {
                return {
                    id: Number(c.class_idx),
                    name: c.name
                };
            }), ...(res.data.res_data.g_class as { class_idx: string, name: string }[]).map(c => {
                return {
                    id: Number(c.class_idx),
                    name: c.name
                };
            })];
            return {
                success: true,
                message: "성공",
                data: classes
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async getFolders() {
        try {
            let res = await this.client.get(`https://${n}.classcard.net/api/sets/folders`).catch(x => x?.response || x);
            if (!res?.data?.res_data) throw new Error("폴더 목록을 가져오는 중 오류가 발생했습니다. (0)", { cause: res });
            let folders: Folder[] = [
                {
                    "name": "이용한 세트",
                    "id": 0,
                    "default": true
                },
                {
                    "name": "만든 세트",
                    "id": 0,
                    "default": true
                }
            ]; // sl_
            // if (this.user.isTeacher) folders.push({ "name": "구독중인 폴더", "id": 0, "default": true });
            res.data.res_data.forEach((i: {
                "sl_idx": string,
                "sl_order": string,
                "sl_type": string,
                "img_path": unknown,
                "open_yn": string,
                "allow_edit_yn": string,
                "set_order_type": string,
                "set_cnt": string,
                "owner_user_idx": string,
                "sl_name": string,
                "order_type": string,
                "cat": unknown,
                "publisher": unknown
            }) => i.sl_name && i.sl_idx && folders.push({ "name": i.sl_name, "id": Number(i.sl_idx), "default": false }));
            return {
                success: true,
                message: "성공",
                data: folders
            };
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    async postTest() {
        try {
            if (!this.set.id || !this.class.id) throw new Error((!this.class.id ? "클래스 외부에서는 학습이 제한되니, 클래스로 이동하세요." : "세트 아이디 또는 클래스 아이디를 설정해야합니다.") + " (0)");
            var res = await this.client.get(`https://${n}.classcard.net/api/classes/set_test_v5?set_idx=${this.set.id}&class_idx=${this.class.id}`).catch(x => x?.response || x);
            if (res?.data?.result?.code !== 200) throw new Error("알 수 없는 오류가 발생했습니다. (1)");
            var max_try_cnt = res.data.res_data.max_try_cnt === "0" ? 70 : Number(res.data.res_data.max_try_cnt);
            if (max_try_cnt <= res.data.res_data.test_score_log.length) throw new Error("이 테스트는 최대 " + max_try_cnt + "번 시도할 수 있습니다. (2)");
            let current = res.data.res_data.test_score_log.length + 1;
            var res = await this.client.post(`https://${n}.classcard.net/api/classes/start_test_v3`, qs.stringify({
                "class_idx": this.class.id,
                "is_only_wrong": 0, // 알 수 없음
                "set_idx": this.set.id,
            })).catch(x => x?.response || x);
            if (res?.data?.result!.code !== 200) throw new Error("알 수 없는 오류가 발생했습니다. (3)", { cause: res });
            let params = new URLSearchParams();
            params.append("class_idx", String(this.class.id));
            params.append("is_only_wrong", "0"); // 알 수 없음
            params.append("question", JSON.stringify(res.data.res_data.question.map((q: any) => {
                return {
                    "card_idx": q.card_idx,
                    "test_card_idx": q.test_card_idx,
                    "is_pre_user": "0", // 알 수 없음
                    "correct_yn": "1",
                    "subjective_yn": q.subjective_yn,
                    "user_input": q.subjective_yn === "1" ? q.front : q.answer_option_no, // 알 수 없음
                    "answer": q.subjective_yn === "1" ? q.front : q.option_info.find((o: any) => o.option_idx === q.answer_option_no)?.option_text, // 알 수 없음
                };
            })));
            params.append("score", "100");
            params.append("score_idx", res.data.res_data.score_idx);
            params.append("set_idx", String(this.set.id));
            var res = await this.client.post(`https://${n}.classcard.net/api/classes/submit_test_v2`, params).catch(x => x?.response || x);
            if (res?.data?.result?.code !== 200) throw new Error("알 수 없는 오류가 발생했습니다. (4)", { cause: res });
            return {
                success: true,
                message: `${current}차 테스트 만점 제출 완료.`,
                data: res.data
            }
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message,
                error: e as Error
            };
        };
    };

    static getTimestamp(t?: number) {
        return `${new Date(t || Date.now()).getFullYear()}-${(new Date(t || Date.now()).getMonth() + 1).toString().length === 1 ? "0" : ""}${new Date(t || Date.now()).getMonth() + 1}-${(new Date(t || Date.now()).getDate()).toString().length === 1 ? "0" : ""}${new Date(t || Date.now()).getDate()} ${(new Date(t || Date.now()).getHours()).toString().length === 1 ? "0" : ""}${new Date(t || Date.now()).getHours()}:${(new Date(t || Date.now()).getMinutes()).toString().length === 1 ? "0" : ""}${new Date(t || Date.now()).getMinutes()}:${(new Date(t || Date.now()).getSeconds()).toString().length === 1 ? "0" : ""}${new Date(t || Date.now()).getSeconds()}`;
    };
};

export class QuizBattle extends EventEmitter {
    private ws!: Websocket.WebSocket;
    private pongTimer!: NodeJS.Timeout;
    battleID: number;
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
    bypassCheck: boolean;
    constructor(battleID: number, bypassCheck: boolean = false) {
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
        this.bypassCheck = bypassCheck;
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
            this.ws.on("message", (m) => this.onMessage(m));
            this.ws.on("close", () => this.emit("error", "서버와 연결이 끊겼습니다."));
            this.ws.on("open", async () => {
                this.#sendPong();
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

    sendMessage(message: string | Object) {
        if (this.ws.readyState === this.ws.CLOSED || this.ws.readyState === this.ws.CLOSING || this.ws.readyState === this.ws.CONNECTING) return;
        this.ws.send(typeof message === "object" ? JSON.stringify(message) : message);
        this.#sendPong();
    };

    #sendPong() {
        if (this.pongTimer) clearTimeout(this.pongTimer);
        this.pongTimer = setTimeout(() => this.sendMessage({ cmd: 'pong' }), 10000);
    };

    setScore(score: number, local?: boolean) {
        this.score = score;
        if (!local) this.sendMessage({
            "cmd": "b_get_rank",
            "total_score": this.score,
            "unknown": 0,
            "quest": this.round.quest
        });
    };

    mark(correct: boolean) {
        if (!this.b_quest_idx) this.b_quest_idx = 0;
        let quest = this.battleInfo.quest_list[this.b_quest_idx];
        this.round.remaining--;
        this.round.quest.push({
            card_idx: quest.test_card_idx,
            score: correct ? (100 * (quest.weight || 1)) : 0,
            correct_yn: Number(correct) // correct ? 1 : 0 
        });
        if (correct) {
            this.round.correct++;
            this.correct++;
        } else {
            this.round.wrong++;
            this.wrong++;
        };
        this.score += correct ? (100 * (quest.weight || 1)) : 0;
        if (this.round.remaining == 0) {
            if (this.round.wrong <= 0) this.score += 100; // 5문제 모두 맞을 때 보너스 점수
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
        this.b_quest_idx++;
        if (this.b_quest_idx >= this.battleInfo.quest_list.length) {
            this.b_quest_idx = 0;
            this.makeQuest();
        };
        return {
            nextQuestion: this.battleInfo.quest_list[this.b_quest_idx]
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
            platform: "Android",
            user_name: this.userName,
        });
        while (!this.joined) await sleep(500);
        return true;
    };

    leave() {
        if (this.ws.readyState !== this.ws.OPEN) return false;
        this.ws.close();
        return true;
    };

    async onMessage(message: Websocket.RawData) {
        let data: any = JSON.parse(message.toString());
        if (data.cmd === "b_check") {
            if (data.result == "fail") {
                this.ws.close();
                this.emit("error", (data.reason || "알 수 없는 오류가 발생했습니다.") + " (1)");
                return;
            } else {
                this.ready = true;
            };
        };
        if (data.cmd === "b_join" && data.result === "ok") {
            if ((data.b_mode === 2 || data.set_type === 5) && !this.bypassCheck) {
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
            this.battleInfo.quest_list = await axios.post("https://b.classcard.net/ClassBattle/battle_quest", "test_id=" + this.battleInfo.test_id).then(res => res.data.quest_list);
            this.makeQuest();
            this.sendMessage({
                cmd: "b_join",
                battle_id: this.battleID,
                browser: "Chrome",
                is_add: 1,
                is_auto: false,
                major_ver: 8,
                minor_ver: 0,
                platform: "Android",
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
            await sleep(2000);
            this.sendMessage({
                "cmd": "b_get_rank",
                "total_score": this.score,
                "unknown": 0,
                "quest": this.round.quest
            });
            this.emit("end");
        };
    };

    makeQuest() { // 클래스카드에서 가져옴.
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
                QuizBattle.fy(this.battleInfo.quest_list);
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
                QuizBattle.fy(this.battleInfo.quest_list);
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
                QuizBattle.fy(this.battleInfo.quest_list);
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

            QuizBattle.fy(this.battleInfo.quest_list);
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

            QuizBattle.fy(this.battleInfo.quest_list);
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

            QuizBattle.fy(this.battleInfo.quest_list);
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

            QuizBattle.fy(this.battleInfo.quest_list);
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

    static fy(a: Array<object>, b?: any, c?: any, d?: any) { // 클래스카드에서 가져옴.
        c = a.length;
        while (c) b = Math.random() * (--c + 1) | 0, d = a[c], a[c] = a[b], a[b] = d
    };
};

export declare interface QuizBattle {
    on(event: "error", listener: (error: string) => void): this;
    on(event: "start", listener: () => void): this;
    on(event: "end", listener: () => void): this;
};

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export { ClassCard, LearnType, Activity, SetType, Folder, Class, User, Card, UserType, SchoolType, ClassSet };

/*
fetch("https://stg.classcard.net/LoginProc/regist", {
  "headers": {
    "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Chrome OS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrer": "https://stg.classcard.net/Login/regist?m=reg&s=",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": BODY,
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});

Student regist body:
qs.stringify({
    "birthday": "20000404",
    "class_idx": "-1",
    "class_type": "c",
    "day": "4",
    "email": "이메일 주소",
    "email_alarm_yn": "0",
    "email_domain": "이메일 도메인",
    "external_id": "",
    "g_class_idx": "-1",
    "hp": "전화번호",
    "join_client": "1",
    "join_route": "1",
    "login_id": "test121212",
    "login_pw": "test121212",
    "month": "4",
    "name": "asdasd",
    "over_14_yn": "1",
    "parent_hp": "",
    "parent_name": "",
    "profile_img": "",
    "sess_key": "",
    "user_type": "2",
    "year": "2000"
});

Teacher(school):
qs.stringify({
    "auth_code": "전화번호 인증코드",
    "birthday": "",
    "born_day": "",
    "born_month": "",
    "born_year": "",
    "class_idx": "-1",
    "class_type": "c",
    "email": "이메일 주소",
    "email_alarm_yn": "0",
    "email_domain": "이메일 도메인",
    "external_id": "",
    "g_class_idx": "-1",
    "hp": "전화번호",
    "join_client": "1",
    "join_route": "1",
    "login_id": "아이디",
    "login_pw": "비밀번호",
    "name": "이름을 적어주세요.",
    "org_name": "재직중인 교육기관의 이름을 적어주세요.",
    "over_14_yn": "0",
    "profile_img": "",
    "school_type": "1",
    "sess_key": "",
    "user_type": "1"
});

Teacher(hakwon):
qs.stringify({
    "auth_code": "", // 전화번호 인증코드. 안넣어도 됨.
    "birthday": "",
    "born_day": "",
    "born_month": "",
    "born_year": "",
    "class_idx": "-1",
    "class_type": "c",
    "email": "이메일 주소",
    "email_alarm_yn": "0",
    "email_domain": "이메일 도메인",
    "external_id": "",
    "g_class_idx": "-1",
    "hp": "전화번호",
    "join_client": "1",
    "join_route": "1",
    "login_id": "아이디",
    "login_pw": "비밀번호",
    "name": "이름을 적어주세요.",
    "org_name": "재직중인 교육기관의 이름을 적어주세요.",
    "over_14_yn": "0",
    "profile_img": "",
    "school_type": "2",
    "sess_key": "", // 원래 c4bb13g44krp3saji0hff93e6c처럼 생겼지만 안넣어도 됨.
    "type-chk": "1",
    "user_type": "1"
});

    static async createAccount(type: UserType, accountInfo: {
        email: string,
        password: string,
        username: string,
        phone: string,

    }) {

    };
*/