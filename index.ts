import { CategoryChannel, Client, Collection, Intents, Message, MessageEmbed, TextChannel } from "discord.js";
import { activities, ClassCard, learningType } from "./classcard";
import * as fs from "fs";
import * as crypto from "crypto";

if (!fs.existsSync("./config.json")) {
    fs.writeFileSync("./config.json", JSON.stringify({ token: "디스코드 봇 토큰", owners: ["대빵 디코 아이디"], prefix: "!", guild: "적지마", ticketCategory: "적지마", ticketChannel: "적지마" }, null, 4));
    console.info("config.json 설정좀");
    process.exit(0);
};
if (!fs.existsSync("./users.json")) fs.writeFileSync("./users.json", "{}");
let config: {
    token: string,
    owners: string[],
    prefix: string,
    guild: string,
    ticketCategory: string,
    ticketChannel: string
} = JSON.parse(fs.readFileSync("./config.json", "utf8"));
let secret: string = randPassword(32);
let users: {
    [key: string]: {
        id: string,
        password: string,
        channelID: string,
        messageID: string,
        setID: string
    }
} = JSON.parse(fs.readFileSync("./users.json", "utf8"));

let classes: { [key: string]: ClassCard } = {};

const client: Client = new Client({
    "intents": [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_WEBHOOKS
    ]
});

(async () => {
    console.info("잠시만 기다려주세요.");
    await Promise.all(Object.keys(users).map(async key => {
        try {
            let user = users[key];
            if (!classes[key]) classes[key] = new ClassCard();
            if (user.id && user.password) {
                classes[key].login(decrypt(user.id), decrypt(user.password));
                let res = await classes[key].login(decrypt(user.id), decrypt(user.password)).then(res => res?.success).catch(() => false);
                if (!res) {
                    user.id = "";
                    user.password = "";
                };
            };
            if (user.setID) {
                let res = user.setID && await classes[key].setSetInfo(user.setID).then(res => res?.success).catch(() => false);
                if (!res) user.setID = "";
            };
            fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
            client.once("ready", async () => {
                if (!user.channelID || !user.messageID) return;
                let guild = client.guilds.cache.get(config.guild);
                if (!guild) return;
                let channel = guild?.channels.cache.get(user.channelID) as TextChannel;
                if (!channel) return;
                let message = await channel.messages.fetch(user.messageID).catch(() => false);
                if (!message) {
                    channel.delete();
                    user.channelID = "";
                    user.messageID = "";
                    fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
                    return;
                };
                updateMessage(message, key, "edit", !user.id || !user.password ? "idPass" : !user.setID ? "set" : "");
            });
        } catch { };
    }));
    console.clear();
    client.login(config.token);
})();

process.on("unhandledRejection", (e) => console.error(e));
process.on("uncaughtException", (e) => console.error(e.stack));

client.on("ready", () => console.info("Logged in as " + client.user?.tag));

