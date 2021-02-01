import ClientEvent from "../util/ClientEvent";
import Logger from "../util/Logger";

export default new ClientEvent("debug", async function (info, id) {
	Logger.debug(`Shard #${id}`, info);
});
