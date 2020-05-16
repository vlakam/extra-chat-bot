import Telegraf, { Context } from "telegraf";
import setupImport from './import';
import setupExtraCommand from "./extra";
import setupSnapCommand from "./snap";
import setupExtraTrigger from "./trigger";
import setupTTLCommand from "./ttl";

const setupCommands = (bot: Telegraf<Context>) => {
    setupImport(bot);
    setupExtraCommand(bot);
    setupSnapCommand(bot);
    setupExtraTrigger(bot);
    setupTTLCommand(bot);
};

export default setupCommands;
