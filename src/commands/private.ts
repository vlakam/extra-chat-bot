import adminMiddleware from '../middlewares/adminMiddleware';
import Telegraf, { Context } from 'telegraf';
import { BotCommand } from 'telegraf/typings/telegram-types';
import { ExtraModel } from '../models';

export default (bot: Telegraf<Context>, commands: Array<BotCommand>) => {
    bot.hears(/^[!\/](un)?private (\#.+)$/, adminMiddleware, async (ctx: Context) => {
        const [,action,hashtag] = ctx.match;
        const {id} = ctx.message.chat;

        const extra = await ExtraModel.findOne({ chatId: id, hashtag });
        if (!extra) return ctx.reply(`There is no extra with ${hashtag} hashtag`);

        let toPrivate = action !== 'un';
        extra.private = toPrivate;
        return ctx.reply(`OK. ${extra} is now ${ toPrivate ? 'private' : 'public' }`);
    });

    bot.action(/private (.+)/, async (ctx) => {
        const [_, extraId] = ctx.match;

        return ctx.answerCbQuery(null, null, { url: `t.me/${ctx.botInfo.username}?start=${extraId}`});
    })

    commands.push({ command: 'private', description: 'Private a extra' });
    commands.push({ command: 'unprivate', description: 'Public a extra' });
};
