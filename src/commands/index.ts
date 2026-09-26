import Telegraf, { Context } from "telegraf";
import setupImport from './import';
import setupExtraCommand from "./extra";
import setupSnapCommand from "./snap";
import setupExtraTrigger from "./trigger";
import setupPrivateCommand from './private';
import setupStartCommand from './start';
import { BotCommand } from "telegraf/typings/telegram-types";

const setupCommands = (bot: Telegraf<Context>): Array<BotCommand> => {
    let commands: Array<BotCommand> = [];
    setupImport(bot, commands);
    setupExtraCommand(bot);
    setupSnapCommand(bot, commands);
    setupExtraTrigger(bot);
    setupPrivateCommand(bot, commands);
    setupStartCommand(bot, commands);

    return commands;
};

export default setupCommands;