client.on("interactionCreate", async (interaction) => {
    if (!users[interaction.user.id]) users[interaction.user.id] = { id: "", password: "", channelID: "", messageID: "", setID: "" };
    fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
    let user = users[interaction.user.id];
    if (interaction.isButton()) {
        const channel = interaction.channel as TextChannel;
        if (!channel.topic?.includes("Created By " + client.user?.username)) return;
        if (!interaction.customId.endsWith("_modal")) await interaction.reply({ embeds: [new MessageEmbed().setTitle("⚙️ 잠시만 기다려주세요.").setColor("BLUE")], ephemeral: true });
        if (interaction.customId === "create_ticket") {
            let channel = interaction.guild?.channels.cache.get(user.channelID) as TextChannel;
            if (user.channelID && channel) await channel.delete();
            channel = await (interaction.guild?.channels.cache.get(config.ticketCategory) as CategoryChannel).createChannel(interaction.user.username.toLowerCase() /* ＃${interaction.user.discriminator} */, { "topic": "Created By " + client.user?.username + " | USER: " + interaction.user.id });
            user.channelID = channel.id;
            if (!classes[interaction.user.id]) classes[interaction.user.id] = new ClassCard();
            let message: Message = await updateMessage(channel, interaction.user.id, "send", !user.id || !user.password ? "idPass" : !user.setID ? "set" : "") as Message;
            if (message.id) user.messageID = message.id;
            fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
            await channel.permissionOverwrites.create(interaction.user, { "VIEW_CHANNEL": true, "SEND_MESSAGES": true });
            interaction.editReply({ "embeds": [new MessageEmbed().setTitle("✅ Success").setDescription(`설정이 완료되었습니다. 채널: <#${channel.id}>`).setColor("GREEN")] });
            return;
        };
        if (!channel.topic.split("|")[1].includes(interaction.user.id)) {
            interaction[interaction.replied ? "editReply" : "reply"]({ embeds: [new MessageEmbed().setTitle("❌ 티켓을 만든 유저만 사용할 수 있습니다.").setColor("RED")], ephemeral: true });
            return;
        };
        if (interaction.customId.startsWith("s_") && !user.setID) {
            interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 세트를 설정한 뒤 사용해주세요.").setColor("RED")] });
            return;
        };
        if (interaction.customId === "delete_channel") {
            let message: Message = await interaction.editReply({
                embeds: [new MessageEmbed().setTitle("⚠️ 정말 채널을 삭제하시겠습니까?").setColor("YELLOW")], components: [
                    {
                        "type": 1,
                        "components": [
                            {
                                "type": 2,
                                "label": "네",
                                "style": 4,
                                "custom_id": "yes"
                            },
                            {
                                "type": 2,
                                "label": "아니요",
                                "style": 1,
                                "custom_id": "no"
                            }
                        ]
                    }
                ]
            }) as Message;
            let i = await message.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time: 0, componentType: "BUTTON" }).then(async (inter) => {
                if (inter.customId === "yes") {
                    await channel.delete();
                    user.channelID = "";
                    user.messageID = "";
                    fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
                    return true;
                };
            }).catch(() => false);
            if (!i) interaction.editReply({
                embeds: [new MessageEmbed().setTitle("✅ 취소되었습니다.").setColor("GREEN")],
                components: []
            }).catch(() => false);
            return;
        };
        if (interaction.customId === "set_id_pass_modal") {
            interaction.showModal({
                "title": "아이디와 비밀번호를 입력해주세요.",
                "customId": "set_id_pass_modal",
                "components": [{
                    "type": 1,
                    "components": [{
                        "type": 4,
                        "custom_id": "id",
                        "label": "아이디",
                        "style": 1,
                        "min_length": 5,
                        "max_length": 20,
                        "placeholder": "아이디",
                        "required": true
                    }]
                },
                {
                    "type": 1,
                    "components": [{
                        "type": 4,
                        "custom_id": "password",
                        "label": "비밀번호",
                        "style": 1,
                        "min_length": 5,
                        "max_length": 4000,
                        "placeholder": "비밀번호",
                        "required": true
                    }]
                }],
            });
        };
        if (interaction.customId === "set_set_modal") {
            interaction.showModal({
                "title": "세트 정보를 입력해주세요.",
                "customId": "set_set_modal",
                "components": [{
                    "type": 1,
                    "components": [{
                        "type": 4,
                        "custom_id": "set_id",
                        "label": "세트 아이디",
                        "style": 1,
                        "min_length": 1,
                        "max_length": 20,
                        "placeholder": "0000000",
                        "required": true
                    }]
                }]
            });
        };
        if (interaction.customId === "get_sets") {
            let foldersResult = await classes[interaction.user.id].getFolders();
            if (!foldersResult || !foldersResult.success) {
                interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 폴더를 불러오지 못했습니다.").setColor("RED")] });
                return;
            };
            let folders: { id: string, name: string, isFolder: boolean }[] = [];
            Object.keys(foldersResult.data!).forEach(key => folders.push({
                id: foldersResult!.data![key],
                name: key,
                isFolder: true
            }));
            let classesResult = await classes[interaction.user.id].getClasses();
            if (!classesResult || !classesResult.success) {
                interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 클래스를 불러오지 못했습니다.").setColor("RED")] });
                return;
            };
            folders = [...classesResult.data!, ...folders];
            let message: Message = await interaction.editReply({
                embeds: [new MessageEmbed().setTitle("❓ 가져올 폴더나 클래스를 선택해주세요.").setColor("YELLOW")],
                components: [
                    {
                        "type": 1,
                        "components": [
                            {
                                "type": 3,
                                "custom_id": "class_select_1",
                                "options": folders.map(f => {
                                    return {
                                        "label": f.name,
                                        "value": f.isFolder ? f.name : f.id,
                                        "description": (f.isFolder ? "폴더" : "클래스"),
                                        // "emoji": {
                                        //     "name": "",
                                        //     "id": ""
                                        // }
                                    };
                                }),
                                "placeholder": "폴더나 클래스를 선택해주세요.",
                                "min_values": 1,
                                "max_values": 1
                            }
                        ]
                    }
                ]
            }) as Message;
            let i: string | false = await message.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time: 0, componentType: "SELECT_MENU" }).then((interaction) => interaction.values[0]).catch(() => false);
            if (!i) {
                interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 알 수 없는 오류입니다.").setColor("RED")], components: [] });
                return;
            };
            let setsResult = await classes[interaction.user.id].getSets(/[0-9]/.test(i) ? "클래스" : i, /[0-9]/.test(i) ? i : "");
            if (!setsResult || !setsResult.success || !setsResult.data) {
                interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 세트를 불러오는데 실패했습니다.").setColor("RED")], components: [] });
                return;
            };
            let sets: { name: string, id: string, type: number }[] = setsResult.data;
            interaction.editReply({
                embeds: [new MessageEmbed().setTitle(`✅ **${/[0-9]/.test(i) ? folders.find(x => x.id === i)?.name : i}**에 있는 세트 목록`).setColor("GREEN").setDescription(sets.length < 1 ? `이 ${/[0-9]/.test(i) ? "클래스" : "폴더"}에 세트가 하나도 없습니다.` : sets.map(s => `\`${s.name}\` (**${s.id}**)`).join("\n"))],
                components: []
            });
        };
        if (["s_memorize", "s_recall", "s_spell"].includes(interaction.customId)) {
            let result = await classes[interaction.user.id].sendLearnAll(learningType[((interaction.customId === "s_memorize" ? "암기" : interaction.customId === "s_recall" ? "리콜" : "스펠") + "학습") as "암기학습" | "리콜학습" | "스펠학습"]);
            if (!result || !result.success) {
                interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ " + (result?.message || "알 수 없는 오류입니다.")).setColor("RED")] });
                return;
            };
            interaction.editReply({ embeds: [new MessageEmbed().setTitle("✅ 학습 완료.").addField("before", String(result.data?.before) + "%", true).addField("after", String(result.data?.after) + "%", true).setColor("GREEN")] });
        };
        if (["s_match_scramble", "s_crash"].includes(interaction.customId)) {
            await interaction.editReply({ embeds: [new MessageEmbed().setTitle("❓ 원하는 점수를 입력해주세요.").setColor("YELLOW")] });
            let collected: Collection<string, Message<boolean>> | false = await channel.awaitMessages({
                filter: (m) => m.author.id === interaction.user.id,
                time: 30000,
                max: 1
            }).catch(() => interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 시간이 초과되었습니다.").setColor("RED")] }).then(() => false));
            if (!collected) return;
            await interaction.editReply({ embeds: [new MessageEmbed().setTitle("⚙️ 잠시만 기다려주세요.").setColor("BLUE")] });
            collected.first()?.delete();
            let score = parseInt(String(collected.first()?.content));
            let scoreUnit = interaction.customId === "s_match_scramble" ? 100 : 10;
            if (isNaN(score) || score > 990000 || score < scoreUnit) {
                interaction.editReply({ embeds: [new MessageEmbed().setTitle(`❌ 점수를 ${score % scoreUnit != 0 ? scoreUnit + "점 단위로" : isNaN(score) ? "숫자로만" : score > 990000 ? "990000점 이하로" : (scoreUnit + "점 이상으로")} 입력해주세요.`).setColor("RED")] });
                return;
            };
            let result = await classes[interaction.user.id].sendScore((interaction.customId === "s_match_scramble" ? activities["매칭"] : activities["크래시"]), score, true);
            if (!result || !result.success) {
                interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ " + (result?.message || "알 수 없는 오류입니다.")).setColor("RED")] });
                return;
            };
            let embed = new MessageEmbed().setTitle("✅ " + result.message).setColor("GREEN");
            if (result.data?.rank) {
                if (result.data.rank.all) embed.addField("전체 순위", result.data.rank.all.toString());
                if (result.data.rank.class) embed.addField("반 순위", result.data.rank.class.toString());
            };
            interaction.editReply({ embeds: [embed] });
        };
        if (interaction.customId === "quiz_battle") {
            await interaction.editReply({ "embeds": [new MessageEmbed().setTitle("❓ 배틀코드를 입력해주세요.").setColor("YELLOW")] });
            let collected: Collection<string, Message<boolean>> | false = await channel.awaitMessages({
                filter: (m) => m.author.id === interaction.user.id,
                time: 30000,
                max: 1
            }).catch(() => interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 시간이 초과되었습니다.").setColor("RED")] }).then(() => false));
            if (!collected) return;
            collected.first()?.delete();
            await interaction.editReply({ "embeds": [new MessageEmbed().setTitle("❓ 표시될 이름을 입력해주세요.").setColor("YELLOW")] });
            collected = await channel.awaitMessages({
                filter: (m) => m.author.id === interaction.user.id,
                time: 30000,
                max: 1
            }).catch(() => interaction.editReply({ embeds: [new MessageEmbed().setTitle("❌ 시간이 초과되었습니다.").setColor("RED")] }).then(() => false));
            if (!collected) return;
            await interaction.editReply({ embeds: [new MessageEmbed().setTitle("⚙️ 잠시만 기다려주세요.").setColor("BLUE")] });
            collected.first()?.delete();
        };
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === "set_id_pass_modal") {
            const id = interaction.fields.getTextInputValue("id");
            const password = interaction.fields.getTextInputValue("password");
            if (!classes[interaction.user.id]) classes[interaction.user.id] = new ClassCard();
            let loginResult = await classes[interaction.user.id].login(id, password);
            if (loginResult?.success) {
                user.id = encrypt(id);
                user.password = encrypt(password);
                user.setID = "";
                fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
                updateMessage(interaction.channel?.messages.cache.get(user.messageID), interaction.user.id, "edit", "set");
                interaction.reply({ embeds: [new MessageEmbed().setTitle("✅ 로그인 성공. 아이디와 비밀번호가 저장되었습니다.").setColor("GREEN")], ephemeral: true });
            } else {
                interaction.reply({ embeds: [new MessageEmbed().setTitle("❌ " + (loginResult?.message || "알 수 없는 오류입니다.")).setColor("RED")], ephemeral: true });
            };
        };
        if (interaction.customId === "set_set_modal") {
            let setID = interaction.fields.getTextInputValue("set_id");
            let result = await classes[interaction.user.id].setSetInfo(setID);
            if (result && result?.success) {
                user.setID = setID;
                fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
                updateMessage(interaction.channel?.messages.cache.get(user.messageID), interaction.user.id, "edit", "");
                let embed = new MessageEmbed().setTitle("✅ 세트가 설정되었습니다.").addField("이름", result.data?.name!).setColor("GREEN");
                let total = await classes[interaction.user.id].getTotal();
                if (total && total.data) embed.addField("현재 학습 진행도", `암기: ${total.data.Memorize}%\n리콜: ${total.data.Recall}%\n스펠: ${total.data.Spell}%`);
                embed.addField("카드 개수", String(result.data?.study_data.length) + "개", true);
                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [new MessageEmbed().setTitle("❌ 알 수 없는 오류입니다.").setColor("RED")], ephemeral: true });
            };
        };
    };
});

