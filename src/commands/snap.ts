import Telegraf, {Context} from "telegraf";
import { ExtraModel, IExtra } from "../models";
import adminMiddleware from "../middlewares/adminMiddleware";
import report from "../helpers/report";
import { BotCommand } from "telegraf/typings/telegram-types";

const snapCooldown = {};

const setupSnapCommand = (bot: Telegraf<Context>, commands: Array<BotCommand>) => {
    bot.hears(/^[!\/]snap$/, adminMiddleware, async (ctx: Context) => {
        const { id:chatId } = ctx.chat;
        const { id:userId } = ctx.message.from;
        const oldSnap = snapCooldown[chatId] || new Date(0);
        const minutesDifference = ((new Date().getTime() - oldSnap)/1000)/60;

        if (minutesDifference <= 180) {
            return ctx.reply(`You must wait another ${Math.round(180 - minutesDifference)} minutes to make a backup`);
        }

        try {
            let extras:Array<IExtra> = await ExtraModel.find({
                chat: chatId
            });

            let backup = {
                [chatId]: extras.reduce((acc, val) => {
                    acc[val.hashtag] = val.dump();
                    return acc;
                }, {})
            };

            const buf = Buffer.from(JSON.stringify(backup, null, 2));
            let name = ctx.chat.title || ctx.chat.username || ctx.chat.first_name || chatId;
            await ctx.telegram.sendDocument(userId, { source: buf, filename: `extras-${chatId}.json` }, {caption: `${name} - ${new Date().toISOString()}`});
            snapCooldown[chatId] = new Date();
        } catch (e) {
            report(`Failed to send snap. ${e}`, 'snap');
        }
    });

    commands.push({ command: 'snap', description: 'Export a chat backup' });
};

export default setupSnapCommand;
