import { stat } from "fs-extra";
import Command from "../../util/cmd/Command";
import CommandError from "../../util/cmd/CommandError";
import { Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import Language from "../../util/Language";
import NPM from "../../util/NPM";

export default new Command(["stats"], __filename)
	.setBotPermissions([])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		if (msg.args.length === 0) return new CommandError("ERR_INVALID_USAGE", cmd);

		const p = NPM.parseString(msg.args[0].toLowerCase().trim());

		if (p === null) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.parseError", [msg.args[0].toLowerCase()]));

		const { status: { code }, body: pkg } = await NPM.getPackage(p.name);

		if (code !== 200) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.notFound", [p.name, p.version ?? "latest"]));

		if (msg.args.length >= 2 && !/^\d{4}-\d{2}-\d{2}$/.test(msg.args[1])) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.invalidDate`, [msg.args[1]]));
		if (msg.args.length >= 3 && !/^\d{4}-\d{2}-\d{2}$/.test(msg.args[2])) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.invalidDate`, [msg.args[2]]));

		const from = new Date(msg.args[1] || Date.now() - 6.048e+8);
		const to = new Date(msg.args[2] || Date.now());

		const { status, body: stats } = await NPM.getStats(p.name, `${from.getFullYear()}-${from.getMonth() + 1}-${from.getDate()}`, `${to.getFullYear()}-${to.getMonth() + 1}-${to.getDate()}`);

		if (status.code !== 200) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.unexpectedResponse`, [status.code, status.message]));

		return msg.reply({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setTitle(`${pkg.name}@${pkg["dist-tags"].latest} - Stats`)
				.setDescription([
					`{lang:other.words.period$ucwords$}: ${stats.start} - ${stats.end}`,
					`{lang:other.words.downloads$ucwords$}: **${stats.downloads.toLocaleString()}**`
				].join("\n"))
				.setColor(Colors.npm)
				.setTimestamp(new Date().toISOString())
				.toJSON()
		})
	});
