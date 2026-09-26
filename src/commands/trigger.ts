import Telegraf, { Context } from 'telegraf';
import { ExtraModel } from '../models';
import report from '../helpers/report';

const setupExtraTrigger = (bot: Telegraf<Context>) => {
    bot.hears(/^#([^\s]+)$/, async (ctx: Context) => {
        let [hashtag] = ctx.match;
        const { id, type: chatType } = ctx.message.chat;

        hashtag = hashtag.toLowerCase();
        const extra = await ExtraModel.findOne({
            chat: id,
            hashtag: hashtag,
        });

        if (extra) {
            try {
                if (extra.kind === 'Old') {
                    report(`${hashtag} is an old format. Chat ${id}`);
                    return ctx.reply('This extra requires migration');
                }

                if (extra.private && chatType !== 'private') await extra.sendButton(ctx);
                else await extra.sendToChat(ctx);
            } catch (e) {
                report(`Failed to send extra on ${hashtag}. Err: ${e}`);
            }
        }
    });

    
};

export default setupExtraTrigger;
