import Telegraf, { Context } from "telegraf";
import adminMiddleware from "../middlewares/adminMiddleware";
import report from "../helpers/report";
import * as tt from 'telegram-typings';
import { ExtraModel, NewExtraModel, IExtra } from "../models";
import replicators from 'telegraf/core/replicators';

const setupExtraCommand = (bot: Telegraf<Context>) => {
    bot.hears(/^[!\/]extra (.+)$/, adminMiddleware, async (ctx: Context) => {
        const op = ctx.match[1];
        const { id: chatId } = ctx.chat;

        if (op === 'list') {
            try {
                let extras: Array<IExtra> = await ExtraModel.find({
                    chat: chatId
                });

                return await ctx.reply(`List of custom commands:\n${extras.map((extra) => extra.toList()).join('\n')}`);
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
            const input = op.match(/(#[\w]+)(\s.+)?/);
            const saveMessage: tt.Message = ctx.message.reply_to_message;
            if (!saveMessage) {
                return ctx.reply('Reply to message');
            }

            if (!input) {
                return;
            }

            let hashtag = input[1].toLowerCase();
            let description = input[2] ? input[2].trim() : null;

            try {
                const oldExtra = await ExtraModel.findOne({
                    hashtag,
                    chat: chatId
                });

                const extraType = Object.keys(replicators.copyMethods).find((type) => saveMessage[type]);
                const extraReplica = replicators[extraType](saveMessage);
                if (oldExtra) {
                    await ExtraModel.deleteOne({ hashtag, chat: chatId });
                }

                await NewExtraModel.create({
                    hashtag,
                    chat: chatId,
                    type: extraType,
                    replica: extraReplica,
                    description,
                    private: false,
                });
                await ctx.reply(`Saved ${extraType} as response to ${hashtag}. Description: ${ description || '' }`);
            } catch (e) {
                report(`Failed to add extra. ${e}`, 'extra');
            }
        }
    });
};

export default setupExtraCommand;

