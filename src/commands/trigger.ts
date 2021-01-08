import Telegraf, { Context, Markup } from 'telegraf';
import { ExtraModel } from '../models';
import report from '../helpers/report';
import { getClosestMatches } from '../helpers/diceCoefficient';

const setupExtraTrigger = (bot: Telegraf<Context>) => {
    bot.hears(/^#([^\s]+)$/, async (ctx: Context) => {
        let [hashtag] = ctx.match;
        const { id, type: chatType } = ctx.message.chat;
        const { message_id: messageId } = ctx.message;

        hashtag = hashtag.toLowerCase();
        const extra = await ExtraModel.findOne({
            chat: id,
            hashtag: hashtag,
        });

        if (extra) {
            try {
                if (extra.kind === 'Old') {
                    report(`${hashtag} is an old format. Chat ${id}`);
                    return ctx.reply('This extra requires migration');
                }

                let newMessage;
                if (extra.private && chatType !== 'private') newMessage = await extra.sendButton(ctx);
                else newMessage = await extra.sendToChat(ctx);

                if (extra.ttl !== -1) {
                    setTimeout(async () => {
                        try {
                            await ctx.telegram.deleteMessage(id, newMessage.message_id);
                            await ctx.telegram.deleteMessage(id, messageId);
                        } catch (e) {
                            report(
                                `Can't delete message from ${hashtag} ${newMessage.message_id} ${messageId}`,
                                'trigger',
                            );
                        }
                        console.log(`TTL: ${hashtag} ${id}`);
                    }, extra.ttl * 1000);
                }
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
        // const {id} = ctx.callbackQuery.message.chat;

        console.log(`suggestion ${hashtag}`);

        // Here we must reuse function from above. Need a small refactor.

        // Extracting message keyboard. Maybe it's better to contribute to telegram-typings module..

        // Uncomment this line and import
        // const markup: InlineKeyboardMarkup | undefined = (ctx.callbackQuery.message as any).reply_markup;

        // To prevent flood/spam
        // 1. Send extra
        // 2. Iterate over markup.inline_keyboard with variable above
        // 3. Remove sent extra button and editReplyMarkup to current ctx.message
        // 4. ???
        // 5. Best UX for extra-bot ever. Profit!

        await ctx.answerCbQuery();
    });
};

export default setupExtraTrigger;
