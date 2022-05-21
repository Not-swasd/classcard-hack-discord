import { CategoryChannel, Client, Intents, Message, MessageEmbed, MessageComponent, Channel, TextChannel } from "discord.js";
import ClassCard from "./classcard";
import * as fs from "fs";
if (!fs.existsSync("./config.json")) {
    fs.writeFileSync("./config.json", JSON.stringify({ token: "", owners: [], prefix: "!", ticketCategory: "", ticketChannel: "" }, null, 4));
    process.exit(0);
};
if (!fs.existsSync("./users.json")) fs.writeFileSync("./users.json", "{}");
let config: {
    token: string,
    owners: string[],
    prefix: string,
    ticketCategory: string,
    ticketChannel: string
} = JSON.parse(fs.readFileSync("./config.json", "utf8"));
let users: {
    [key: string]: {
        id: string,
        password: string,
        channelID: string,
        setID: string
    }
} = JSON.parse(fs.readFileSync("./users.json", "utf8"));

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

client.on("ready", () => console.info("Logged in as " + client.user?.tag));

client.on("interactionCreate", async (interaction) => {
    if (!users[interaction.user.id]) users[interaction.user.id] = { id: "", password: "", channelID: "", setID: "" };
    fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
    let user = users[interaction.user.id];
    if (interaction.isButton()) {
        const channel = interaction.channel as TextChannel;
        if (!channel.topic?.includes("Created By " + client.user?.username)) return;
        if (interaction.customId === "create_ticket") {
            if (user.channelID && interaction.guild?.channels.cache.get(user.channelID)) return interaction.reply({ "embeds": [new MessageEmbed().setTitle("❌ Failed").setDescription(`이미 티켓이 존재합니다. 채널: <#${user.channelID}>`)], "ephemeral": true });
            let channel = await (interaction.guild?.channels.cache.get(config.ticketCategory) as CategoryChannel).createChannel(`${interaction.user.username.replace(" ", "-")
                .replace("@", "-").replace("#", "-").replace("[", "-").replace(",", "-").replace("`", "-")
                .replace("　", "-").replace(" ", "-").replace(' ', "-").replace(' ', '').replace("*", "-").replace("!", "-")
                .replace("$", "-").replace("%", "-").replace("^", "-").replace("&", "-").replace("*", "-").replace("(", "-").replace(")", "-")
                .replace("]", "-").replace("{", "-").replace("}", "-").replace(";", "-").replace(":", "-").replace("'", "-").replace("\"", "-")
                .replace("<", "-").replace(">", "-").replace(".", "-").replace("/", "-").replace("?", "-").replace("+", "-").replace("~", "-")
                .replace("!@#", "").toLowerCase()}＃${interaction.user.discriminator}（𝗜𝗗∶${interaction.user.id}）`, {
                "topic": "Created By " + client.user?.username + " | USER: " + interaction.user.id
            });
            user.channelID = channel.id;
            fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
            await channel.permissionOverwrites.create(interaction.user, { "VIEW_CHANNEL": true, "SEND_MESSAGES": true })
            await channel.send({
                "content": `<@${interaction.user.id}>`,
                "embeds": [new MessageEmbed().setTitle("원하는 메뉴를 선택해주세요.").setColor("GREEN")],
                "components": [
                    {
                        "type": 1,
                        "components": [
                            {
                                "type": 2,
                                "label": "클래스카드 아이디/비번 설정",
                                "style": 1,
                                "custom_id": "set_id_pass"
                            },
                            {
                                "type": 2,
                                "label": "세트 설정",
                                "style": 1,
                                "custom_id": "set_set"
                            }
                        ]
                    },
                    {
                        "type": 1,
                        "components": [
                            {
                                "type": 2,
                                "label": "암기학습",
                                "style": 3,
                                "custom_id": "s_memorize"
                            },
                            {
                                "type": 2,
                                "label": "리콜학습",
                                "style": 3,
                                "custom_id": "s_recall"
                            },
                            {
                                "type": 2,
                                "label": "스펠학습",
                                "style": 3,
                                "custom_id": "s_spell"
                            }
                        ]
                    },
                    {
                        "type": 1,
                        "components": [
                            {
                                "type": 2,
                                "label": "매칭/스크램블 게임",
                                "style": 3,
                                "custom_id": "s_match_scramble"
                            },
                            {
                                "type": 2,
                                "label": "크래시 게임",
                                "style": 3,
                                "custom_id": "s_crash"
                            },
                            {
                                "type": 2,
                                "label": "퀴즈배틀",
                                "style": 3,
                                "custom_id": "quiz_battle"
                            }
                        ]
                    },
                    {
                        "type": 1,
                        "components": [
                            {
                                "type": 2,
                                "label": "세트 가져오기",
                                "style": 3,
                                "custom_id": "get_sets"
                            }
                        ]
                    },
                    {
                        "type": 1,
                        "components": [
                            {
                                "type": 2,
                                "label": "채널 삭제하기",
                                "style": 4,
                                "custom_id": "delete_channel"
                            }
                        ]
                    }
                ]
            });
            interaction.reply({
                "embeds": [new MessageEmbed().setTitle("✅ Success").setDescription(`설정이 완료되었습니다. 채널: <#${channel.id}>`).setColor("GREEN")],
                "ephemeral": true
            });
            return;
        };
        if (!channel.topic.split("|")[1].includes(interaction.user.id)) return interaction.reply({ embeds: [new MessageEmbed().setTitle("❌ Failed").setDescription("티켓을 만든 유저만 사용할 수 있습니다.").setColor("RED")], ephemeral: true });
        if (interaction.customId.startsWith("s_") && !user.setID) return interaction.reply({ embeds: [new MessageEmbed().setTitle("❌ Failed").setDescription("세트를 설정한 뒤 사용해주세요.").setColor("RED")], ephemeral: true });
        if (interaction.customId === "delete_channel") {
            let message: Message = await interaction.reply({
                embeds: [new MessageEmbed().setTitle("⚠️ Warning").setDescription("정말 채널을 삭제하시겠습니까?").setColor("RED")], ephemeral: true, components: [
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
                ], fetchReply: true
            }) as Message;
            await message.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time: 0, componentType: "BUTTON" }).then(async (inter) => {
                if (inter.customId === "yes") {
                    await channel.delete();
                    user.channelID = "";
                    fs.writeFileSync("./users.json", JSON.stringify(users, null, 4));
                } else interaction.editReply({
                    embeds: [new MessageEmbed().setTitle("✅ Success").setDescription("취소되었습니다.").setColor("GREEN")],
                    components: []
                });
            }).catch(() => false);
            return;
        };
    };
});

client.on("messageCreate", async (message: Message) => {
    if (message.content.startsWith(config.prefix)) {
        const args = message.content.slice(config.prefix.length).split(" ");
        const cmd = args.shift()!.toLowerCase();
        if (cmd === "setup" && config.owners.includes(message.author.id) && !!message.guild) {
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
    };
});

client.login(config.token);