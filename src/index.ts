require('dotenv').config({ path: '.env' });

import bot, { launch } from "./helpers/bot";
import setupCommands from './commands';
import timerMiddleware from "./middlewares/timerMiddleware";
import errorCatcherMiddleware from "./middlewares/errorCatcherMiddleware";
import forgetMiddleware from "./middlewares/forgetMiddleware";


const { BOT_TOKEN } = process.env;

bot.use(errorCatcherMiddleware);
bot.use(timerMiddleware);
bot.use(forgetMiddleware);

setupCommands(bot);

launch(BOT_TOKEN);
