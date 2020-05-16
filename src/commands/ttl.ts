import Telegraf, {Context} from "telegraf";
import {ExtraModel} from "../models";
import report from "../helpers/report";

const setupTTLCommand = (bot: Telegraf<Context>) => {
    bot.hears(/[!\/]ttl (#.+) ([1-9][0-9]{0,10})/, async (ctx: Context) => {
        const { id:chatId } = ctx.chat;
        let [ _, hashtag, time ] = ctx.match;

        try {
            let parsedTime = parseInt(time);
            hashtag = hashtag.toLowerCase();
            const extra = await ExtraModel.findOne({
                chat: chatId,
                hashtag: hashtag
            });

            if (!extra) {
                return;
            }

            extra.ttl = parsedTime;
            await extra.save();
            await ctx.reply(`Set ${hashtag} TTL to ${parsedTime} seconds`);
        } catch (e) {
            report(`Could not set TTL. ${e}`, 'ttl');
        }
    })
};

export default setupTTLCommand;
