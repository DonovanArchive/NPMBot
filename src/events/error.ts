import ClientEvent from "../util/ClientEvent";
import Utility from "../util/Functions/Utility";
import Logger from "../util/Logger";

export default new ClientEvent("error", async function (info, id) {
	await Utility.logError(this, info, "event", {});
	Logger.error(`Shard #${id}`, info);
});
