import { mdb } from "../Database";
import UserConfig from "../config/UserConfig";
import config from "../../config";
import NPMBot from "../../main";
import { Colors } from "../Constants";
import GuildConfig, { DBKeys } from "../config/GuildConfig";
import DailyJoins from "../handlers/DailyJoinsHandler";
import Logger from "../Logger";
import Utility from "./Utility";
import { performance } from "perf_hooks";

export default class TimedTasks {
	private constructor() {
		throw new TypeError("This class may not be instantiated, use static methods.");
	}

	static async runAll(client: NPMBot) {
		const start = performance.now();
		const d = new Date();
		if (d.getSeconds() === 0) {
			if (d.getMinutes() === 0) {
				await this.runDeleteUsers(client).then(() => Logger.debug(["Timed Tasks", "Delete Users"], "Finished processing."));
				await this.runDeleteGuilds(client).then(() => Logger.debug(["Timed Tasks", "Delete Guilds"], "Finished processing."));
				await this.runRefreshBoosters(client).then(() => Logger.debug(["Timed Tasks", "Refresh Boosters"], "Finished processing."));
				if (!config.beta && d.getHours() === 0) await this.runDailyJoins(client).then(() => Logger.debug(["Timed Tasks", "Daily Joins"], "Finished processing."));
			}
		}
		await this.runUpdateStatus(client, d);
		if ((d.getSeconds() % 5) === 0) await this.runCalculateCPUUsage(client);
		const end = performance.now();
		if (d.getSeconds() === 0) Logger.debug(["Timed Tasks"], `Total processing took ${(end - start).toFixed(3)}ms`);
	}

	static async runDeleteUsers(client: NPMBot) {
		const d = await mdb.collection<UserConfig>("users").find({
			$and: [
				{ deletion: { $ne: 0 } },
				{ deletion: { $ne: null } }
			]
		}).toArray();

		if (d.length === 0) {
			if (config.beta) Logger.debug(["Timed Tasks", "Delete Users"], "No processable entries found.");
			return;
		}

		await Promise.all(d.map(async (u) => {
			const s = await client.getUser(u.id);
			if (s === null) throw new TypeError(`Invalid user ${u.id} in delete`);

			await s.getDMChannel().then(dm => dm.createMessage({
				embed: {
					title: "Data Deleted",
					description: "Your data has been purged from our database. Please note: if you send a message in another server that has me in it, a new user entry will be created.",
					timestamp: new Date().toISOString(),
					color: Colors.green
				}
			})).catch(err => null);

			await mdb.collection<UserConfig>("users").findOneAndDelete({ id: u.id });
			Logger.debug(["Timed Tasks", "Delete Users"], `Deleted the user "${u.id}"`);
		}));
	}

	static async runDeleteGuilds(client: NPMBot) {
		const d = await mdb.collection<GuildConfig>("guilds").find({
			$and: [
				{ deletion: { $ne: 0 } },
				{ deletion: { $ne: null } }
			]
		}).toArray();

		if (d.length === 0) {
			if (config.beta) Logger.debug(["Timed Tasks", "Delete Guilds"], "No processable entries found.");
			return;
		}

		await Promise.all(d.map(async (u) => {
			await mdb.collection<GuildConfig>("guilds").findOneAndDelete({ id: u.id });
			Logger.debug(["Timed Tasks", "Delete Guild"], `Deleted the guild "${u.id}"`);
		}));
	}

	static async runDailyJoins(client: NPMBot) {
		Logger.debug(["Timed Tasks", "Daily Joins"], "run");
		DailyJoins(client);
	}

	static async runRefreshBoosters(client: NPMBot) {
		if (config.roles.booster === null) return;
		const g = await client.getGuild(config.client.supportServerId);
		if (g === null) throw new TypeError("support server not found");
		if (g.members.size !== g.memberCount) await g.fetchAllMembers();

		await mdb.collection("users").updateMany({
			booster: true
		}, {
			$set: {
				booster: false
			}
		});

		let i = 0;
		for (const [id, member] of g.members) {
			if (member.roles.includes(config.roles.booster)) {
				i++;
				await mdb.collection("users").findOneAndUpdate({
					id
				}, {
					$set: {
						booster: true
					}
				});
			}
		}

		Logger.debug(["Timed Tasks", "Refresh Boosters"], `Got ${i} boosters.`);
	}

	// explination in index.ts
	static async runCalculateCPUUsage(client: NPMBot) {
		client.cpuUsage = await Utility.getCPUUsage();
	}

	static async runUpdateStatus(client: NPMBot, d: Date) {
		const s = config.statuses(client);
		const st = s.find(t => t.filter(d.getHours(), d.getMinutes(), d.getSeconds()));
		if (!st) return;
		else {
			await client.editStatus(st.status, {
				name: st.name,
				type: st.type
			});
		}
	}
}
