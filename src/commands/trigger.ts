import Telegraf, { Context, Markup } from 'telegraf';
import { ExtraModel } from '../models';
import report from '../helpers/report';
import { getClosestMatches } from '../helpers/diceCoefficient';

const setupExtraTrigger = (bot: Telegraf<Context>) => {
    bot.hears(/^#([^\s]+)$/, async (ctx: Context) => {
        let [hashtag] = ctx.match;
        const { id, type: chatType } = ctx.message.chat;

        hashtag = hashtag.toLowerCase();
        const extra = await ExtraModel.findOne({
            chat: id,
            hashtag: hashtag,
        });

        if (extra) {
            try {
                await extra.process(ctx);
            } catch (e) {
                report(`Failed to send extra on ${hashtag}. Err: ${e}`);
            }
        } else {
            //todo: caching
            const extrasInChat = await ExtraModel.find({ chat: id }, { hashtag: 1, description: 1 });
            const suggestions = getClosestMatches(hashtag, extrasInChat, (extra) => extra.hashtag);
            if (suggestions.length === 0) return;
            console.log(suggestions);
            let keyboard = suggestions.map(({ value }) => {
                let name = value.hashtag;
                if (value.description) {
                    name = `${name} - ${value.description}`;
                }

                return Markup.callbackButton(name, `suggestion:${value.hashtag}`);
            });

            return ctx.reply(`Unknown extra <code>${hashtag}</code>. Maybe you meant`, {
                parse_mode: 'HTML',
                reply_markup: Markup.inlineKeyboard(keyboard, { columns: 1 }),
            });
        }
    });

    bot.action(/^suggestion:#?([^\s]+)$/, async (ctx: Context) => {
        let hashtag = `#${ctx.match[1]}`;
        console.log(`suggestion ${hashtag}`);
        
        const { id, type: chatType } = ctx.callbackQuery.message.chat;
        const extra = await ExtraModel.findOne({
            chat: id,
            hashtag: hashtag,
        });

        if (!extra) return ctx.answerCbQuery('Ты че делаешь?');
        await extra.process(ctx);
        await ctx.answerCbQuery();

        return ctx.telegram.deleteMessage(id, ctx.callbackQuery.message.message_id);
    });
};

export default setupExtraTrigger;
