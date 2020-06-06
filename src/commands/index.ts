import Telegraf, { Context } from "telegraf";
import setupImport from './import';
import setupExtraCommand from "./extra";
import setupSnapCommand from "./snap";
import setupExtraTrigger from "./trigger";
import setupTTLCommand from "./ttl";
import { BotCommand } from "telegraf/typings/telegram-types";

const setupCommands = (bot: Telegraf<Context>): Array<BotCommand> => {
    let commands: Array<BotCommand> = [];
    setupImport(bot, commands);
    setupExtraCommand(bot);
    setupSnapCommand(bot, commands);
    setupExtraTrigger(bot);
    setupTTLCommand(bot);

    return commands;
};

export default setupCommands;
