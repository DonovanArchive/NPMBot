import * as fs from "fs-extra";
import ClientEvent from "./util/ClientEvent";
import Logger from "./util/Logger";
import path from "path";
import Category from "./util/cmd/Category";
import CommandHandler from "./util/cmd/CommandHandler";
import WebhookStore from "./util/WebhookStore";
import StatsHandler from "./util/handlers/StatsHandler";
import MessageCollector from "./util/MessageCollector";
import API from "./api";
import config from "./config";
import { performance } from "perf_hooks";
import "./util/MonkeyPatch";
import Eris from "eris";
import db from "./util/Database";
import Request from "./util/Functions/Request";
import CommandHelper from "./util/DiscordCommands/main";

// create log directories if they don't exist
for (const l of Object.keys2(config.dir.logs)) if (!fs.existsSync(config.dir.logs[l]!)) fs.mkdirpSync(config.dir.logs[l]);

export default class NPMBot extends Eris.Client {
	cmd: CommandHandler;
	firstReady: boolean;
	w: WebhookStore;
	col: MessageCollector;
	sh: StatsHandler;
	events: Map<string, {
		handler: (...args: any[]) => void;
		event: ClientEvent;
	}>;
	v: {
		[k in "awoo" | "conga" | "furpile"]: {
			[k: string]: {
				timeout: NodeJS.Timeout;
				users: string[];
			};
		}
	};
	api: API;
	// this is stored here to avoid making the info command take at least 1 second on each run
	// will this make it inaccurate? Well yes, of course, but it makes the command not sit there stalling,
	// waiting for the test to finish
	cpuUsage: number;
	ev: {
		type: string;
		time: number;
	}[];
	evTotal: {
		[k: string]: number;
	};
	h: CommandHelper;
	constructor(token: string, options: Eris.ClientOptions) {
		super(token, options);
		this.firstReady = false;
		this.sh = new StatsHandler(this);
		this.events = new Map();
		this.v = {
			awoo: {},
			conga: {},
			furpile: {}
		};
		this.api = new API(this);
		this.cpuUsage = 0;
		this.ev = [];
		this.evTotal = {};
		this.cmd = new CommandHandler(this);
		this.w = new WebhookStore(this);
		this.col = new MessageCollector(this);
		db.setClient(this);
		this.loadEvents(true);
	}

	removeEv() {
		const d = Date.now();
		this.ev = this.ev.filter(v => (v.time + 1.5e4) > d);
	}

	async loadCommands() {
		const start = performance.now();
		Logger.debug(["Command Handler"], "Loading commands.");
		const c = fs.readdirSync(`${__dirname}/commands`);
		for (const f of c) {
			let cat;
			try {
				cat = await import(`${__dirname}/commands/${f}/index.${__filename.split(".").slice(-1)[0]}`);
				if (cat.default) cat = cat.default;
			} catch (e) {
				console.error(e);
			}

			if (cat instanceof Category) this.cmd.addCategory(cat);
			else throw new TypeError(`Missing or Invalid index in category "${f}" (${path.resolve(`${__dirname}/commands/${f}`)})`);
		}
		const end = performance.now();

		Logger.debug(["Command Handler"], `Finished loading ${this.cmd.commands.length} commands in ${(end - start).toFixed(3)}ms.`);
	}

	async loadEvents(removeAll: boolean) {
		const start = performance.now();
		if (removeAll) {
			this.removeAllListeners();
			Logger.debug(["Event Loader"], "Removing all listeners before loading events.");
		}
		const events = fs.readdirSync(`${__dirname}/events`);

		for (const event of events) {
			let e = await import(`${__dirname}/events/${event}`);
			if (e.default) e = e.default;
			if (e instanceof ClientEvent) {
				if (this.events.has(e.event)) this.off(e.event, this.events.get(e.event)!.handler);
				const handler = (...d: any[]) => e.handle(this, ...d);
				this.events.set(e.event, {
					handler,
					event: e
				});
				this.on(e.event, handler);
				Logger.debug(["Event Loader"], `Loaded the event "${e.event}".`);
			} else {
				Logger.error(["Event Loader"], `Error loading the event file "${event}", export is not an instance of ClientEvent.`);
				continue;
			}
		}
		const end = performance.now();

		Logger.debug(["Event Loader"], `Finished loading ${events.length} events in ${(end - start).toFixed(3)}ms.`);
	}

	async getUser(id: string) {
		if (this.users.has(id)) return this.users.get(id)!;
		const user: Eris.User | null = await this.getRESTUser(id).catch(err => null);
		if (user !== null) this.users.set(id, user);
		return user;
	}

	async getGuild(id: string) {
		if (this.guilds.has(id)) return this.guilds.get(id)!;
		const guild: Eris.Guild | null = await this.getRESTGuild(id).catch(err => null);
		return guild || null;
	}

	get createPaste() {
		return Request.createPaste;
	}
}
