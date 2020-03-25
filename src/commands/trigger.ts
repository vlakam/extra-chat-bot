import Telegraf, {ContextMessageUpdate} from "telegraf";
import {ExtraModel, INewExtra, IOldExtra, OldExtraModel, NewExtraModel} from "../models";
import replicators from 'telegraf/core/replicators';
import report from "../helpers/report";

const IS_FILE_REGEXP = /^###.+###:(.*)/;
const SPECIAL_FILE = /^###file_id!(.*)###/;

const handleOldExtras = async (extra: IOldExtra, ctx: ContextMessageUpdate) => {
    const {id} = ctx.message.chat;
    const fileId = extra.code.match(IS_FILE_REGEXP);
    const specialMethod = extra.code.match(SPECIAL_FILE);
    let messageToReply = ctx.message.message_id;
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.message_id) {
        messageToReply = ctx.message.reply_to_message.message_id;
    }

    let newMessage;
    if (fileId) {
        if (specialMethod) {
            const method = specialMethod[1];
            if (method === 'photo')
                newMessage = await ctx.telegram.sendPhoto(id, fileId[1], {reply_to_message_id: messageToReply});
            else if (method === 'video')
                newMessage = await ctx.telegram.sendVideo(id, fileId[1], {reply_to_message_id: messageToReply});
            else if (method === 'voice')
                newMessage = await ctx.telegram.sendVoice(id, fileId[1], {reply_to_message_id: messageToReply});
        } else {
            newMessage = await ctx.telegram.sendDocument(id, fileId[1], {reply_to_message_id: messageToReply});
        }
    } else {
        newMessage = await ctx.telegram.sendMessage(id, extra.code, {
            reply_to_message_id: messageToReply,
            parse_mode: "Markdown"
        })
    }

    return newMessage;
};

const handleNewExtras = async (extra: INewExtra, ctx: ContextMessageUpdate) => {
    const {id} = ctx.message.chat;
    let messageToReply = ctx.message.message_id;
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.message_id) {
        messageToReply = ctx.message.reply_to_message.message_id;
    }

    const method = replicators.copyMethods[extra.type];

    // @ts-ignore
    const newMessage = await ctx.telegram.callApi(method, {chat_id: id, ...extra.replica});

    return newMessage;
}

const setupExtraTrigger = (bot: Telegraf<ContextMessageUpdate>) => {
    bot.hears(/^#([^\s]+)$/, async (ctx: ContextMessageUpdate) => {
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
                    newMessage = handleOldExtras(new OldExtraModel(extra), ctx);
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
        }
    });
};

export default setupExtraTrigger;
