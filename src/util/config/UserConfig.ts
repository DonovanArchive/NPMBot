/// <reference path="../@types/global.d.ts" />
/// <reference path="../@types/db.d.ts" />
import config from "../../config";
import { UpdateQuery, FindOneAndUpdateOption } from "mongodb";
import db, { mdb } from "../Database";
import Utility from "../Functions/Utility";
import Logger from "../Logger";
import NPMBot from "../../main";

export type DBKeys = ConfigDataTypes<UserConfig>;
export default class UserConfig {
	id: string;
	booster: boolean;
	donations: {
		"ko-fi": {
			name: string | null;
		};
		"totalMonths": number;
		"activationTime": number | null;
	};
	deletion: number | null;
	constructor(id: string, data: MaybeId<ConfigDataTypes<UserConfig, "id">>) {
		this.id = id;
		this.load.call(this, data);
	}

	private load(data: MaybeId<ConfigDataTypes<UserConfig, "id">>) {
		if ("_id" in data) delete (data as any)._id;
		Object.assign(this, Utility.mergeObjects(data, config.defaults.config.user));
		return this;
	}

	async reload() {
		const r = await mdb.collection("users").findOne({ id: this.id });
		this.load.call(this, r);
		return this;
	}

	async mongoEdit<T = UserConfig>(d: UpdateQuery<T>, opt?: FindOneAndUpdateOption<T>) {
		const j = await mdb.collection<T>("users").findOneAndUpdate({ id: this.id } as any, d, opt);
		await this.reload();
		return j;
	}

	async edit(data: ConfigEditTypes<UserConfig, "id">) {
		await mdb.collection("users").findOneAndUpdate({
			id: this.id
		}, {
			$set: Utility.mergeObjects(data, this)
		});

		return this.reload();
	}

	async checkPremium(checkBoost = false): Promise<{
		remainingMonths: number | "BOOSTER";
		activationTime: number | null;
		active: boolean;
	}> {
		if (checkBoost && this.booster) return {
			remainingMonths: "BOOSTER",
			activationTime: null,
			active: true
		};

		if (!this.donations.activationTime || this.donations.totalMonths < 1) return {
			remainingMonths: 0,
			activationTime: null,
			active: false
		};
		// 30.42 days
		const d = 2.62829e+9;
		if ((this.donations.activationTime + d) > Date.now()) {
			if (this.donations.totalMonths === 1) {
				await this.mongoEdit({
					$set: {
						"donations.totalMonths": 0
					}
				});
				return {
					remainingMonths: 0,
					activationTime: null,
					active: false
				};
			} else {
				await this.mongoEdit({
					$set: {
						"donations.totalMonths": this.donations.totalMonths - 1,
						"donations.activationTime": Date.now()
					}
				});
			}
		}

		return {
			remainingMonths: this.donations.totalMonths,
			activationTime: this.donations.activationTime,
			active: true
		};
	}

	async checkBlacklist() {
		return db.checkBl("user", this.id);
	}
	async addBlacklist(blame: string, blameId: string, reason?: string, expire?: number, report?: string) {
		return db.addBl("user", this.id, blame, blameId, reason, expire, report);
	}

	async checkVote() {
		return db.checkVote(this.id);
	}

	async fix() {
		const obj: Parameters<UserConfig["edit"]>[0] = Object.create(null);
		if (typeof this.booster !== "boolean") obj.booster = false;
		if (JSON.stringify(obj) !== "{}") {
			Logger.warn(["Database", "User"], `Fixed user "${this.id}": ${JSON.stringify(obj)}`);
			await this.mongoEdit({
				$set: obj
			});
		}

		return this;
	}
}
