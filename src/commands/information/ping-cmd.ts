import Command from "../../util/cmd/Command";
import Language from "../../util/Language";
import EmbedBuilder from "../../util/EmbedBuilder";
import { Colors } from "../../util/Constants";
import { mongo } from "../../util/Database";
import { performance } from "perf_hooks";
import Redis from "../../util/Redis";

export default new Command(["ping"], __filename)
	.setBotPermissions([
		"embedLinks"
	])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		let create: number, edit: number, del: number;
		await msg.channel.createMessage(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.calculating`))
			.then(m => (create = m.timestamp, m.edit(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.calculated`))))
			.then(async (m) => {
				await msg.channel.sendTyping();
				edit = m.editedTimestamp!;
				await m.delete().then(() => del = Date.now());
				const dbStart = performance.now();
				await mongo.db("admin").command({
					ping: 1
				});
				const dbEnd = performance.now();
				const redisStart = performance.now();
				await Redis.ping();
				const redisEnd = performance.now();
				return msg.channel.createMessage({
					embed: new EmbedBuilder(msg.gConfig.settings.lang)
						.setAuthor(msg.author.tag, msg.author.avatarURL)
						.setDescription([
							`{lang:${cmd.lang}.dbPing}: **${Math.abs(dbStart - dbEnd).toFixed(3)}ms**`,
							`{lang:${cmd.lang}.redisPing}: **${Math.abs(redisStart - redisEnd).toFixed(3)}ms**`,
							`{lang:${cmd.lang}.generalTime}: **${Math.abs(Math.floor(create - msg.timestamp))}ms**`,
							`{lang:${cmd.lang}.editTime}: **${Math.abs(Math.floor(edit - create))}ms**`,
							`{lang:${cmd.lang}.deleteTime}: **${Math.abs(Math.floor(del - create))}ms**`,
							`{lang:${cmd.lang}.shardTime|${msg.channel.guild.shard.id}}: **${Math.abs(Math.floor(msg.channel.guild.shard.latency))}ms**`,
							`{lang:${cmd.lang}.shardAverage|${this.shards.size}}: **${Math.abs(Math.floor(this.shards.reduce((a, b) => a + b.latency, 0) / this.shards.size))}ms**`
						].join("\n"))
						.setTimestamp(new Date().toISOString())
						.setFooter("NPM loves you, and so do we.", this.user.avatarURL)
						.setColor(Colors.gold)
						.toJSON()
				});
			});
	});
