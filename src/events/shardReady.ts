import config from "../config";
import ClientEvent from "../util/ClientEvent";
import { Colors } from "../util/Constants";
import EmbedBuilder from "../util/EmbedBuilder";
import Logger from "../util/Logger";

export default new ClientEvent("shardReady", async function (id) {
	this.w.get("status")!.execute({
		embeds: [
			new EmbedBuilder(config.devLanguage)
				.setColor(Colors.green)
				.setTimestamp(new Date().toISOString())
				.setTitle("Shard Ready")
				.setDescription(`Shard #${id} is ready.`)
				.setFooter(`Shard ${id + 1}/${this.shards.size}`)
				.toJSON()
		]
	});

	Logger.info("General", `Shard #${id} is ready.`);
});
