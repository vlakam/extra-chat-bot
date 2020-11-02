import Telegraf, {Context} from "telegraf";
import {ExtraModel} from "../models";
import report from "../helpers/report";

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
                if (extra.kind === 'Old') {
                    report(`${hashtag} is an old format. Chat ${id}`);
                    return ctx.reply('This extra requires migration');
                }

                let newMessage = await extra.sendToChat(ctx);
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
