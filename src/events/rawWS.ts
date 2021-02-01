import Eris from "eris";
import config from "../config";
import ClientEvent from "../util/ClientEvent";
import db from "../util/Database";
import { InteractionResponseType } from "../util/DiscordCommands/Constants";
import { ApplicationCommandInteractionDataOption, Interaction } from "../util/DiscordCommands/types";
import ExtendedMessage from "../util/ExtendedMessage";
import Redis from "../util/Redis";

export default new ClientEvent("rawWS", async function ({ op, d, s, t }) {
	const time = Date.now();
	if (op === 0 && t) {
		await Redis.incr(`stats:events:${t}`);
		this.ev.push({
			type: t,
			time
		});
		this.evTotal[t] = (this.evTotal[t] || 0) + 1;
		switch (t) {
			case "INTERACTION_CREATE": {
				const data = d as Interaction;

				switch (data.type) {
					case 1: {
						await Redis.incr("stats:interactions:ping");
						// console.log("Interaction Ping");
						break;
					}

					case 2: {
						const v = await this.h.createInteractionResponse(data.id, data.token, InteractionResponseType.ACK_WITH_SOURCE).catch(async (err) => {
							await this.h.createFollowupResponse(this.user.id, data.token, {
								content: "Sorry, that command timed out on our side. Could you try again?",
								flags: 1 << 6
							});
							return "TIMEOUT";
						});
						if ((v as any) === "TIMEOUT") return;
						await Redis.incr("stats:interactions:command");
						const guild = this.guilds.get(data.guild_id);
						if (!guild) return;
						const cnf = await db.getGuild(guild.id);
						const member = guild.members.update(({
							...data.member,
							id: data.member.user.id
						}) as any, guild);
						const channel = guild.channels.get(data.channel_id) as Eris.TextChannel;
						if (config.beta && !config.developers.includes(member.id)) return;

						const command = {
							guild,
							channel,
							member,
							id: data.id,
							token: data.token,
							data: data.data
						};
						// eslint-disable-next-line @typescript-eslint/no-var-requires
						// console.log(require("util").inspect(data.data, { depth: null, colors: true }));
						const i = {
							command: command.data.name,
							options: command.data.options?.map(v => ({
								[v.name]: v.value
							})).reduce((a, b) => ({ ...a, ...b }), {}) || {} as any
						};
						const userMentions: string[] = [], roleMentions: string[] = [];
						function formatArg(arg: ApplicationCommandInteractionDataOption): unknown {
							if (arg.options && !arg.value) return `${arg.name} ${arg.options.map(formatArg)}`;
							else {
								if (["member", "user"].some(v => arg.name.startsWith(v))) {
									userMentions.push(arg.value as string);
									return `<@!${arg.value}>`;
								} else if (arg.name === "channel") return `<#${arg.value}>`;
								else if (arg.name === "role") {
									roleMentions.push(arg.value as string);
									return `<@&${arg.value}>`;
								} else return arg.value;
							}
						}
						const args = !command.data.options ? [] : command.data.options.map(formatArg);
						const m = new Eris.Message<Eris.GuildTextableChannel>({
							// @ts-ignore
							id: null,
							type: 0,
							timestamp: new Date().toISOString(),
							channel_id: channel.id,
							guild_id: guild.id,
							flags: 0,
							author: {
								id: member.id,
								avatar: member.avatar,
								username: member.username,
								discriminator: member.discriminator,
								public_flags: member.user.publicFlags,
								bot: member.user.bot,
								system: member.user.system
							},
							content: `${cnf.prefix[0]}${command.data.name}${args.length === 0 ? "" : ` ${args.join(" ")}`}`,
							mention_everyone: false,
							mentions: [],
							mention_roles: roleMentions,
							pinned: false
						}, this);
						m.mentions = userMentions.map(u => this.users.get(u)!);
						// const e = new ExtendedMessage(m, this, true, i);
						if (config.beta) {
							const e = new ExtendedMessage(m, this);
							await e.load();
							await channel.createMessage(`\`\`\`json\n${JSON.stringify({
								discord: i,
								cmd: !e.cmd ? null : {
									triggers: e.cmd.triggers,
									category: e.cmd.category.name
								},
								args: {
									normal: e.args,
									dashed: e.dashedArgs
								},
								content: e.content
							}, null, "\t")}\`\`\``);
						}
						this.emit("messageCreate", m, false, true, {
							id: data.id,
							token: data.token
						});
						return;
						/* await this.h.createInteractionResponse(data.id, data.token, InteractionResponseType.ACK_WITH_SOURCE);
	
						if (e.cmd) e.cmd.run.call(this, e, e.cmd); */
						break;
					}
				}
				break;
			}
		}
	}
});
