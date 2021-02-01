import Command from "../../util/cmd/Command";
import EmbedBuilder from "../../util/EmbedBuilder";
import { Colors } from "../../util/Constants";
import Eris from "eris";
import config from "../../config";
import Time from "../../util/Functions/Time";
import * as os from "os";
import * as pkgLock from "../../../package-lock.json";
import Strings from "../../util/Functions/Strings";

export default new Command(["botinfo"], __filename)
	.setBotPermissions([
		"embedLinks"
	])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		const mem = process.memoryUsage();
		return msg.channel.createMessage({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setTitle(`{lang:${cmd.lang}.title}`)
				.setDescription([
					"**{lang:other.words.stats$ucwords$}**:",
					`${config.emojis.default.dot} {lang:${cmd.lang}.memoryUsage.process}: ${Strings.formatBytes(mem.heapUsed)} / ${Strings.formatBytes(mem.heapTotal)}`,
					`${config.emojis.default.dot} {lang:${cmd.lang}.memoryUsage.system}: ${Strings.formatBytes((os.totalmem() - os.freemem()))} / ${Strings.formatBytes(os.totalmem())}`,
					`${config.emojis.default.dot} {lang:other.words.cpuUsage}: ${this.cpuUsage}%`,
					`${config.emojis.default.dot} {lang:other.words.uptime$ucwords$}: ${Time.ms(process.uptime() * 1000, true)} (${Time.secondsToHMS(process.uptime())})`,
					`${config.emojis.default.dot} {lang:other.words.shard$ucwords$}: ${msg.channel.guild.shard.id + 1}/${this.shards.size}`,
					`${config.emojis.default.dot} {lang:other.words.guilds$ucwords$}: ${this.guilds.size}`,
					`${config.emojis.default.dot} {lang:other.words.largeGuilds$ucwords$}: ${this.guilds.filter(g => g.large).length}`,
					`${config.emojis.default.dot} {lang:other.words.users$ucwords$}: ${this.users.size}`,
					`${config.emojis.default.dot} {lang:other.words.channels$ucwords$}: ${Object.keys(this.channelGuildMap).length}`,
					`${config.emojis.default.dot} {lang:other.words.commands$ucwords$}: ${this.cmd.commands.length} (${this.cmd.categories.length} {lang:other.words.categories})`,
					"",
					"**{lang:other.words.developers$ucwords$}**:",
					`${config.emojis.default.dot} [{lang:other.words.creator$ucwords$}] [Donovan_DMC](https://furry.cool)`,
					"",
					"**{lang:other.words.other$ucwords$}**:",
					`${config.emojis.default.dot} {lang:other.words.library$ucwords$}: [Eris Dev](https://github.com/abalabahaha/eris/tree/dev) (**${Eris.VERSION}**, \`${pkgLock.dependencies.eris.version.split("#")[1].slice(0, 7)}\`)`,
					`${config.emojis.default.dot} {lang:other.words.apiVersion$ucwords$}: ${Eris.Constants.REST_VERSION}`,
					`${config.emojis.default.dot} {lang:other.words.gatewayVersion$ucwords$}: ${Eris.Constants.GATEWAY_VERSION}`,
					`${config.emojis.default.dot} {lang:other.words.version$ucwords$}: ${config.version} ({lang:${cmd.lang}.buildDate$ucwords$}: ${config.buildDate.slice(4, 6)}/${config.buildDate.slice(6, 8)}/${config.buildDate.slice(0, 4)})`,
					`${config.emojis.default.dot} {lang:other.words.nodeVersion$ucwords$}: ${process.version}`,
					`${config.emojis.default.dot} {lang:other.words.supportServer$ucwords$}: [${config.client.socials.discord}](${config.client.socials.discord})`,
					`${config.emojis.default.dot} {lang:other.words.donate$ucwords$}: [${config.client.socials["gh-sponsors"]}](${config.client.socials["gh-sponsors"]})`
				].join("\n"))
				.setAuthor(msg.author.tag, msg.author.avatarURL)
				.setTimestamp(new Date().toISOString())
				.setColor(Colors.gold)
				.setThumbnail(this.user.avatarURL)
				.toJSON()
		});
	});
