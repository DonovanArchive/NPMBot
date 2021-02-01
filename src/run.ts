import config from "./config";
import NPMBot from "./main";
import "./util/MonkeyPatch";
import "./util/ReNice";

const c = new NPMBot(config.client.token, config.client.options);

c.connect();
