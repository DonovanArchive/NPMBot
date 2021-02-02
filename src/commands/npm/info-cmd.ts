import Command from "../../util/cmd/Command";
import CommandError from "../../util/cmd/CommandError";
import { Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import Strings from "../../util/Functions/Strings";
import Time from "../../util/Functions/Time";
import Language from "../../util/Language";
import NPM from "../../util/NPM";

export default new Command(["info"], __filename)
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

		const e = new EmbedBuilder(msg.gConfig.settings.lang)
			.setTitle(`${pkg.name}@${ver.version}`)
			.setDescription([
				ver.description,
				ver.homepage,
				...(ver.deprecated === undefined ? [] : [
					"",
					`**DEPRECATED** ⚠️ - ${ver.deprecated}`
				]),
				...(ver.keywords === undefined ? [] : [
					"",
					Strings.truncate(`Keywords: **${ver.keywords.join("**, **")}**`, 512)
				]),
				"",
				"Dist:",
				`- TarBall: [${ver.dist.tarball}](${ver.dist.tarball})`,
				`- SHASum: **${ver.dist.shasum}**`,
				// looks bad on Discord
				// `- Integrity: **${ver.dist.integrity || "Not Provided"}**`,
				`- Unpacked Size: **${ver.dist.unpackedSize === undefined ? "Not Provided" : Strings.formatBytes(ver.dist.unpackedSize)}**`,
				"",
				"Maintainers:",
				...ver.maintainers.map(v => `- [${v.name}](https://www.npmjs.com/~${v.name}) <**${v.email}**>`),
				"",
				`published ${Time.formatAgo(Date.now() - new Date(pkg.time[v.latest]).getTime(), false, false, true)} by [${ver._npmUser.name}](https://www.npmjs.com/~${ver._npmUser.name}) <**${ver._npmUser.email}**>`
			].join("\n"))
			.setFooter(`License: ${ver.license || "NONE"} | Dependencies: ${Object.keys(ver.dependencies ?? {}).length} | Versions: ${Object.keys(pkg.versions).length}`)
			.setColor(Colors.npm)
			.setTimestamp(new Date().toISOString());

		if (ver.dependencies !== undefined) {
			const dep = Object.keys(ver.dependencies);
			if (dep.length > 0) e.addField("Dependencies", dep.map(v => `**${v}**: ${ver.dependencies![v]}`).join(" "), false);
		}

		// npm doesn't show these, so we aren't going to
		/* if (ver.devDependencies !== undefined) {
			const dep = Object.keys(ver.devDependencies);
			if (dep.length > 0) e.addField("Developer Dependencies", dep.map(v => `**${v}**: ${ver.devDependencies![v]}`).join(" "), false);
		}

		if (ver.optionalDependencies !== undefined) {
			const dep = Object.keys(ver.optionalDependencies);
			if (dep.length > 0) e.addField("Optional Dependencies", dep.map(v => `**${v}**: ${ver.optionalDependencies![v]}`).join(" "), false);
		} */

		return msg.reply({
			embed: e.toJSON()
		})
	});
