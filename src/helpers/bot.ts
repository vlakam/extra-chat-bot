import Telegraf from 'telegraf';
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
        await bot.launch();
        console.info('Successfully connected to telegram');
        report(`Bot started at ${(new Date()).toISOString()}`);
    } catch (e) {
        console.error(`Failed to init telegram: ${e}`);
        return process.exit(1);
    }
};

export default bot;
