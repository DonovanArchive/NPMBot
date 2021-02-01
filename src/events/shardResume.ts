import config from "../config";
import ClientEvent from "../util/ClientEvent";
import { Colors } from "../util/Constants";
import EmbedBuilder from "../util/EmbedBuilder";
import Logger from "../util/Logger";

export default new ClientEvent("shardResume", async function (id) {
	this.w.get("status")!.execute({
		embeds: [
			new EmbedBuilder(config.devLanguage)
				.setColor(Colors.gold)
				.setTimestamp(new Date().toISOString())
				.setTitle("Shard Resume")
				.setDescription(`Shard #${id} resumed.`)
				.setFooter(`Shard ${id + 1}/${this.shards.size}`)
				.toJSON()
		]
	});

	Logger.warn("General", `Shard #${id} resumed.`);
});
