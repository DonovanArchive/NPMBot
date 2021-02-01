import { Route } from "..";
import config from "../../config";
import * as fs from "fs";

export default class ReportsRoute extends Route {
	constructor() {
		super("/reports");
	}

	setup() {
		super.setup();
		const app = this.app;
		const client = this.client;

		app
			.get("/", async (req, res) => res.status(400).end("Missing Report Type."))
			.get("/:reportType", async (req, res) => res.status(400).end("Missing User ID."))
			.get("/:reportType/:userId", async (req, res) => res.status(400).end("Missing Report ID."))
			.get("/:reportType/:userId/:reportId", async (req, res) => {
				if (!fs.existsSync(`${config.dir.logs.spam}/${req.params.userId}-${req.params.reportId}-${req.params.reportType}.json`)) return res.status(404).end("Report not found.");

				const f = JSON.parse(fs.readFileSync(`${config.dir.logs.spam}/${req.params.userId}-${req.params.reportId}-${req.params.reportType}.json`).toString());
				// @TODO padding on time
				const report = `----- BEGIN NEW SPAM REPORT -----\n\nReport generated at ${new Date(f.generatedTimestamp).getMonth() + 1}/${new Date(f.generatedTimestamp).getDate()}/${new Date(f.generatedTimestamp).getFullYear()} ${new Date(f.generatedTimestamp).getHours()}:${new Date(f.generatedTimestamp).getMinutes()}:${new Date(f.generatedTimestamp).getSeconds()} CST\nUser: ${f.userTag} (${f.userId})\nType: ${f.type === "cmd" ? "Command" : "Auto Response"}\nBeta: ${f.beta ? "Yes" : "No"}\nTotal VL: ${f.entries.length}\n\n----- NEW SPAM ENTRY -----\n${f.entries.map((e: any) => `\nTime: ${new Date(e.time).getMonth() + 1}/${new Date(e.time).getDate()}/${new Date(e.time).getFullYear()} ${new Date(e.time).getHours()}:${new Date(e.time).getMinutes()}:${new Date(e.time).getSeconds()} CST\n${e.cmd ? `Command: ${e.cmd}` : `Auto Response: ${e.response}`}\n`).join("\n----- NEW SPAM ENTRY -----\n")}`;

				return res.status(200).end(report);
			})
			.get("/:reportType/:userId/:reportId/json", async (req, res) => {
				if (fs.existsSync(`${config.dir.logs.spam}/${req.params.userId}-${req.params.reportId}-${req.params.reportType}.json`)) return res.status(200).json(JSON.parse(fs.readFileSync(`${config.dir.logs.spam}/${req.params.userId}-${req.params.reportId}-${req.params.reportType}.json`).toString()));
				else return res.status(404).json({ success: false, error: "report not found" });
			});
	}
}
