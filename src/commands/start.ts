import Telegraf, { Context, Extra } from 'telegraf';
import { BotCommand } from 'telegraf/typings/telegram-types';
import { ExtraModel } from '../models';
import { markTrigger } from '../middlewares/timerMiddleware';

export default (bot: Telegraf<Context>, commands: Array<BotCommand>) => {
    bot.command('start', async (ctx: Context) => {
        markTrigger(ctx, 'start');
        const startPayload = ctx.message.text.substring(7);

        if (!startPayload.length) return;

        const extra = await ExtraModel.findById(startPayload);
        if (extra) await extra.sendToChat(ctx, ctx.chat.id, true);
    });
};
