import Eris from "eris";
import config from "../config";
import ClientEvent from "../util/ClientEvent";
import TimedTasks from "../util/Functions/TimedTasks";
import BLClient from "../util/handlers/BotListHandler";
import pid from "../util/handlers/pid";
import fetch from "node-fetch";
import Logger from "../util/Logger";
import CommandHelper from "../util/DiscordCommands/main";
import { performance } from "perf_hooks";
import EmbedBuilder from "../util/EmbedBuilder";
import { Colors } from "../util/Constants";

export default new ClientEvent("ready", async function () {
	const start = performance.now();
	pid(`${config.dir.tmp}/pid/main.pid`);
	await this.sh.resetSessionStats();

	this.api.launch();
	await this.loadCommands();
	setInterval(this.removeEv.bind(this), 1e3);

	const s = config.statuses(this);

	await this.editStatus(s[0].status, {
		name: s[0].name,
		type: s[0].type
	});

	setInterval(async () => TimedTasks.runAll.call(TimedTasks, this), 1e3);

	if (false && !config.beta) {
		/* BLClient
			.on("beforePost", async () => {
				BLClient.update(this.guilds.size, this.shards.map(({ id }) => ({
					id,
					count: this.guilds.filter(({ shard: { id: i } }) => id === i).length
				})));
				await fetch("https://top.gg/api/bots/398251412246495233/stats", {
					method: "POST",
					headers: {
						"Authorization": config.client.botLists["top.gg"].token,
						"User-Agent": config.web.userAgent
					},
					body: JSON.stringify({
						server_count: this.guilds.size,
						shards: this.shards.map(({ id }) => this.guilds.filter(({ shard: { id: i } }) => id === i).length)
					})
				}).then(res => {
					Logger.debug(["Bot List Stats", "DBL"], res.status === 200 ? "Successfully posted stats" : "failed to post stats");
					if (res.status !== 200) Logger.error(["Bot List Stats", "DBL"], res.body.toString());
				});
			})
			.on("afterPost", (successful, failed) =>
				Logger.debug("Bot List Stats", `Finished posting to ${successful + failed} lists. ${successful} succeeded, ${failed} failed.`)
			)
			.on("error", (err) =>
				Logger.error("Bot List Stats", err)
			)
			.start(); */
	}

	this.h = new CommandHelper(this.token!, this.user.id);

	const end = performance.now();
	Logger.info(["General"], `Ready with ${this.guilds.size} guild${this.guilds.size === 1 ? "" : "s"}, ${this.users.size} user${this.users.size === 1 ? "" : "s"}, and ${Object.keys(this.channelGuildMap).length} guild channel${Object.keys(this.channelGuildMap).length === 1 ? "" : "s"}. Launch processing took ${(end - start).toFixed(3)}ms.`);
	this.w.get("status")!.execute({
		embeds: [
			new EmbedBuilder(config.devLanguage)
				.setColor(Colors.blue)
				.setTimestamp(new Date().toISOString())
				.setTitle("Ready")
				.setDescription(`Ready with ${this.guilds.size} guild${this.guilds.size === 1 ? "" : "s"}, ${this.users.size} user${this.users.size === 1 ? "" : "s"}, and ${Object.keys(this.channelGuildMap).length} guild channel${Object.keys(this.channelGuildMap).length === 1 ? "" : "s"}.\nLaunch processing took ${(end - start).toFixed(3)}ms.`)
				.setFooter(`${this.shards.size} Shard${this.shards.size === 1 ? "" : "s"}`)
				.toJSON()
		]
	});
});
