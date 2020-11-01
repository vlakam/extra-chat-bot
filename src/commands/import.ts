import Telegraf, { Context } from 'telegraf';
import adminMiddleware from '../middlewares/adminMiddleware';
import { BotCommand } from 'telegraf/typings/telegram-types';
import fetch from 'node-fetch';
import { NewExtraModel, ExtraModel } from '../models';

const { MASTER_ID } = process.env;

export default (bot: Telegraf<Context>, commands: Array<BotCommand>) => {
    bot.command('import', adminMiddleware, async (ctx: Context) => {
        if (!ctx.message.reply_to_message.document) {
            return ctx.reply('Where is the backup?');
        }

        try {
            const document = ctx.message.reply_to_message.document;
            const downloadLink = await ctx.telegram.getFileLink(document.file_id);
            const response = await fetch(downloadLink);
            const contents = await response.json();
            for (const chatId of Object.keys(contents)) {
                if (parseInt(chatId) !== ctx.chat.id && ctx.chat.id !== parseInt(MASTER_ID)) {
                    await ctx.reply(`This backup of other chat`);
                }
                const extras: Record<string, string> = contents[chatId];

                for (const [hashtag, data] of Object.entries(extras)) {
                    const oldExtra = await ExtraModel.findOne({
                        hashtag,
                        chat: chatId,
                    });

                    if (oldExtra) {
                        console.log(`${hashtag} deleted before backup replace`);
                        await ExtraModel.deleteOne({ hashtag, chat: chatId });
                    }

                    const parsedData = JSON.parse(data);
                    if (parsedData.kind === 'New') {
                        await new NewExtraModel({
                            chat: chatId,
                            hashtag,
                            type: parsedData.type,
                            replica: parsedData.replica,
                            description: parsedData.description || null,
                        }).save();
                    }
                }
                await ctx.reply(`Chat: ${chatId}. Restored extras: ${Object.entries(extras).length}`);
            }
        } catch (e) {
            console.error(e);
            return ctx.reply('Shit happened');
        }
    });

    commands.push({ command: 'import', description: 'Import an chat backup' });
};
