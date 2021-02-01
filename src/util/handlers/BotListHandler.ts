/// <reference path="../@types/botlist.d.ts" />
import BotList from "botlist";
import config from "../../config";

const obj = {
	...config.client.botLists
};

// have to do this one separately
delete (obj as any)["top.gg"];

const BLClient = new BotList.Client(config.client.id, {
	tokens: Object.keys(obj).map(v => ({
		[v]: (config.client.botLists as any)[v].token
	})).reduce((a, b) => ({ ...a, ...b }), {}),
	interval: 3e5,
	verbose: true
});

export default BLClient;
