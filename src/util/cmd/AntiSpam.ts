import NPMBot from "../../main";

interface CommandEntry {
	time: number;
	user: string;
	type: "command";
	command: string;
}

export default class AntiSpam {
	client: NPMBot;
	private entries: (CommandEntry)[];
	private removeInterval: NodeJS.Timeout;
	constructor(client: NPMBot) {
		this.client = client;
		this.entries = [];
		this.removeInterval = setInterval(() => {
			const d = Date.now();
			this.entries = this.entries.filter(e => e.time + 3e4 > d);
		}, 1e3);
	}

	add(user: string, type: "command", command: string) {
		const time = Date.now();
		this.entries.push({
			time,
			user,
			type,
			command
		});
		return this;
	}

	get(user: string, type: "command"): CommandEntry[];
	get(user: string, type: "command"): (CommandEntry)[] {
		return this.entries.filter(e => e.user === user && e.type === type/* && (type === "command" && (e as any).command === d) || (type === "autoResponse" && (e as any).autoResponse === d)*/);
	}
}
