/// <reference path="../@types/global.d.ts" />
/// <reference path="../@types/db.d.ts" />
import config from "../../config";
import { UpdateQuery, FindOneAndUpdateOption } from "mongodb";
import db, { mdb } from "../Database";
import { Languages } from "../Language";
import Utility from "../Functions/Utility";
import Logger from "../Logger";

export type DBKeys = ConfigDataTypes<GuildConfig>;
export default class GuildConfig {
	id: string;
	settings: {
		lang: Languages;
	};
	prefix: ArrayOneOrMore<string>;
	disable: (({
		type: "channel" | "role" | "user";
		id: string;
	} | {
		type: "server";
	}) & ({
		command: string;
	} | {
		category: string;
	} | {
		all: true;
	}))[];
	deletion: number | null;
	constructor(id: string, data: MaybeId<ConfigDataTypes<GuildConfig, "id">>) {
		this.id = id;
		this.load.call(this, data);
	}

	private load(data: MaybeId<ConfigDataTypes<GuildConfig, "id">>) {
		if ("_id" in data) delete (data as any)._id;
		Object.assign(this, Utility.mergeObjects(data, config.defaults.config.guild));
		return this;
	}

	async reload() {
		const r = await mdb.collection("guilds").findOne({ id: this.id });
		this.load.call(this, r);
		return this;
	}

	async mongoEdit<T = DBKeys>(d: UpdateQuery<T>, opt?: FindOneAndUpdateOption<T>) {
		const j = await mdb.collection<T>("guilds").findOneAndUpdate({ id: this.id } as any, d, opt);
		await this.reload();
		return j;
	}

	async edit(data: ConfigEditTypes<GuildConfig, "id">) {
		await mdb.collection("guilds").findOneAndUpdate({
			id: this.id
		}, {
			$set: Utility.mergeObjects(data, this)
		});

		return this.reload();
	}

	async create() {
		const e = await mdb.collection("guilds").findOne({
			id: this.id
		});
		if (!e) await mdb.collection("guilds").insertOne({
			id: this.id,
			...config.defaults.config.guild
		});

		return this;
	}

	async delete() {
		await mdb.collection("guilds").findOneAndDelete({ id: this.id });
	}

	async reset() {
		await this.delete();
		await this.create();
		return this.reload();
	}

	async checkBlacklist() {
		return db.checkBl("guild", this.id);
	}
	async addBlacklist(blame: string, blameId: string, reason?: string, expire?: number, report?: string) {
		return db.addBl("guild", this.id, blame, blameId, reason, expire, report);
	}

	async fix() {
		const obj: Parameters<GuildConfig["edit"]>[0] = Object.create(null);
		if (!Array.isArray(this.disable)) obj.disable = [];
		if (!Array.isArray(this.prefix)) obj.prefix = [
			config.defaults.prefix
		];
		if (this.prefix?.length === 0) obj.prefix = [
			config.defaults.prefix
		];
		if (JSON.stringify(obj) !== "{}") {
			Logger.warn(["Database", "Guild"], `Fixed guild "${this.id}": ${JSON.stringify(obj)}`);
			await this.mongoEdit({
				$set: obj
			});
		}

		return this;
	}
}
