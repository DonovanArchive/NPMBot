import Command from "../../util/cmd/Command";
import CommandError from "../../util/cmd/CommandError";
import { Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import Language from "../../util/Language";
import NPM from "../../util/NPM";

export default new Command(["bugs"], __filename)
	.setBotPermissions([])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		if (msg.args.length === 0) return new CommandError("ERR_INVALID_USAGE", cmd);

		const p = NPM.parseString(NPM.scopedParsing(msg.args[0].toLowerCase().trim()));

		if (p === null) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.parseError", [NPM.scopedParsing(msg.args[0].toLowerCase().trim())]));

		const { status: { code }, body: pkg } = await NPM.getPackage(p.name);

		if (code !== 200) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.notFound", [p.name, p.version ?? "latest"]));

		if (pkg.time.unpublished) {
			const d = new Date(pkg.time.unpublished.time);
			return msg.reply({
				embed: new EmbedBuilder(msg.gConfig.settings.lang)
					.setTitle(`${pkg.name}@unpublished`)
					.setDescription(
						Language.get(msg.gConfig.settings.lang, "other.general.unpublished", [pkg.time.unpublished.name, `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`, `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`])
					)
					.setColor(Colors.npm)
					.setTimestamp(new Date().toISOString())
					.toJSON()
			});
		}

		const v = p.version === null ? { latest: pkg["dist-tags"].latest } : NPM.parseVersion(p.version, Object.keys(pkg.versions), pkg["dist-tags"]);
		if (v === null) return msg.reply(Language.get(msg.gConfig.settings.lang, "other.general.notFound", [pkg.name, p.version ?? "latest"]));
		const ver = pkg.versions[v.latest];

		return msg.reply({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setTitle(`${pkg.name}@${ver.version} - bugs`)
				.setDescription(ver.bugs?.url || `{lang:${cmd.lang}.none|${p.name}}`)
				.setColor(Colors.npm)
				.setTimestamp(new Date().toISOString())
				.toJSON()
		})
	});
