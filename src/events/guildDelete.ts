import ClientEvent from "../util/ClientEvent";
import { Colors } from "../util/Constants";
import config from "../config";
import Eris from "eris";
import Logger from "../util/Logger";
import Redis from "../util/Redis";

export default new ClientEvent("guildDelete", async function (guild) {
	await this.sh.track("events", "guildDelete");
	const d = new Date();
	const id = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
	await Redis.decr(`stats:dailyJoins:${id}`);

	let author = {
		name: "Unknown#0000",
		icon_url: "https://i.furry.bot/noicon.png"
	};
	let owner = "Unknown#0000 (000000000000000000)";
	if ("ownerID" in guild) {
		const u = await this.getUser(guild.ownerID);
		if (u !== null) {
			author = {
				name: `${u.username}#${u.discriminator}`,
				icon_url: u.avatarURL ?? "https://i.furry.bot/noicon.png"
			};
			owner = `${u.username}#${u.discriminator} (${u.id})`;
		}
	}

	if ("shard" in guild) {
		Logger.info([`Shard #${guild.shard.id}`, "Guild Leave"], `Left guild ${guild.name} (${guild.id}), owner: ${owner}, this guild had ${guild.memberCount} members! We now have ${this.guilds.size - 1} guilds!`);
		const embed: Eris.EmbedOptions = {
			title: "Guild Left!",
			description: [
				`Guild #${this.guilds.size + 1}`,
				`Current Total: ${this.guilds.size}`,
				"",
				"**Guild Info**:",
				`${config.emojis.default.dot} Name: ${guild.name}`,
				`${config.emojis.default.dot} ID: ${guild.id}`,
				`${config.emojis.default.dot} **Members**:`,
				`\t<:${config.emojis.status.online}>: ${guild.members.filter(m => m.status === "online").length}`,
				`\t<:${config.emojis.status.idle}>: ${guild.members.filter(m => m.status === "idle").length}`,
				`\t<:${config.emojis.status.dnd}>: ${guild.members.filter(m => m.status === "dnd").length}`,
				`\t<:${config.emojis.status.offline}>: ${guild.members.filter(m => m.status === "offline").length}`,
				`\t<:${config.emojis.custom.bot}>: ${guild.members.filter(m => m.user.bot).length}`,
				`\t${config.emojis.default.human}: ${guild.members.filter(m => !m.user.bot).length}`,
				`${config.emojis.default.dot} Large: ${guild.large ? "Yes" : "No"} (${guild.memberCount})`,
				`${config.emojis.default.dot} Owner: ${owner}`
			].join("\n"),
			author,
			image: {
				url: guild.iconURL ?? "https://i.furry.bot/noicon.png"
			},
			thumbnail: {
				url: "https://i.furry.bot/noicon.png"
			},
			timestamp: new Date().toISOString(),
			color: Colors.red,
			footer: {
				text: `Shard ${guild.shard.id + 1}/${this.shards.size}`,
				icon_url: this.user.avatarURL
			}
		};

		if (embed.author?.icon_url !== undefined) embed.thumbnail = {
			url: embed.author.icon_url
		};

		await this.w.get("guilds")!.execute({
			embeds: [
				embed
			]
		});
	}
	else Logger.info(["Guild Leave"], `Left guild ${guild.id}, owner: ${owner}. We now have ${this.guilds.size - 1} guilds!`);
});
