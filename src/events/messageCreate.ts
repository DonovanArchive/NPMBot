import ClientEvent from "../util/ClientEvent";
import Eris from "eris";
import ExtendedMessage from "../util/ExtendedMessage";
import Logger from "../util/Logger";
import EmbedBuilder from "../util/EmbedBuilder";
import Time from "../util/Functions/Time";
import { Colors } from "../util/Constants";
import CommandError from "../util/cmd/CommandError";
import config from "../config";
import { performance } from "perf_hooks";
import Redis from "../util/Redis";
import Internal from "../util/Functions/Internal";
import db, { mdb } from "../util/Database";
import Language from "../util/Language";
import crypto from "crypto";
import Timers from "../util/Timers";
import * as fs from "fs-extra";
import Utility from "../util/Functions/Utility";

export default new ClientEvent("messageCreate", async function (message, update, slash, slashInfo) {
	/* this.counters.push({
		type: "messageCreate",
		time: Date.now()
	}); */
	const t = new Timers(config.developers.includes(message.author.id), `${message.author.id}/${message.channel.id}`); // `${message.channel.id}/${message.id}/${message.author.id}`);
	t.start("main");
	t.start("stats.msg");
	await this.sh.processMessage(message);
	t.end("stats.msg");
	// can't do the length bit because of things like AFK
	if (message.author.bot/* || message.content.length < 2*/) return;

	const uBl = await db.checkBl("user", message.author.id);

	if (message.channel.type !== Eris.Constants.ChannelTypes.DM && (message.channel as Eris.GuildTextableChannel).guild.id === config.client.supportServerId && message.member !== null) {
		if (uBl.current.length === 0 && message.member.roles.includes(config.roles.blacklist)) message.member.removeRole(config.roles.blacklist, "User is not blacklisted.");
		if (uBl.current.length > 0 && !message.member.roles.includes(config.roles.blacklist)) message.member.addRole(config.roles.blacklist, "User is blacklisted.");
	}

	// don't bother showing it
	if (uBl.current.length > 0) return;

	/* start dm */
	t.start("dm");
	if ([Eris.Constants.ChannelTypes.DM, Eris.Constants.ChannelTypes.GROUP_DM].includes(message.channel.type as unknown as any)) {
		await this.sh.track("stats", "directMessages", "general");
		await this.sh.track("stats", "directMessages", "session");
		const inv = /((https?:\/\/)?(discord((app)?\.com\/invite|\.gg))\/[A-Z0-9]{1,10})/i.test(message.content);
		const e = new EmbedBuilder(config.devLanguage)
			.setTitle(`Direct Message${inv ? " Advertisment" : ""}`)
			.setDescription(message.content)
			.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.avatarURL)
			.setColor(Colors.gold)
			.setTimestamp(new Date().toISOString());
		if (message.attachments?.length > 0) {
			e.setImage(message.attachments[0].url);
			e.addField("Attachments", message.attachments.map((a, i) => `[[#${i + 1}](${a.url})]`).join(" "))
		}
		await this.w.get("directMessage")!.execute({
			embeds: [
				e.toJSON()
			]
		});
		return message.channel.createMessage(config.text[inv ? "inviteDM" : "normalDM"](config.devLanguage, this));
	}
	t.end("dm");
	/* end dm */

	t.start("process");
	const msg = new ExtendedMessage(message as Eris.Message<Eris.GuildTextableChannel>, this, slash, slashInfo);
	const l = await msg.load(); // returns false if message does not start with prefix
	t.end("process");

	if (msg.member === null) return Logger.error(`Shard #${msg.channel.guild.shard.id}`, `unexpected null member (${msg.author.id}) in guild ${msg.channel.guild.id}`);

	/* start guild blacklist */
	t.start("guild-blacklist");
	let gBl: { [k in "all" | "expired" | "current" | "notice"]: Blacklist.GenericEntry[]; };

	if ("guild" in msg.channel) {
		gBl = await db.checkBl("guild", msg.channel.guild.id);
		if (gBl.current.length > 0) return;
	}
	t.end("guild-blacklist");
	/* end guild blacklist */


	/* start mention */
	t.start("mention");
	if (new RegExp(`^<@!?${this.user.id}>$`).test(message.content)) {
		await msg.channel.createMessage(config.text.mention(msg, this));
		return;
	}
	t.end("mention");
	/* end mention */

	if (!l || msg.cmd === null) return;

	/* start disable */
	t.start("disable");
	if (msg.cmd !== null && msg.gConfig.disable.length > 0 && !config.developers.includes(msg.author.id) && !msg.member.permissions.has("administrator")) {
		const a = msg.gConfig.disable.filter((d: any) => d.type === "server" && (d.all || (d.command && msg.cmd!.triggers.includes(d.command.toLowerCase())) || (d.category && d.category === msg.cmd!.category)));
		const b = msg.gConfig.disable.filter((d: any) => d.type === "user" && d.id === msg.author.id && (d.all || (d.command && msg.cmd!.triggers.includes(d.command.toLowerCase())) || (d.category && d.category === msg.cmd!.category)));
		const c = msg.gConfig.disable.filter((d: any) => d.type === "role" && msg.member!.roles.includes(d.id) && (d.all || (d.command && msg.cmd!.triggers.includes(d.command.toLowerCase())) || (d.category && d.category === msg.cmd!.category)));
		const d = msg.gConfig.disable.filter((d: any) => d.type === "channel" && d.id === msg.channel.id && (d.all || (d.command && msg.cmd!.triggers.includes(d.command.toLowerCase())) || (d.category && d.category === msg.cmd!.category)));
		if (a.length > 0 || b.length > 0 || c.length > 0 || d.length > 0) return;
	}
	t.end("disable");
	/* end disable */

	/* start antispam */
	t.start("antispam");
	if (!config.developers.includes(msg.author.id)) {
		this.cmd.anti.add(msg.author.id, "command", msg.cmd.triggers[0]);

		const sp = this.cmd.anti.get(msg.author.id, "command");
		let spC = sp.length;
		if (sp.length >= config.antiSpam.cmd.start && sp.length % config.antiSpam.cmd.warning === 0) {
			let report: any = {
				userTag: msg.author.tag,
				userId: msg.author.id,
				generatedTimestamp: Date.now(),
				entries: sp.map(s => ({ cmd: s.command, time: s.time })),
				type: "cmd",
				beta: config.beta
			};

			if (!fs.existsSync(config.dir.logs.spam)) fs.mkdirpSync(config.dir.logs.spam);

			const d = fs.readdirSync(config.dir.logs.spam).filter(d => !fs.lstatSync(`${config.dir.logs.spam}/${d}`).isDirectory() && d.startsWith(msg.author.id) && d.endsWith("-cmd.json") && fs.lstatSync(`${config.dir.logs.spam}/${d}`).birthtimeMs + 1.2e5 > Date.now());

			if (d.length > 0) {
				report = Internal.combineReports(...d.map(f => JSON.parse(fs.readFileSync(`${config.dir.logs.spam}/${f}`).toString())), report);
				spC = report.entries.length;
				d.map(f => fs.unlinkSync(`${config.dir.logs.spam}/${f}`));
			}

			const reportId = crypto.randomBytes(10).toString("hex");

			fs.writeFileSync(`${config.dir.logs.spam}/${msg.author.id}-${reportId}-cmd.json`, JSON.stringify(report));

			Logger.log([`Shard #${msg.channel.guild.shard.id}`, "Command Handler"], `Possible command spam from "${msg.author.tag}" (${msg.author.id}), VL: ${spC}, Report: ${config.beta ? `https://${config.web.api.host}/reports/cmd/${msg.author.id}/${reportId}` : `https://botapi.furry.bot/reports/cmd/${msg.author.id}/${reportId}`}`);
			await this.w.get("spam")!.execute({
				embeds: [
					new EmbedBuilder(config.devLanguage)
						.setTitle(`Possible Command Spam From ${msg.author.tag} (${msg.author.id}) | VL: ${spC}`)
						.setDescription(`Report: ${`https://${config.web.api.host}/reports/cmd/${msg.author.id}/${reportId}`}`)
						.setTimestamp(new Date().toISOString())
						.setAuthor(`${this.user.username}#${this.user.discriminator}`, this.user.avatarURL)
						.setColor(Colors.gold)
						.toJSON()
				],
				username: `Spam Logs${config.beta ? " - Beta" : ""}`,
				avatarURL: this.user.avatarURL
			});

			if (spC >= config.antiSpam.cmd.blacklist) {
				const expire = config.bl.getTime("cmd", uBl.current.length, true, true);
				await db.addBl("user", msg.author.id, "automatic", this.user.id, "Spamming Commands.", expire, `https://${config.web.api.host}/reports/cmd/${msg.author.id}/${reportId}`);
				Logger.log([`Shard #${msg.channel.guild.shard.id}`, "Command Handler"], `User "${msg.author.tag}" (${msg.author.id}) blacklisted for spamming, VL: ${spC}, Report: https://${config.web.api.host}/reports/cmd/${msg.author.id}/${reportId}`);
			}
		}
	}
	t.end("antispam");
	/* end antispam */

	const { cmd } = msg;

	if (cmd) {
		t.start("stats.cmd");
		await this.sh.processCommand(msg);
		t.end("stats.cmd");

		/* start command restrictions */
		t.start("restrictions");
		if (!config.developers.includes(msg.author.id)) {
			const v = await new Promise(async (a, b) => {
				for (const r of Object.values(this.cmd.restrictions)) {
					const f = await r.test(this, msg, cmd);
					// console.log(`[${r.Label}]`, f);
					if (!f) a(false);
				}

				return a(true);
			});
			if (!v) return;
		}
		t.end("restrictions");
		/* end command restrictions */

		/* start permission checks */
		t.start("permission");
		const p = await this.cmd.handlers.checkPermissions(this, msg, cmd);
		if (!p) return;
		t.end("permission");
		/* end permission checks */

		/* start command cooldown */
		t.start("cooldown");
		if (!config.developers.includes(msg.author.id)) {
			const c = this.cmd.cool.checkCooldown(msg.author.id, cmd);
			if (c.active) {
				const j = await cmd.runOverride("cooldown", this, msg, cmd, c.time);
				if (j === "DEFAULT") {
					const m = await msg.channel.createMessage({
						embed: new EmbedBuilder(msg.gConfig.settings.lang)
							.setTitle("{lang:other.commandChecks.cooldown.title}")
							.setDescription(`{lang:other.commandChecks.cooldown.description|${Time.ms(c.time, true)}|${Time.ms(cmd.cooldown, true)}}`)
							.setColor(Colors.red)
							.setTimestamp(new Date().toISOString())
							.setFooter("{lang:other.selfDestructMessage|20}", this.user.avatarURL)
							.toJSON()
					});

					setTimeout(() => m.delete().catch(err => null), 2e4);
				}

				return;
			}

			this.cmd.cool.addCooldown(msg.author.id, cmd);
		}
		t.end("cooldown");
		/* end command cooldown */

		Logger.info([`Shard #${msg.channel.guild.shard.id}`, `Command Handler${msg.slash ? "[Slash]" : ""}`], `Command "${cmd.triggers[0]}" ran with ${msg.args.length === 0 ? "no arguments" : `the arguments "${msg.args.join(" ")}"`} by user ${msg.author.tag} (${msg.author.id}) in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);

		const start = performance.now();

		/* start run command */
		t.start("run");
		cmd
			.run
			.call(this, msg, cmd)
			.then(res => {
				const end = performance.now();
				Logger.info([`Shard #${msg.channel.guild.shard.id}`, `Command Handler${msg.slash ? "[Slash]" : ""}`], `Command handler for "${cmd.triggers[0]}" took ${(end - start).toFixed(3)}ms.`);
				if (res instanceof Error) throw res;
			})
			/* start command error handler */
			.catch(async (err: Error) => {
				const {
					code,
					message: {
						embeds: [
							e
						]
					}
				} = await Utility.logError(this, err, "message", msg);
				if (err instanceof CommandError) {
					switch (err.message) {
						case "ERR_INVALID_USAGE": {
							this.cmd.handlers.runInvalidUsage(this, msg, err.cmd, err);
							break;
						}
					}
				} else {
					if (err.message.indexOf("filterTags") !== -1) await msg.reply(Language.get(msg.gConfig.settings.lang, "other.errors.e6Blacklist"));
					else {
						if (config.developers.includes(msg.author.id)) await msg.channel.createMessage({ embed: e });
						else await msg.reply(Language.get(msg.gConfig.settings.lang, "other.errors.command", [code, config.client.socials.discord, `${err.name}: ${err.message}`]));
					}
					Logger.error([`Shard #${msg.channel.guild.shard.id}`, "Command Handler"], err);
				}
			});
		t.end("run");
		/* end command error handler */
		/* start run command */
	}
	t.end("main");
});
