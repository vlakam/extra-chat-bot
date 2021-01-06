import Telegraf, { Context, Extra } from 'telegraf';
import { BotCommand } from 'telegraf/typings/telegram-types';
import { ExtraModel } from '../models';

export default (bot: Telegraf<Context>, commands: Array<BotCommand>) => {
    bot.command('start', async (ctx: Context) => {
        const startPayload = ctx.message.text.substring(7);

        if (!startPayload.length) return;

        const extra = await ExtraModel.findById(startPayload);
        if (extra) extra.sendToChat(ctx, ctx.chat.id, true);
    });
};
