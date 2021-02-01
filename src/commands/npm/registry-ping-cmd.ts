import Command from "../../util/cmd/Command";
import CommandError from "../../util/cmd/CommandError";
import { Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import Strings from "../../util/Functions/Strings";
import Time from "../../util/Functions/Time";
import Language from "../../util/Language";
import NPM from "../../util/NPM";
import { performance } from "perf_hooks";
import * as http from "http";
import * as https from "https";
import { URL } from "url";
import config from "../../config";

export default new Command(["registry-ping"], __filename)
	.setBotPermissions([])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(true)
	.setExecutor(async function (msg, cmd) {
		// neet to figure out how to catch ENOTFOUND and such
		const reg = /*msg.args[0] ||*/ "https://registry.npmjs.com";
		if (!reg.match(/https?:\/\/*./i)) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.invalidReg`, [msg.args[0]]));
		let statusCode: number, statusMessage: string, end: number;
		const start = performance.now();
		const url = new URL(reg);
		await new Promise<void>((a, b) =>
			(url.protocol === "https:" ? https : http)
				.request({
					method: "GET",
					headers: {
						"User-Agent": config.web.userAgent
					},
					timeout: 5e3,
					host: url.host,
					path: "/-/ping",
					protocol: url.protocol
				}, (res) => {
					res
						.on("error", b)
						.on("data", () => { })
						.on("end", () => {
							console.log("end");
							end = performance.now();
							statusCode = res.statusCode!;
							statusMessage = res.statusMessage!;
							return a();
						})
				})
				.end()
		);

		if (statusCode! >= 400) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.invalidResponse`, [statusCode!, statusMessage!]));

		return msg.reply({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setDescription([
					`{lang:other.lang.registry$ucwords$}: **${reg}**`,
					`{lang:other.lang.time$ucwords$}: ${Time.ms((end! - start), true, true, true)}`
				].join("\n"))
				.setColor(Colors.npm)
				.setTimestamp(new Date().toISOString())
				.toJSON()
		})
	});
