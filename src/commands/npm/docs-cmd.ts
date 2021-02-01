import Command from "../../util/cmd/Command";
import CommandError from "../../util/cmd/CommandError";
import { Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import Language from "../../util/Language";
import NPM from "../../util/NPM";

export default new Command(["docs"], __filename)
	.setBotPermissions([])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		if (msg.args.length === 0) return new CommandError("ERR_INVALID_USAGE", cmd);

		const p = NPM.parseString(msg.args[0].toLowerCase().trim());

		if (p === null) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.parseError", [msg.args[0].toLowerCase()]));

		const { status, body: pkg } = await NPM.getPackage(p.name);

		if (status !== 200) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.notFound", [p.name, p.version ?? "latest"]));

		const v = p.version === null ? { latest: pkg["dist-tags"].latest } : NPM.parseVersion(p.version, Object.keys(pkg.versions), pkg["dist-tags"]);
		if (v === null) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.notFound", [pkg.name, p.version ?? "latest"]));
		const ver = pkg.versions[v.latest];

		return msg.reply({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setTitle(`${pkg.name}@${ver.version} - docs`)
				.setDescription(ver.homepage || `{lang:${cmd.lang}.none|${p.name}}`)
				.setColor(Colors.npm)
				.setTimestamp(new Date().toISOString())
				.toJSON()
		})
	});
