import Telegraf, {ContextMessageUpdate} from "telegraf";
import adminMiddleware from "../middlewares/adminMiddleware";
import report from "../helpers/report";
import * as tt from 'telegram-typings';
import { ExtraModel } from "../models";

const setupExtraCommand = (bot: Telegraf<ContextMessageUpdate>) => {
    bot.hears(/^[!\/]extra (.+)$/, adminMiddleware, async (ctx: ContextMessageUpdate) => {
        const op = ctx.match[1];
        const { id:chatId } = ctx.chat;

        if (op === 'list') {
            try {
                let extras = await ExtraModel.find({
                    chat: chatId
                });

                return await ctx.reply(`List of custom commands:\n${extras.map((extra) => extra.hashtag).join('\n')}`);
            } catch (e) {
                report(`Failed to show list of extras. ${e}`, 'extra');
            }
        } else if (op.startsWith('del')) {
            try {
                const extra = ctx.message.text.match(/(#[\w]+)/);
                if (!extra) {
                    return await ctx.reply('Invalid extra to delete');
                }

                await ExtraModel.deleteOne({
                    chat: chatId,
                    hashtag: extra[1]
                });

                return await ctx.reply(`${extra[1]} is deleted`);
            } catch (e) {
                report(`Failed to delete extra. ${e}`, 'extra');
            }
        } else if (op.startsWith('#')) {
            const input = op.match(/(#[\w]+)/);
            const saveMessage:tt.Message = ctx.message.reply_to_message;
            if (!saveMessage) {
                return ctx.reply('Reply to message');
            }

            if (!input) {
                return;
            }

            let hashtag = input[1].toLowerCase();

            try {
                const oldExtra = await ExtraModel.findOne({
                    hashtag,
                    chat: chatId
                });

                let code = '';
                let response = '';

                if (saveMessage.document) {
                    const { file_id:fileId } = saveMessage.document;
                    code = `###file_id###:${fileId}`;
                    response = 'document';
                } else if (saveMessage.voice) {
                    const { file_id:fileId } = saveMessage.voice;
                    code = `###file_id!voice###:${fileId}`;
                    response = 'voice';
                } else if (saveMessage.photo && saveMessage.photo.length) {
                    const { file_id:fileId } = saveMessage.photo[saveMessage.photo.length - 1];
                    code = `###file_id!photo###:${fileId}`;
                    response = 'photo';
                } else if (saveMessage.video) {
                    const { file_id:fileId } = saveMessage.video;
                    code = `###file_id!video###:${fileId}`;
                    response = 'video';
                } else {
                    code = saveMessage.text;
                    response = 'text';
                }

                if (oldExtra) {
                    await ExtraModel.deleteOne({ hashtag, chat: chatId });
                }
                await ExtraModel.create({hashtag, chat: chatId, code});
                await ctx.reply(`Saved ${response} as response to ${hashtag}`);
            } catch (e) {
                report(`Failed to add extra. ${e}`, 'extra');
            }
        }
    });
};

export default setupExtraCommand;

