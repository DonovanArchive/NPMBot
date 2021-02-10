import Command from "../../util/cmd/Command";
import EmbedBuilder from "../../util/EmbedBuilder";
import { Colors } from "../../util/Constants";
import Strings from "../../util/Functions/Strings";
import config from "../../config";

export default new Command(["shards"], __filename)
	.setBotPermissions([])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(2e3, true)
	.setHasSlashVariant(false)
	.setExecutor(async function (msg, cmd) {
		return msg.channel.createMessage({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setAuthor(msg.author.tag, msg.author.avatarURL)
				.setTitle(`{lang:${cmd.lang}.title}`)
				.setDescription(`{lang:${cmd.lang}.desc}`)
				.addFields(...this.shards.map((s) => ({
					name: `${s.id === msg.channel.guild.shard.id ? "(\\*)" : ""} {lang:other.words.shard$ucwords$} #${s.id}`,
					value: [
						`{lang:other.words.status$ucwords$}: ${Strings.ucwords(s.status)}`,
						`{lang:other.words.latency$ucwords$}: ${config.emojis.default.circle[s.latency <= 100 ? "green" : s.latency <= 300 ? "yellow" : "red"]} **${s.latency}ms**`,
						`{lang:other.words.servers$ucwords$}: ${this.guilds.filter(g => g.shard.id === s.id).length}`
					].join("\n"),
					inline: true
				})))
				.setTimestamp(new Date().toISOString())
				.setColor(Colors.gold)
				.setFooter(`{lang:${cmd.lang}.average|${Math.abs(Math.floor(this.shards.reduce((a, b) => a + b.latency, 0) / this.shards.size))}ms}`, this.user.avatarURL)
				.toJSON()
		});
	});
