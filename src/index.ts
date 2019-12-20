require('dotenv').config({ path: '.env' });

import bot, { launch } from "./helpers/bot";
import setupCommands from './commands';
import timerMiddleware from "./middlewares/timerMiddleware";
import errorCatcherMiddleware from "./middlewares/errorCatcherMiddleware";

const { BOT_TOKEN } = process.env;

bot.use(errorCatcherMiddleware);
bot.use(timerMiddleware);

setupCommands(bot);

launch(BOT_TOKEN);
