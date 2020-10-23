import Telegraf from 'telegraf';
import { migrateOldExtras } from './migrateOldExtras';
import report from "./report";

const bot = new Telegraf('', {
    telegram: {
        // @ts-ignore
        apiRoot: process.env.TELEGRAM_API || 'https://api.telegram.org'
    }
});

export const launch = async (token: string) => {
    bot.token = token;

    try {
        await migrateOldExtras();
        await bot.launch();
        report(`Bot started`);
    } catch (e) {
        console.error(`Failed to init telegram: ${e}`);
        return process.exit(1);
    }
};

export default bot;
