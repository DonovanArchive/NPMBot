import ClientEvent from "../util/ClientEvent";
import Logger from "../util/Logger";

export default new ClientEvent("warn", async function (info, id) {
	if (info.indexOf("Unhandled MESSAGE_CREATE type") !== -1) return;
	Logger.warn(`Shard #${id}`, info);
});
