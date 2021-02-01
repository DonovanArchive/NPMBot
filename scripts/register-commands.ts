import { ApplicationCommandOptionType } from "../src/util/DiscordCommands/Constants";
import CommandHelper from "../src/util/DiscordCommands/main";
import Language from "../src/util/Language";
import config from "../src/config";
import beta from "../src/config/client/beta.json";
import production from "../src/config/client/production.json";

const c = production;
const h = new CommandHelper(c.token, c.id);

const guildId = "805525642682302544";

process.nextTick(async () => {

	/* start information */

	await h.createGlobalCommand("botinfo", Language.get(config.devLanguage, "commands.information.botinfo.description", [], false, true, true), []);

	await h.createGlobalCommand("invite", Language.get(config.devLanguage, "commands.information.invite.description", [], false, true, true), []);

	await h.createGlobalCommand("ping", Language.get(config.devLanguage, "commands.information.ping.description", [], false, true, true), []);

	/* end information */

	/* start misc */

	await h.createGlobalCommand("bugreport", Language.get(config.devLanguage, "commands.misc.bugreport.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.STRING,
			name: "report",
			description: "A description of the bug you're reporting.",
			required: true
		}
	]);

	await h.createGlobalCommand("help", Language.get(config.devLanguage, "commands.misc.help.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.STRING,
			name: "category",
			description: "The category to get help with",
			choices: [
				{
					name: "Informaton",
					value: "information"
				},
				{
					name: "Miscellaneous",
					value: "misc"
				},
				{
					name: "NPM",
					value: "npm"
				}
			]
		}
	]);

	await h.createGlobalCommand("prefix", Language.get(config.devLanguage, "commands.misc.prefix.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.SUB_COMMAND,
			name: "add",
			description: "Add a prefix to this server.",
			options: [
				{
					type: ApplicationCommandOptionType.STRING,
					name: "prefix",
					description: "The prefix to add.",
					required: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SUB_COMMAND,
			name: "remove",
			description: "Remove a prefix from this server.",
			options: [
				{
					type: ApplicationCommandOptionType.STRING,
					name: "prefix",
					description: "The prefix to remove.",
					required: true
				}
			]
		},
		{
			type: ApplicationCommandOptionType.SUB_COMMAND,
			name: "list",
			description: "[DOES NOT WORK, DISCORD ISSUE, USE NORMAL COMMAND] List the prefixes this server has.",
			options: []
		},
		{
			type: ApplicationCommandOptionType.SUB_COMMAND,
			name: "reset",
			description: "[DOES NOT WORK, DISCORD ISSUE, USE NORMAL COMMAND] Reset this server's prefixes.",
			options: []
		}
	]);

	await h.createGlobalCommand("suggest", Language.get(config.devLanguage, "commands.misc.suggest.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.STRING,
			name: "suggestion",
			description: "A description of what you're suggesting.",
			required: true
		}
	]);

	/* end misc */

	/* start npm */

	await h.createGlobalCommand("bugs", Language.get(config.devLanguage, "commands.npm.bugs.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.STRING,
			name: "package",
			description: "The package to get the bugs url for.",
			required: true
		}
	]);

	await h.createGlobalCommand("docs", Language.get(config.devLanguage, "commands.npm.docs.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.STRING,
			name: "package",
			description: "The package to get the docs url for.",
			required: true
		}
	]);

	await h.createGlobalCommand("info", Language.get(config.devLanguage, "commands.npm.info.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.STRING,
			name: "package",
			description: "The package to get info for.",
			required: true
		}
	]);

	await h.createGlobalCommand("repo", Language.get(config.devLanguage, "commands.npm.repo.description", [], false, true, true), [
		{
			type: ApplicationCommandOptionType.STRING,
			name: "package",
			description: "The package to get the repo url for.",
			required: true
		}
	]);

	/* end npm */

	/* count */

	await h.fetchGlobalCommands().then(c => console.log("We have", c.length, "global commands."));
	await h.fetchGuildCommands(guildId).then(c => console.log("We have", c.length, "guild commands."));
});
