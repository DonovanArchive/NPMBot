import Command from "../../util/cmd/Command";
import { Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import config from "../../config";
import Language from "../../util/Language";
import Strings from "../../util/Functions/Strings";
import db, { mdb } from "../../util/Database";
import Time from "../../util/Functions/Time";
import Eris from "eris";
import GuildConfig from "../../util/config/GuildConfig";
import UserConfig from "../../util/config/UserConfig";
import chunk from "chunk";

export default new Command(["blacklist", "bl"], __filename)
	.setBotPermissions([])
	.setUserPermissions([])
	.setRestrictions([
		"developer"
	])
	.setCooldown(0, true)
	.setHasSlashVariant(false)
	.setExecutor(async function (msg, cmd) {
		function formatEntry(pos: number, date: number, blame: string, reason: string, expiry: number, id: string) {
			return {
				name: `{lang:other.words.entry} #${pos}`,
				value: [
					`\t**{lang:other.words.date}**: ${Time.formatDateWithPadding(date)}`,
					`\t**{lang:other.words.blame}**: ${blame}`,
					`\t**{lang:other.words.reason}**: \`${reason}\``,
					`\t**{lang:other.words.expiry}**: ${[null, 0].includes(expiry) ? "{lang:other.words.never}" : Time.formatDateWithPadding(expiry)}`,
					`\t**{lang:other.words.id}**: ${id}`
				].join("\n"),
				inline: msg.dashedArgs.value.includes("inline")
			};

		}
		const types = ["add", "check", "get", "remove"];
		const subTypes = ["guild", "user"];
		const type: "add" | "check" | "get" | "remove" = msg.args.length > 0 ? msg.args[0].toLowerCase() as any : null;
		const subType: "guild" | "user" = msg.args.length > 1 ? msg.args[1].toLowerCase() as any : null;
		const id = msg.args.length > 2 ? msg.args[2] : null;
		let d: Eris.Guild | Eris.User | null;
		let dbEntry: GuildConfig | UserConfig;
		const reason = msg.args.slice(3).join(" ") || "No Reason";
		if (!types.includes(type)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.invalidType`, [type === null ? "none" : type, types.join("**, **")]));
		if (type === "get") {
			const entry = await mdb.collection<Blacklist.GenericEntry>("blacklist").findOne({ id: msg.args[1] });
			const entries = await mdb.collection<Blacklist.GenericEntry>("blacklist").find(typeof entry!.guildId !== "undefined" ? { guildId: entry!.guildId } : { userId: entry!.userId }).toArray();
			let pos: number;
			entries.filter((e, i) => {
				if (e.id === entry!.id) pos = i;
			});
			const field = formatEntry(pos!, entry!.created, entry!.blame, entry!.reason, entry!.expire, entry!.id);
			let text: string;
			if (typeof entry!.guildId !== "undefined") {
				const d = await this.getGuild(entry!.guildId);
				text = Language.get(config.devLanguage, `${cmd.lang}.get.guild`, [msg.args[1], d ? d.name : "Unknown"]);
			} else if (typeof entry!.userId !== "undefined") {
				const d = await this.getUser(entry!.userId);
				text = Language.get(config.devLanguage, `${cmd.lang}.get.user`, [msg.args[1], `${d!.username}#${d!.discriminator}`]);
			} else throw new TypeError("Invalid blacklist entry.");

			await msg.reply(text);
			await msg.channel.createMessage({
				embed: new EmbedBuilder(config.devLanguage)
					.setTitle("{lang:other.words.current$ucwords$}")
					.setColor(Colors.red)
					.setTimestamp(new Date().toISOString())
					.addField(field.name, field.value, field.inline)
					.toJSON()
			});
			return;
		}
		if (!subTypes.includes(subType)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.invalidSubType`, [subType === null ? "none" : subType, subTypes.join("**, **")]));
		// ids will be 19 soon
		// they can technically be anywhere between 15 and 21 if I recall correctly, but I doubt
		// I'll run into that issue anytime soon
		if ((!id || id.length < 16 || id.length > 19)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.invalidId`));

		switch (subType) {
			case "guild": {
				try {
					d = await this.getGuild(id);
					dbEntry = await db.getGuild(id);
				} catch (e) {
					return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.invalidGuild`, [id]));
				}
				break;
			}

			case "user": {
				try {
					d = await this.getUser(id);
					dbEntry = await db.getUser(id);
				} catch (e) {
					return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.invalidUser`, [id]));
				}
				break;
			}
		}

		const date = Date.now();
		switch (type) {
			case "add": {
				let expire = Number(msg.dashedArgs.keyValue.time);
				if (typeof expire === "undefined" || isNaN(expire)) expire = 0;

				if (subType === "user" && d instanceof Eris.User && dbEntry instanceof UserConfig) {
					/*
					 * let t: string;
					 * if (config.developers.includes(id)) t = "developer";
					 * else if (config.contributors.includes(id) && !config.developers.includes(msg.author.id)) t = "contributor";
					 * else if (config.helpers.includes(id) && !(config.developers.includes(msg.author.id) || config.contributors.includes(msg.author.id))) t = "helper";
					 * if (t) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.cannotBlacklist.${t}`, [`${d.username}#${d.discriminator}`]));
					 */

					const strike = await dbEntry.checkBlacklist().then(b => b.all.length);
					const e = await dbEntry.addBlacklist(msg.author.tag, msg.author.id, reason, !expire ? 0 : date + (expire * 8.64e+7));

					return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.added.user`, [`${d.username}#${d.discriminator}`, reason, [null, 0].includes(expire) ? "Never" : Time.formatDateWithPadding(date + (expire * 8.64e+7)), strike, e.id]));
				} else if (subType === "guild" && d instanceof Eris.Guild && dbEntry instanceof GuildConfig) {
					if (id === config.client.supportServerId) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.cannotBlacklist.supportServer`, [d ? d.name : "Unknown"]));

					const strike = await dbEntry.checkBlacklist().then(b => b.all.length);
					const e = await dbEntry.addBlacklist(msg.author.tag, msg.author.id, reason, !expire ? 0 : date + (expire * 8.64e+7));

					return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.added.guild`, [d ? d.name : "Unknown", reason, [null, 0].includes(expire) ? "Never" : Time.formatDateWithPadding(date + (expire * 8.64e+7)), strike, e.id]));
				} else throw new TypeError("We shouldn't be here.");
				break;
			}

			case "check": {
				const page = !msg.args[2] ? Number(msg.args[2]) : 1;
				if (subType === "user" && d instanceof Eris.User && dbEntry instanceof UserConfig) {
					const bl = await dbEntry.checkBlacklist();
					const expired: ReturnType<typeof formatEntry>[][] = chunk(bl.expired.map((e, i) => formatEntry(i + 1, e.created, e.blame, e.reason, e.expire, e.id)), 3);
					const current: ReturnType<typeof formatEntry>[][] = chunk(bl.current.map((e, i) => formatEntry(i + 1, e.created, e.blame, e.reason, e.expire, e.id)), 3);
					const e = expired.length >= page ? expired[page - 1] : [];
					const c = current.length >= page ? current[page - 1] : [];

					if ((!expired || expired.length === 0) && (!current || current.length === 0)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.check.noHistoryUser`, [`${d.username}#${d.discriminator}`]));
					if ((!e || e.length === 0) && (!c || c.length === 0)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.check.invalidPage`, [page, expired.length > current.length ? expired.length : current.length]));

					await msg.reply(`${Language.get(config.devLanguage, `${cmd.lang}.check.${current.length === 0 ? "notBlacklistedUser" : "isBlacklistedUser"}`, [`${d.username}#${d.discriminator}`])} ${expired.length === 0 ? "" : ` ${Language.get(config.devLanguage, `${cmd.lang}.check.previouslyBlacklistedUser`)}`} ${Language.get(config.devLanguage, `${cmd.lang}.check.entries`)}.`);
					await msg.channel.createMessage({
						embed: new EmbedBuilder(config.devLanguage)
							.setTitle("{lang:other.words.expired$ucwords$}")
							.setDescription(e.length === 0 ? `{lang:${cmd.lang}.check.noEntries}${page !== 1 ? ` {lang:${cmd.lang}.check.onThisPage}` : ""}` : "")
							.setColor(Colors.red)
							.setTimestamp(new Date().toISOString())
							.addFields(...e)
							.setFooter(`{lang:${cmd.lang}.check.page|${page}|${expired.length > current.length ? expired.length : current.length}}`)
							.toJSON()
					});
					await msg.channel.createMessage({
						embed: new EmbedBuilder(config.devLanguage)
							.setTitle("{lang:other.words.current$ucwords$}")
							.setDescription(c.length === 0 ? `{lang:${cmd.lang}.check.noEntries}${page !== 1 ? ` {lang:${cmd.lang}.check.onThisPage}` : ""}` : "")
							.setColor(Colors.red)
							.setTimestamp(new Date().toISOString())
							.addFields(...c)
							.setFooter(`{lang:${cmd.lang}.check.page|${page}|${expired.length > current.length ? expired.length : current.length}}`)
							.toJSON()
					});
					return;
				} else if (subType === "guild" && d instanceof Eris.Guild && dbEntry instanceof GuildConfig) {
					const bl = await dbEntry.checkBlacklist();
					const expired: ReturnType<typeof formatEntry>[][] = chunk(bl.expired.map((e, i) => formatEntry(i + 1, e.created, e.blame, e.reason, e.expire, e.id)), 3);
					const current: ReturnType<typeof formatEntry>[][] = chunk(bl.current.map((e, i) => formatEntry(i + 1, e.created, e.blame, e.reason, e.expire, e.id)), 3);
					const e = expired.length >= page ? expired[page - 1] : [];
					const c = current.length >= page ? current[page - 1] : [];

					if ((!expired || expired.length === 0) && (!current || current.length === 0)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.check.noHistoryGuild`, [d ? d.name : "Unknown"]));
					if ((!e || e.length === 0) && (!c || c.length === 0)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.check.invalidPage`, [page, expired.length > current.length ? expired.length : current.length]));

					await msg.reply(`${Language.get(config.devLanguage, `${cmd.lang}.check.${current.length === 0 ? "notBlacklistedGuild" : "isBlacklistedGuild"}`, [d ? d.name : "Unknown"])}${expired.length === 0 ? "" : ` ${Language.get(config.devLanguage, `${cmd.lang}.check.previouslyBlacklistedGuild`)}`} ${Language.get(config.devLanguage, `${cmd.lang}.check.entries`)}.`);
					await msg.channel.createMessage({
						embed: new EmbedBuilder(config.devLanguage)
							.setTitle("{lang:other.words.expired$ucwords$}")
							.setDescription(e.length === 0 ? `{lang:${cmd.lang}.check.noEntries}${page !== 1 ? ` {lang:${cmd.lang}.check.onThisPage}` : ""}` : "")
							.setColor(Colors.red)
							.setTimestamp(new Date().toISOString())
							.addFields(...e)
							.setFooter(`{lang:${cmd.lang}.check.page|${page}|${expired.length > current.length ? expired.length : current.length}}`)
							.toJSON()
					});
					await msg.channel.createMessage({
						embed: new EmbedBuilder(config.devLanguage)
							.setTitle("{lang:other.words.current$ucwords$}")
							.setDescription(c.length === 0 ? `{lang:${cmd.lang}.check.noEntries}${page !== 1 ? ` {lang:${cmd.lang}.check.onThisPage}` : ""}` : "")
							.setColor(Colors.red)
							.setTimestamp(new Date().toISOString())
							.addFields(...c)
							.setFooter(`{lang:${cmd.lang}.check.page|${page}|${expired.length > current.length ? expired.length : current.length}}`)
							.toJSON()
					});
					return;
				} else throw new TypeError("We shouldn't be here.");
				break;
			}

			case "remove": {
				if (subType === "user" && d instanceof Eris.User && dbEntry instanceof UserConfig) {
					const bl = await dbEntry.checkBlacklist();

					if (bl.current.length === 0) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.notBlacklistedUser`, [`${d.username}#${d.discriminator}`]));

					let m: Eris.Message | null;
					if (bl.current.length === 1) {
						await msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.confirmUser`, [`${d.username}#${d.discriminator}`]));
						const k = await this.col.awaitMessages(msg.channel.id, 6e4, (m) => m.author.id === msg.author.id, 1);
						if (!k!.content || k!.content.toLowerCase() !== "yes") return msg.reply(`${Language.get(config.devLanguage, "other.words.canceled")}.`);
						m = { content: bl.current[0].id } as any;
					} else {
						await msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.chose`));
						await msg.channel.createMessage({
							embed: new EmbedBuilder(config.devLanguage)
								.setTitle("{lang:other.words.current$ucwords$}")
								.setDescription(bl.current.map((c, i) => `#${i + 1}: \`${c.id}\``).join("\n"))
								.setColor(Colors.red)
								.setTimestamp(new Date().toISOString())
								.toJSON()
						});
						m = await this.col.awaitMessages(msg.channel.id, 6e4, (m) => m.author.id === msg.author.id);
					}
					if (!m) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.noReply`));
					if (m.content.toLowerCase() === "cancel") return msg.reply(`${Language.get(config.devLanguage, "other.words.canceled")}.`);
					if (!isNaN(Number(m.content))) {
						if (Number(m.content) > bl.current.length) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.invalidPos`, [bl.current.length]));
						m.content = bl.current[Number(m.content) - 1].id;
					} else m.content = bl.current[0].id;
					if (!bl.current.map(c => c.id).includes(m.content)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.invalid`));
					const e = bl.current.find(c => c.id === m!.content);
					await mdb.collection<Blacklist.GenericEntry>("blacklist").findOneAndUpdate({
						id: e!.id
					}, {
						$set: {
							expire: Date.now()
						}
					});
					await this.w.get("blacklist")!.execute({
						embeds: [
							{
								title: `${Strings.ucwords(subType)} Unblacklisted`,
								description: [
									`${Strings.ucwords(subType)} Id: ${d.id}`,
									`Entry ID: ${e!.id}`,
									`Tag: ${d.username}#${d.discriminator}`,
									`Previous Reason: ${reason}`,
									`Previous Blame: ${e!.blame} (${e!.blameId})`,
									`Previous Expiry: ${[0, null, undefined].includes(e!.expire) ? "Never" : Time.formatDateWithPadding(e!.expire, false)}`
								].join("\n"),
								color: Colors.green,
								timestamp: new Date().toISOString()
							}
						]
					});
					return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.user`, [e!.id, `${d.username}#${d.discriminator}`]));
				} else if (subType === "guild" && d instanceof Eris.Guild && dbEntry instanceof GuildConfig) {
					const bl = await dbEntry.checkBlacklist();

					if (bl.current.length === 0) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.notBlacklistedGuild`, [d ? d.name : "Unknown"]));

					let m: Eris.Message | null;
					if (bl.current.length === 1) {
						await msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.confirmGuild`, [d ? d.name : "Unknown"]));
						const k = await this.col.awaitMessages(msg.channel.id, 6e4, (m) => m.author.id === msg.author.id, 1);
						if (!k!.content || k!.content.toLowerCase() !== "yes") return msg.reply(`${Language.get(config.devLanguage, "other.words.canceled")}.`);
						m = { content: bl.current[0].id } as any;
					} else {
						await msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.chose`));
						await msg.channel.createMessage({
							embed: new EmbedBuilder(config.devLanguage)
								.setTitle("{lang:other.words.current$ucwords$}")
								.setDescription(bl.current.map((c, i) => `#${i + 1}: \`${c.id}\``).join("\n"))
								.setColor(Colors.red)
								.setTimestamp(new Date().toISOString())
								.toJSON()
						});
						m = await this.col.awaitMessages(msg.channel.id, 6e4, (m) => m.author.id === msg.author.id);
					}
					if (!m) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.noReply`));
					if (m.content.toLowerCase() === "cancel") return msg.reply(`${Language.get(config.devLanguage, "other.words.canceled")}.`);
					if (!isNaN(Number(m.content))) {
						if (Number(m.content) > bl.current.length) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.invalidPos`, [bl.current.length]));
						m.content = bl.current[Number(m.content) - 1].id;
					}
					if (!bl.current.map(c => c.id).includes(m.content)) return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.invalid`));
					const e = bl.current.find(c => c.id === m!.content);
					await mdb.collection<Blacklist.GenericEntry>("blacklist").findOneAndUpdate({
						id: e!.id
					}, {
						$set: {
							expire: Date.now()
						}
					});
					await this.w.get("blacklist")!.execute({
						embeds: [
							{
								title: `${Strings.ucwords(subType)} Unblacklisted`,
								description: [
									`${Strings.ucwords(type)} Id: ${d.id}`,
									`Entry ID: ${e!.id}`,
									`Name: ${d.name}`,
									`Previous Reason: ${reason}`,
									`Previous Blame: ${e!.blame} (${e!.blameId})`,
									`Previous Expiry: ${[0, null, undefined].includes(e!.expire) ? "Never" : Time.formatDateWithPadding(e!.expire, false)}`
								].join("\n"),
								color: Colors.green,
								timestamp: new Date().toISOString()
							}
						]
					});
					return msg.reply(Language.get(config.devLanguage, `${cmd.lang}.remove.guild`, [e!.id, d.name]));
				} else throw new TypeError("We shouldn't be here.");
				break;
			}
		}
	});
