import Eris from "eris";
import config from "../config";
import ClientEvent from "../util/ClientEvent";
import { Colors } from "../util/Constants";
import db from "../util/Database";
import EmbedBuilder from "../util/EmbedBuilder";
import Redis from "../util/Redis";

export default new ClientEvent("messageUpdate", async function (message, oldMessage) {
	if (!this || !message || !message.author || !oldMessage || !(message.content && oldMessage.content) || ![Eris.Constants.ChannelTypes.GUILD_NEWS, Eris.Constants.ChannelTypes.GUILD_STORE, Eris.Constants.ChannelTypes.GUILD_TEXT].includes(message.channel.type as any) || message.content === oldMessage.content || (config.beta && !config.developers.includes(message.author.id))) return;
	// might do some different handling later, for now we just toss it out
	if (message.type !== Eris.Constants.MessageTypes.DEFAULT) return;

	this.emit("messageCreate", message, true);
});
