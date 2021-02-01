import Eris from "eris";
import NPMBot from "../main";


export default class MessageCollector {
	client: NPMBot;
	collectors: {
		channel: string;
		filter: (msg: Eris.Message<Eris.TextableChannel>) => boolean;
		resolve: (value: Eris.Message<Eris.TextableChannel>[] | Eris.Message<Eris.TextableChannel>) => void;
		limit: number;
		messages: Eris.Message[];
		timeout: number;
		i: NodeJS.Timeout;
	}[];
	constructor(client: NPMBot) {
		this.client = client;
		this.collectors = [];
		this.client.on("messageCreate", this.processMessage.bind(this));
	}

	async processMessage(msg: Eris.Message) {
		if (msg.author.bot) return;
		const collectors = this.collectors.filter(col => col.channel === msg.channel.id);
		for (const c of collectors) {
			if (c && c.filter(msg)) c.messages.push(msg);
			if (c.messages.length >= c.limit) {
				clearTimeout(c.i);
				c.resolve(c.limit === 1 ? c.messages[0] : c.messages);
			}
		}
	}

	async awaitMessages<T extends Eris.TextableChannel = Eris.GuildTextableChannel>(channelId: string, timeout: number, filter: (msg: Eris.Message<T>) => boolean, limit: number): Promise<Eris.Message<T>[]>;
	async awaitMessages<T extends Eris.TextableChannel = Eris.GuildTextableChannel>(channelId: string, timeout: number, filter?: (msg: Eris.Message<T>) => boolean, limit?: 1): Promise<Eris.Message<T> | null>;
	async awaitMessages<T extends Eris.TextableChannel = Eris.GuildTextableChannel>(channelId: string, timeout: number, filter?: (msg: Eris.Message<T>) => boolean, limit?: number): Promise<Eris.Message<T>[] | Eris.Message<T> | null> {
		return new Promise((a, b) => {
			this.collectors.push({
				channel: channelId,
				filter: filter ?? (() => true) as any,
				resolve: a as any,
				limit: limit || 1,
				messages: [],
				timeout,
				i: setTimeout(a.bind(null, [undefined, 1].includes(limit) ? null : []), timeout)
			});
		});
	}
}