client.on("messageCreate", async (message: Message) => {
    if (message.content.startsWith(config.prefix)) {
        const args = message.content.slice(config.prefix.length).split(" ");
        const cmd = args.shift()!.toLowerCase();
        if (config.owners.includes(message.author.id)) {
            if (cmd === "setup" && !!message.guild) {
                if (!!config.ticketCategory && message.guild.channels.cache.has(config.ticketCategory)) {
                    let category: CategoryChannel = message.guild.channels.cache.get(config.ticketCategory) as CategoryChannel;
                    await Promise.all(category.children.map(async channel => await channel.delete()));
                    await category.delete();
                };
                if (!!config.ticketChannel && message.guild.channels.cache.has(config.ticketChannel)) await message.guild.channels.cache.get(config.ticketChannel)?.delete();
                let category = await message.guild.channels.create("TICKETS", { "type": "GUILD_CATEGORY", "permissionOverwrites": [{ "id": message.guild.roles.everyone.id, "allow": ["READ_MESSAGE_HISTORY"], "deny": ["VIEW_CHANNEL", "SEND_MESSAGES", "SEND_MESSAGES_IN_THREADS", "CREATE_PUBLIC_THREADS", "CREATE_PRIVATE_THREADS"] }] });
                config.ticketCategory = category.id;
                let channel = await category.createChannel("사용", { "topic": "Created By " + client.user?.username + " | DO NOT DELETE" });
                await channel.permissionOverwrites.edit(message.guild!.roles.everyone, { "VIEW_CHANNEL": true });
                config.ticketChannel = channel.id;
                config.guild = message.guild.id;
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4));
                await channel.send({
                    "embeds": [new MessageEmbed().setTitle("버튼을 눌러주세요.").setColor("GREEN")],
                    "components": [
                        {
                            "type": 1,
                            "components": [
                                {
                                    "type": 2,
                                    "label": "채널 만들기",
                                    "style": 3,
                                    "custom_id": "create_ticket"
                                }
                            ]
                        }
                    ]
                });
                let replied = await message.reply("설정 성공.");
                setTimeout(() => {
                    message.delete();
                    replied.delete();
                }, 5000);
            };

            if (cmd === "eval") {
                try {
                    let res = await eval(args.join(" "));
                    message.reply({ embeds: [new MessageEmbed().setTitle(`✅ Success`).setDescription(`\`\`\`xl\n${res}\`\`\``).setColor("GREEN").setTimestamp()] });
                } catch (e) {
                    message.reply({ embeds: [new MessageEmbed().setTitle(`❌ Failed`).setDescription(`\`\`\`xl\n${e}\`\`\``).setColor("RED").setTimestamp()] });
                };
            };

            if (cmd === "s") {
                message.delete().catch(() => false);
                secret = args[0];
            };
        }
    };
});

