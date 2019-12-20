import Telegraf, {ContextMessageUpdate} from "telegraf";
import { ExtraModel } from "../models";
import fetch from "node-fetch";
import adminMiddleware from "../middlewares/adminMiddleware";
import report from "../helpers/report";

export default (bot: Telegraf<ContextMessageUpdate>) => {
    bot.command('import', adminMiddleware, async (ctx: ContextMessageUpdate) => {
        if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
            return ctx.reply('Reply to message with file');
        }

        const { file_id } = ctx.message.reply_to_message.document;
        const { id } = ctx.message.chat;
        const url = await ctx.telegram.getFileLink(file_id);

        try {
            const response = await fetch(url);
            const backup = await response.json();
            const chats = Object.keys(backup);

            if (!chats || chats.length != 1) {
                throw new Error('Invalid chats in config.');
            }

            const [chatId] = chats;
            if (chatId !== id.toString()) {
                return ctx.reply('This backup is not from this chat.');
            }

            const { hashes } = backup[chatId];
            const { extra } = hashes;
            let fails = 0;
            for (let hashtag in extra) {
                const extraCode = extra[hashtag];
                console.log(`${hashtag} - ${extraCode}`);
                try {
                    await ExtraModel.deleteOne({ hashtag, chat: id });

                    await ExtraModel.create({
                        hashtag,
                        chat: id,
                        code: extraCode
                    });
                } catch (mongoErr) {
                    fails++;
                    console.error(mongoErr);
                }
            }

            ctx.reply(`Successfully imported extras: ${Object.keys(extra).length - fails}. Fails: ${fails}`);
        } catch (e) {
            report(e, 'import');
        }
    });
}
