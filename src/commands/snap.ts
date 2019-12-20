import Telegraf, {ContextMessageUpdate} from "telegraf";
import { ExtraModel } from "../models";
import adminMiddleware from "../middlewares/adminMiddleware";
import report from "../helpers/report";

const snapCooldown = {};

const setupSnapCommand = (bot: Telegraf<ContextMessageUpdate>) => {
    bot.hears(/^[!\/]snap$/, adminMiddleware, async (ctx: ContextMessageUpdate) => {
        const { id:chatId } = ctx.chat;
        const { id:userId } = ctx.message.from;
        const oldSnap = snapCooldown[chatId] || new Date(0);
        const minutesDifference = ((new Date().getTime() - oldSnap)/1000)/60;

        if (minutesDifference <= 180) {
            return ctx.reply(`You must wait another ${Math.round(180 - minutesDifference)} minutes to make a backup`);
        }

        try {
            // TODO: new backup format.
            let extras = await ExtraModel.find({
                chat: chatId
            });

            let backup = {
                [chatId]: {
                    hashes: {
                        extra: extras.reduce((acc, val) => {
                            acc[val.hashtag] = val.code;
                            return acc;
                        }, {})
                    }
                }
            };

            const buf = Buffer.from(JSON.stringify(backup));
            let name = ctx.chat.title || ctx.chat.username || ctx.chat.first_name || chatId;
            await ctx.telegram.sendDocument(userId, { source: buf, filename: `extras-${chatId}.json` }, {caption: `${name} - ${new Date().toISOString()}`});
            snapCooldown[chatId] = new Date();
        } catch (e) {
            report(e, 'snap');
        }
    });
};

export default setupSnapCommand;
