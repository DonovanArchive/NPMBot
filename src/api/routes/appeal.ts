import { Route } from "..";
import config from "../../config";

export default class AppealRoute extends Route {
	constructor() {
		super("/appeal");
	}

	setup() {
		super.setup();
		const app = this.app;

		app
			.get("/user/:id", async (req, res) => res.status(200).send(`Appeals have not been setup yet. Come ask us about it in our <a href="${config.client.socials.discord}">Support Server</a>.`).end())
			.get("/guild/:id", async (req, res) => res.status(200).send(`Appeals have not been setup yet. Come ask us about it in our <a href="${config.client.socials.discord}">Support Server</a>.`).end());
	}
}
