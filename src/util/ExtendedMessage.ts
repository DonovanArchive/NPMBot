import Eris from "eris";
import NPMBot from "../main";
import { db } from "./Database";
import GuildConfig from "./config/GuildConfig";
import UserConfig from "./config/UserConfig";
import Command from "./cmd/Command";
import config from "../config";

export default class ExtendedMessage {
	#client: NPMBot;
	#msg: Eris.Message<Eris.GuildTextableChannel>;
	#gConfig: GuildConfig;
	#uConfig: UserConfig;
	#args: string[];
	#cmd: Command | null;
	#prefix: string;
	#dashedArgs: {
		value: string[];
		keyValue: {
			[k: string]: string;
		};
	};
	slash: boolean;
	slashInfo: {
		id: string;
		token: string;
	} | null;
	constructor(msg: Eris.Message<Eris.GuildTextableChannel>, client: NPMBot, slash?: boolean, slashInfo?: ExtendedMessage["slashInfo"]) {
		this.#msg = msg as any;
		this.#client = client;
		this.slash = slash ?? false;
		this.slashInfo = slashInfo ?? null;
		// tag & me were moved to ErisUtil
		if (this.slash) this.channel.createMessage = ((content: Eris.MessageContent, file?: Eris.MessageFile | Eris.MessageFile[]) => {
			if (typeof content !== "string" && content.messageReferenceID) delete content.messageReferenceID;

			return this.#client.createMessage(this.channel.id, content, file) as any;
		});
	}

	get id() {
		return this.#msg.id;
	}
	get delete() {
		return this.#msg.delete.bind(this.#msg);
	}
	get edit() {
		return this.#msg.edit.bind(this.#msg);
	}
	get author() {
		return this.#msg.author;
	}
	get member() {
		return this.#msg.member;
	}
	get channel() {
		return this.#msg.channel;
	}
	get content() {
		return this.#msg.content;
	}

	get mentions() {
		return {
			channels: this.#msg.channelMentions.map(c => this.#msg.channel.guild.channels.get(c) || null).filter(c => c),
			channelsRaw: this.#msg.channelMentions,
			roles: this.#msg.roleMentions.map(r => this.#msg.channel.guild.roles.get(r) || null).filter(r => r),
			rolesRaw: this.#msg.roleMentions,
			users: this.#msg.mentions,
			usersRaw: this.#msg.mentions.map(u => u.id),
			members: this.#msg.mentions.map(m => this.#msg.channel.guild.members.get(m.id) || null).filter(m => m),
			membersRaw: this.#msg.mentions.map(m => m.id)
		};
	}

	get gConfig() {
		return this.#gConfig;
	}

	get uConfig() {
		return this.#uConfig;
	}

	get args() {
		return this.#args;
	}

	set args(a: string[]) {
		this.#args = a;
	}

	get dashedArgs() {
		return this.#dashedArgs;
	}

	set dashedArgs(s) {
		this.dashedArgs = s;
	}

	get cmd() {
		return this.#cmd;
	}

	get prefix() {
		return this.#prefix;
	}

	get timestamp() {
		return this.#msg.timestamp;
	}

	get erisMessage() {
		return this.#msg;
	}

	get client() {
		return this.#client;
	}

	async load() {
		const g = this.#gConfig = await db.getGuild(this.channel.guild.id).then(v => v.fix());
		const u = this.#uConfig = await db.getUser(this.author.id).then(v => v.fix());
		const p = this.#msg.content.match(new RegExp(`(${g.prefix.map(v => v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")).join("|")}|<@!?${this.#client.user.id}>)(?:\s+)*`, "i"));
		if (!p || p.length === 0) return false;
		const prefix = this.#prefix = p[1].toLowerCase();
		if (!this.#msg.content.toLowerCase().startsWith(prefix)) return false;
		// this should only happen on mentions, we replace it because it looks weird in ``
		if (!g.prefix.includes(this.#prefix)) this.#prefix = g.prefix[0];
		const args = this.#args = this.#msg.content.slice(prefix.length).split(" ").filter(a => a.length > 0 && !a.match(/^--(.{1,})(?:=(.*))?$/));
		const c = args.splice(0, 1)[0]?.toLowerCase();
		const cmd = this.#cmd = !c ? null : this.#client.cmd.getCommand(c).cmd;
		const d = this.#dashedArgs = {
			value: this.#msg.content.slice(prefix.length).split(" ").map(a => a.match(new RegExp("^--([^=].{1,})$"))).map(a => !a || !a[1] ? null : a[1]).filter(a => a !== null) as string[],
			keyValue: this.#msg.content.slice(prefix.length).split(" ").map(a => a.match(new RegExp("^--(.{1,})=(.*)$"))).map(a => !a || a.length < 3 ? null : ({ [a[1]]: a[2] })).filter(a => a !== null).reduce((a, b) => ({ ...a, ...b }), {}) as { [k: string]: string; }
		};
		return true;
	}

	async getUserFromArgs(argPos = 0, useMentions = true, mentionPos = argPos): Promise<Eris.User | null> {
		if (useMentions && this.mentions.users[mentionPos]) return this.mentions.users[mentionPos];
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const username = this.#client.users.find(u => u.username.toLowerCase() === t);
		const tag = this.#client.users.find(u => `${u.username}#${u.discriminator}`.toLowerCase() === t);
		const [, a, b] = t.match(/(?:<@!?([0-9]{15,21})>|([0-9]{15,21}))/) ?? [];
		const id = a || b ? await this.#client.getUser(a || b).catch(err => null) : null;
		return username || tag || id || null;
	}

	async getMemberFromArgs(argPos = 0, useMentions = true, mentionPos = argPos): Promise<Eris.Member | null> {
		if (useMentions && this.mentions.members[mentionPos]) return this.mentions.members[mentionPos];
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const username = this.channel.guild.members.find(m => m.username.toLowerCase() === t);
		const tag = this.channel.guild.members.find(m => `${m.username}#${m.discriminator}`.toLowerCase() === t);
		let id: Eris.Member | null = null;
		if (/[0-9]{15,21}/.test(t)) {
			id = this.channel.guild.members.find(m => m.id === this.args[argPos]) ?? null;
			if (id === null) {
				id = await this.channel.guild.getRESTMember(t).catch(err => null);
				if (id) this.channel.guild.members.add(id);
			}
		}

		return username || tag || id || null;
	}

	async getChannelFromArgs<T extends Eris.GuildChannel = Eris.TextChannel>(argPos = 0, useMentions = true, mentionPos = argPos): Promise<T | null> {
		if (useMentions && this.mentions.channels[mentionPos]) return this.mentions.channels[mentionPos] as T;
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const name = this.channel.guild.channels.find(c => c.name.toLowerCase() === t) as T;
		let id: T | null = null;
		if (/[0-9]{15,21}/.test(t)) {
			id = this.channel.guild.channels.find(c => c.id === this.args[argPos]) as T ?? null;
			if (id === null) id = await this.#client.getRESTChannel(t).catch(err => null) as T;
		}

		return name || id || null;
	}

	async getRoleFromArgs(argPos = 0, useMentions = true, mentionPos = argPos): Promise<Eris.Role | null> {
		if (useMentions && this.mentions.roles[mentionPos]) return this.mentions.roles[mentionPos];
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const name = this.channel.guild.roles.find(r => r.name.toLowerCase() === t);
		const id = /[0-9]{15,21}/.test(t) ? this.channel.guild.roles.find(r => r.id === this.args[argPos]) ?? null : null;

		return name || id || null;
	}

	async getReplyText(content: Eris.MessageContent, type?: "mention" | "quote" | "new", id?: string) {
		if (!type) type = config.beta ? "new" : "new"; // quote is undergoing changes
		if (!id) id = this.id;
		switch (type) {
			case "mention": {
				if (typeof content === "string") content = {
					content: `<@!${this.author.id}>, ${content}`
				};
				else content.content = `<@!${this.author.id}>${!content.content ? "" : `, ${content.content}`}`;
				break;
			}

			case "quote": {
				const m: Eris.Message | null = this.channel.messages.get(id) || await this.channel.getMessage(id).catch(err => null);
				if (!id || m === null) throw new TypeError("Invalid message id provided.");
				if (typeof content === "string") content = {
					content: `> ${m.content}\n<@!${m.author.id}>, ${content}`
				};
				else content.content = `> ${m.content}\n<@!${m.author.id}>, ${content.content || ""}`;
				break;
			}

			case "new": {
				if (!id) throw new TypeError("Invalid message id provided.");
				if (typeof content === "string") content = {
					content
				};
				content.messageReferenceID = id;

				break;
			}
		}

		return content;
	}

	async reply(content: Eris.MessageContent, type?: "mention" | "quote" | "new") {

		/* if (this.slash) {
			if (type === "new") type = "mention";
			const text = await this.getReplyText(content, type, this.id);
			return this.#client.h.createInteractionResponse(this.slashInfo.id, this.slashInfo.token, InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE)
		}
		else { */
		if (this.slash) return this.channel.createMessage(content);
		const text = await this.getReplyText(content, type, this.id);
		return this.channel.createMessage(text);
		/* } */
	}
}
