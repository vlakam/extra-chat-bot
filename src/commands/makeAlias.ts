import adminMiddleware from '../middlewares/adminMiddleware';
import Telegraf, { Context } from 'telegraf';
import { BotCommand } from 'telegraf/typings/telegram-types';
import { ExtraModel } from '../models';

export default (bot: Telegraf<Context>, commands: Array<BotCommand>) => {
    bot.hears(/^[!\/]makeAlias (\#.+) (\#.+)$/, adminMiddleware, async (ctx: Context) => {
        const [,,hashtag,alias] = ctx.match;
        const {id} = ctx.message.chat;

        const extra = await ExtraModel.findOne({ chatId: id, hashtag });
        if (!extra) return ctx.reply(`There is no extra with ${hashtag} hashtag`);

        extra.aliases.push(alias);
        await extra.save();

        return ctx.reply(`OK. ${alias} will trigger ${extra}`);
    });

    commands.push({ command: 'makeAlias', description: 'Make an alias for a extra' });
};
