import Telegraf, {Context} from "telegraf";
import Markup from "telegraf/markup";
import {ExtraModel, INewExtra, IOldExtra, OldExtraModel, NewExtraModel} from "../models";
import replicators from 'telegraf/core/replicators';
import report from "../helpers/report";
import difflib from "difflib";


const handleNewExtras = async (extra: INewExtra, ctx: Context) => {
    const {id} = ctx.message.chat;
    let messageToReply = ctx.message.message_id;
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.message_id) {
        messageToReply = ctx.message.reply_to_message.message_id;
    }

    const method = replicators.copyMethods[extra.type];

    // @ts-ignore
    const newMessage = await ctx.telegram.callApi(method, {chat_id: id, ...extra.replica, reply_to_message_id: messageToReply});

    return newMessage;
}

const setupExtraTrigger = (bot: Telegraf<Context>) => {
    bot.hears(/^#([^\s]+)$/, async (ctx: Context) => {
        let [hashtag] = ctx.match;
        const {id} = ctx.message.chat;
        const {message_id: messageId} = ctx.message;

        hashtag = hashtag.toLowerCase();
        const extra = await ExtraModel.findOne({
            chat: id,
            hashtag: hashtag
        });

        if (extra) {
            try {
                let newMessage = null;
                if (extra.kind === 'Old') {
                    // newMessage = handleOldExtras(new OldExtraModel(extra), ctx);
                    report(`${hashtag} is an old format. Chat ${id}`);
                    return ctx.reply('This extra requires migration');
                } else {
                    newMessage = handleNewExtras(new NewExtraModel(extra), ctx);
                }

                if (extra.ttl !== -1) {
                    setTimeout(async () => {
                        try {
                            await ctx.telegram.deleteMessage(id, newMessage.message_id);
                            await ctx.telegram.deleteMessage(id, messageId);
                        } catch (e) {
                            report(`Can't delete message from ${hashtag} ${newMessage.message_id} ${messageId}`, 'trigger');
                        }
                        console.log(`TTL: ${hashtag} ${id}`);
                    }, extra.ttl * 1000);
                }
            } catch (e) {
                report(`Failed to send extra on ${hashtag}. Err: ${e}`);
            }
        } else {
            const extrasInChat = await ExtraModel.find({
                chat: id,
            });
            let hashtagsInChat = [];
            for (let extraItem of extrasInChat) {
                hashtagsInChat.push(extraItem.hashtag);
            }

            if (hashtagsInChat.length > 0) {
                const closeMatches = difflib.getCloseMatches(hashtag, hashtagsInChat);
                if (closeMatches.length > 0) {
                    const slicedSuggestions = closeMatches.slice(0, 4);
                    
                    let suggestions = []; // type - extra (json)
                    
                    for (let item of slicedSuggestions) {
                        for (let jsonItem of extrasInChat) {
                            if (jsonItem.hashtag === item) {
                                suggestions.push(jsonItem);
                                break;
                            }
                        }
                    }

                    let keyboard = [];
                    
                    for (let item of suggestions) {
                        let buttonName = item.hashtag;
                        if (item.description) {
                            buttonName = `${buttonName} - ${item.description.slice(0, 140)}`
                        }
                        keyboard.push(Markup.callbackButton(buttonName, `suggestion:${item.hashtag}`));
                    }
                    await ctx.telegram.sendMessage(id, `Unknown extra <code>${hashtag}</code>. Maybe you meant`, { parse_mode: "HTML", reply_markup: Markup.inlineKeyboard(keyboard, {columns: 1}) });
                }
            }
        } 
    });

    bot.action(/^suggestion:#?([^\s]+)$/, async (ctx: Context) => {
        let hashtag = `#${ctx.match[1]}`;
        const {id} = ctx.callbackQuery.message.chat;

        console.log(`suggestion ${hashtag}`);

        // Here we must reuse function from above. Need a small refactor.

        await ctx.answerCbQuery();
    });
};

export default setupExtraTrigger;
