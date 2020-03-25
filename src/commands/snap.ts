import Telegraf, {ContextMessageUpdate} from "telegraf";
import { ExtraModel, OldExtraModel, NewExtraModel } from "../models";
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
            let extras = await ExtraModel.find({
                chat: chatId
            });

            let backup = {
                [chatId]: extras.reduce((acc, val) => {
                    let toSave = {};
                    if (val.kind === 'Old') {
                        let oldExtra = new OldExtraModel(val);
                        toSave = {
                            kind: 'Old',
                            code: oldExtra.code
                        }
                    } else {
                        let newExtra = new NewExtraModel(val);
                        toSave = {
                            kind: 'New',
                            type: newExtra.type,
                            replica: newExtra.replica
                        }
                    }

                    acc[val.hashtag] = JSON.stringify(toSave);
                    return acc;
                }, {})
            };

            const buf = Buffer.from(JSON.stringify(backup));
            let name = ctx.chat.title || ctx.chat.username || ctx.chat.first_name || chatId;
            await ctx.telegram.sendDocument(userId, { source: buf, filename: `extras-${chatId}.json` }, {caption: `${name} - ${new Date().toISOString()}`});
            snapCooldown[chatId] = new Date();
        } catch (e) {
            report(`Failed to send snap. ${e}`, 'snap');
        }
    });
};

export default setupSnapCommand;
