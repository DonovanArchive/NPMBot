import config from "../config";
import ClientEvent from "../util/ClientEvent";
import { Colors } from "../util/Constants";
import EmbedBuilder from "../util/EmbedBuilder";
import Logger from "../util/Logger";

export default new ClientEvent("connect", async function (id) {
	this.w.get("status")!.execute({
		embeds: [
			new EmbedBuilder(config.devLanguage)
				.setColor(Colors.orange)
				.setTimestamp(new Date().toISOString())
				.setTitle("Shard Connect")
				.setDescription(`Shard #${id} is connecting.`)
				.setFooter(`${this.shards.size - (id + 1)} Shard${this.shards.size - (id + 1) === 1 ? "" : "s"} Remaining.`)
				.toJSON()
		]
	});

	Logger.debug("General", `Shard #${id} is connecting.`);
});
