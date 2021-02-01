import config from "../config";
import ClientEvent from "../util/ClientEvent";
import { Colors } from "../util/Constants";
import EmbedBuilder from "../util/EmbedBuilder";
import Logger from "../util/Logger";

export default new ClientEvent("shardDisconnect", async function (err, id) {
	this.w.get("status")!.execute({
		embeds: [
			new EmbedBuilder(config.devLanguage)
				.setColor(Colors.red)
				.setTimestamp(new Date().toISOString())
				.setTitle("Shard Disconnect")
				.setDescription(`Shard #${id} disconnected.`)
				.setFooter(`Shard ${id + 1}/${this.shards.size}`)
				.toJSON()
		]
	});

	Logger.error("General", `Shard #${id} disconnected, ${err.name}: ${err.message}`);
});
