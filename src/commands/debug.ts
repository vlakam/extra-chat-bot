import Telegraf, { Context } from 'telegraf';
import { ExtraModel } from '../models';
import { markTrigger } from '../middlewares/timerMiddleware';

export default (bot: Telegraf<Context>) => {
    bot.command('debug', async (ctx: Context) => {
        const masterId = Number(process.env.MASTER_ID);
        if (!masterId || !ctx.from || ctx.from.id !== masterId || ctx.chat.type !== 'private') return;

        markTrigger(ctx, 'debug');
        const args = ctx.message.text.trim().match(/^\S+\s+(-?\d+)\s+(#[^\s]+)$/);
        if (!args || !Number.isSafeInteger(Number(args[1]))) {
            return ctx.reply('Usage: /debug <chat_id> <#hashtag>');
        }

        try {
            const extra = await ExtraModel.findOne({
                chat: String(Number(args[1])),
                hashtag: args[2].toLowerCase(),
            });
            if (!extra) return ctx.reply('No extra found for that chat and hashtag.');
            if (extra.kind === 'Old') return ctx.reply('This extra requires migration');
            await extra.sendToChat(ctx, masterId, true);
        } catch (error) {
            console.error('Failed to send debug extra', error);
            await ctx.reply('Could not send this extra.');
        }
    });
};