function encrypt(text: string) {
    try {
        let iv = crypto.randomBytes(8).toString("hex");
        const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
        return cipher.update(text, 'utf8', 'hex') + cipher.final('hex') + "'" + iv;
    } catch {
        return "";
    };
};

function decrypt(text: string) {
    try {
        let text2: string[] = text.split("'");
        const decipher = crypto.createDecipheriv('aes-256-cbc', secret, text2.pop()!);
        return decipher.update(text2[0], 'hex', 'utf8') + decipher.final('utf8');
    } catch {
        return "";
    };
};

function updateMessage(message: any, userID: string, s: string, disableMode: string = ""): Promise<unknown> | null {
    try {
        let disabled = disableMode === "idPass" || disableMode === "set";
        let components = [
            {
                "type": 1,
                "components": [
                    {
                        "type": 2,
                        "label": "클래스카드 아이디/비번 설정",
                        "style": 1,
                        "custom_id": "set_id_pass_modal",
                        "disabled": false
                    }
                ]
            }
        ];
        if (disableMode !== "idPass") components[0].components.push({
            "type": 2,
            "label": "세트 설정",
            "style": 1,
            "custom_id": "set_set_modal",
            "disabled": false
        });
        if (!disabled) {
            components.push({
                "type": 1,
                "components": [
                    {
                        "type": 2,
                        "label": "암기학습",
                        "style": 3,
                        "custom_id": "s_memorize",
                        "disabled": false
                    },
                    {
                        "type": 2,
                        "label": "리콜학습",
                        "style": 3,
                        "custom_id": "s_recall",
                        "disabled": false
                    },
                    {
                        "type": 2,
                        "label": "스펠학습",
                        "style": 3,
                        "custom_id": "s_spell",
                        "disabled": false
                    },
                    {
                        "type": 2,
                        "label": "테스트",
                        "style": 3,
                        "custom_id": "s_test",
                        "disabled": !config.owners.includes(userID)
                    }
                ]
            });
        }
        components.push({
            "type": 1,
            "components": [
                {
                    "type": 2,
                    "label": "퀴즈배틀",
                    "style": 3,
                    "custom_id": "quiz_battle",
                    "disabled": !config.owners.includes(userID)
                }
            ]
        });
        if (!disabled) {
            components[components.length - 1].components.unshift({
                "type": 2,
                "label": "매칭/스크램블 게임",
                "style": 3,
                "custom_id": "s_match_scramble",
                "disabled": disabled
            },
                {
                    "type": 2,
                    "label": "크래시 게임",
                    "style": 3,
                    "custom_id": "s_crash",
                    "disabled": disabled
                });
        };
        if (disableMode !== "idPass") components.push({
            "type": 1,
            "components": [{
                "type": 2,
                "label": "세트 목록 가져오기",
                "style": 3,
                "custom_id": "get_sets",
                "disabled": false
            }]
        });
        components.push({
            "type": 1,
            "components": [
                {
                    "type": 2,
                    "label": "채널 삭제하기",
                    "style": 4,
                    "custom_id": "delete_channel",
                    "disabled": false
                }
            ]
        });
        return message[s]({
            "content": `<@${userID}>`,
            "embeds": [new MessageEmbed().setTitle(disableMode === "idPass" ? "아이디와 비밀번호를 설정해주세요." : disableMode === "set" ? "세트를 설정해주세요." : "원하는 메뉴를 선택해주세요.").setColor(!disableMode ? "GREEN" : "YELLOW")],
            "components": components
        }).catch(() => false);
    } catch (e) {
        console.log(e)
    };
    return null;
};

function randPassword(length: number = 32) {
    let charsArray = ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "~!@#$%^&*()_+-={}|[]:<>?,./"];
    var i = "";
    var r = crypto.randomFillSync(new Uint32Array(length - charsArray.length));
    var n = charsArray.join("");
    for (var s = 0; s < r.length; s++) i += n.charAt(r[s] % n.length);
    return charsArray.forEach(((e) => {
        let ri = getRandomIndex(i.length + 1);
        i = i.substring(0, ri) + e.charAt(getRandomIndex(e.length)) + i.substring(ri);
    })), i
};

function getRandomIndex(e: number) {
    if (e < 0) return -1;
    var a = new Uint32Array(1);
    return crypto.randomFillSync(a), a[0] % e
};