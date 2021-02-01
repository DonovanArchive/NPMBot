import Eris from "eris";
import { Route } from "..";
import config from "../../config";
import Internal from "../../util/Functions/Internal";
import Redis from "../../util/Redis";

export default class StatsRoute extends Route {
	constructor() {
		super("/stats");
	}

	setup() {
		super.setup();
		const app = this.app;
		const client = this.client;

		app
			.get("/", async (req, res) => {
				const d = new Date((Date.now() - 432e5) - 8.64e+7);
				const id = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
				let k: string | number = await Redis.get(`stats:dailyJoins:${id}`).then(v => !v ? 0 : (client.guilds.size) - Number(v));
				if (!k) k = "Unknown.";
				else k = (client.guilds.size - Number(k)).toString();
				const stats = await client.sh.getStats();

				return res.status(200).json({
					success: true,
					clientStatus: "online",
					guildCount: client.guilds.size,
					userCount: client.users.size,
					shardCount: client.shards.size,
					largeGuildCount: client.guilds.filter(g => g.large).length,
					botVersion: config.version,
					library: "eris",
					libraryVersion: Eris.VERSION,
					nodeVersion: process.version,
					dailyJoins: k,
					commandCount: client.cmd.commands.length,
					commandsRan: stats.commands.general,
					messageCount: stats.messages.general,
					dmMessageCount: stats.directMessages.general
				});
			});
	}
}
