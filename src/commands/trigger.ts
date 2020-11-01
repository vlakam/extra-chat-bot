import Telegraf, {Context} from "telegraf";
import {ExtraModel, INewExtra, NewExtraModel} from "../models";
import replicators from 'telegraf/core/replicators';
import report from "../helpers/report";



const handleNewExtras = async (ctx: Context, extra: INewExtra) => {
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
                    report(`${hashtag} is an old format. Chat ${id}`);
                    return ctx.reply('This extra requires migration');
                } else {
                    newMessage = handleNewExtras(ctx, new NewExtraModel(extra));
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
        }
    });
};

export default setupExtraTrigger;
