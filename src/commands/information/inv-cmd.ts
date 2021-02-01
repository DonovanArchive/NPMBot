import Command from "../../util/cmd/Command";
import EmbedBuilder from "../../util/EmbedBuilder";
import { Colors } from "../../util/Constants";
import config from "../../config";

export default new Command(["inv", "invite", "discord", "support"], __filename)
	.setBotPermissions([
		"embedLinks"
	])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		return msg.channel.createMessage({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setTitle("Discord")
				.setDescription(`[{lang:${cmd.lang}.support}](${config.client.socials.discord})\n[{lang:${cmd.lang}.add}](${config.client.socials.discordInvite})`)
				.setThumbnail(this.user.avatarURL)
				.setColor(Colors.green)
				.setTimestamp(new Date().toISOString())
				.setAuthor(msg.author.tag, msg.author.avatarURL)
				.setFooter("NPM loves you, and so do we.", this.user.avatarURL)
				.toJSON()
		});
	});
