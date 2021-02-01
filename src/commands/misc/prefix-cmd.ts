import Command from "../../util/cmd/Command";
import CommandError from "../../util/cmd/CommandError";
import { Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import Language from "../../util/Language";
import config from "../../config";

export default new Command(["prefix"], __filename)
	.setBotPermissions([])
	.setUserPermissions([
		"manageGuild"
	])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		const max = 10;
		switch (msg.args[0]?.toLowerCase()) {
			case "add": {
				if (msg.gConfig.prefix.length >= max) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.add.max`, [max, msg.gConfig.prefix[0]]));
				if (msg.args.length !== 2) return new CommandError("ERR_INVALID_USAGE", cmd);
				if ([...msg.gConfig.prefix, `<@${this.user.id}>`, `<@!${this.user.id}>`].includes(msg.args[1].toLowerCase())) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.add.duplicate`, [msg.args[1], msg.gConfig.prefix[0]]));

				const { value: k } = await msg.gConfig.mongoEdit({
					$push: {
						prefix: msg.args[1].toLowerCase()
					}
				});
				return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.add.done`, [msg.args[1].toLowerCase(), msg.gConfig.prefix[0]]));
				break;
			}

			case "remove": {
				if (msg.args.length !== 2) return new CommandError("ERR_INVALID_USAGE", cmd);
				if (msg.gConfig.prefix.length === 1) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.remove.zero`));
				if (msg.gConfig.prefix.indexOf(msg.args[1].toLowerCase()) === -1) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.remove.invalid`, [msg.args[1].toLowerCase(), msg.gConfig.prefix[0]]));
				await msg.gConfig.mongoEdit({
					$pull: {
						prefix: msg.args[1].toLowerCase()
					}
				});
				return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.remove.done`, [msg.args[1].toLowerCase(), msg.gConfig.prefix[0]]));
				break;
			}

			case "list": {
				return msg.channel.createMessage({
					embed: new EmbedBuilder(msg.gConfig.settings.lang)
						.setAuthor(msg.author.tag, msg.author.avatarURL)
						.setDescription([
							...[
								...msg.gConfig.prefix,
								`<@!${this.user.id}>`
							].map(v => `- **${v}**`),
							"",
							`{lang:${cmd.lang}.list.mention}`
						].join("\n"))
						.setTitle(`{lang:${cmd.lang}.list.title}`)
						.setFooter(`{lang:${cmd.lang}.list.footer|${msg.gConfig.prefix.length + 1}|${msg.gConfig.prefix[0]}}`, this.user.avatarURL)
						.setColor(Colors.gold)
						.setTimestamp(new Date().toISOString())
						.toJSON()
				});
				break;
			}

			case "reset": {
				if (msg.gConfig.prefix.length === 1) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.reset.default`));
				await msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.reset.confirm`));
				const v = await this.col.awaitMessages(msg.channel.id, 6e4, (m) => m.author.id === msg.author.id, 1);
				if (!v || v.content.toLowerCase() !== "yes") return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.clear.cancelled`));
				await msg.gConfig.mongoEdit({
					$set: {
						prefix: [
							config.defaults.prefix
						]
					}
				});
				return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.clear.done`));
				break;
			}

			default: return new CommandError("ERR_INVALID_USAGE", cmd, "NONE_PROVIDED");
		}
	})
	.setOverride("invalidUsage", async function (msg, cmd, err) {
		switch (err.extra) {
			case "NONE_PROVIDED":
			case "INVALID_SUBCOMMAND": {
				await msg.channel.createMessage({
					embed: new EmbedBuilder(msg.gConfig.settings.lang)
						.setAuthor(msg.author.tag, msg.author.avatarURL)
						.setTitle("\u274c {lang:other.words.invalid$ucwords$} {lang:other.words.usage$ucwords$}")
						.setDescription([
							`{lang:${cmd.lang}.help.main}`,
							`{lang:${cmd.lang}.help.noInclude}`,
							"",
							`{lang:other.words.example$ucwords$}: \`${msg.gConfig.prefix[0]}prefix add %\``,
							`\`${msg.gConfig.prefix[0]}prefix add <prefix>\` - {lang:${cmd.lang}.help.add}`,
							`\`${msg.gConfig.prefix[0]}prefix remove <prefix>\` - {lang:${cmd.lang}.help.remove}`,
							`\`${msg.gConfig.prefix[0]}prefix list\` - {lang:${cmd.lang}.help.list}`,
							`\`${msg.gConfig.prefix[0]}prefix reset\` - {lang:${cmd.lang}.help.reset}`
						].join("\n"))
						.setTimestamp(new Date().toISOString())
						.setColor(Colors.red)
						.setFooter("NPM loves you, and so do we.", this.user.avatarURL)
						.toJSON()
				});
				break;
			}

			default: return "DEFAULT";
		}
	});
