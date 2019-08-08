import Telegraf, {Context, ContextMessageUpdate} from 'telegraf';
import fetch from 'node-fetch';
import ExtraModel from './models/extra.model'

const IS_FILE_REGEXP = /^###.+###:(.*)/
const SPECIAL_FILE = /^###file_id!(.*)###/

const bot = new Telegraf('', {
    telegram: {
        // @ts-ignore
        apiRoot: 'http://51.15.86.205:8012'
    }
});

bot.use((ctx, next) => {
    const start = new Date();
    return next().then(() => {
        const ms = (new Date()).getTime() - start.getTime();
        console.log(`response time ${ms}ms`)
    })
})

export const adminMiddleware = async (ctx: Context, next: Function) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        let member = await bot.getChatMember(ctx.chat.id, ctx.message.from.id);
        if (['administrator', 'creator'].includes(member.status)) {
            return next();
        }
    } else {
        return next();
    }
};

export const launch = async (token: string) => {
    bot.token = token;

    try {
        await bot.launch();
        console.info('Successfully connected to telegram');
    } catch (e) {
        console.error(`Failed to init telegram: ${e}`);
        return process.exit(1);
    }
};

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
        // if (chatId !== id.toString()) {
        //     return ctx.reply('This backup is not from this chat.');
        // }

        const { hashes } = backup[chatId];
        const { extra } = hashes;
        let fails = 0;
        for (let hashtag in extra) {
            const extraCode = extra[hashtag];
            console.log(`${hashtag} - ${extraCode}`);
            try {
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
        console.log(`Errored on import: ${e}`);
        ctx.reply('Check logs.');
    }
});

bot.hears(/^#([^\s]+)$/, async (ctx: ContextMessageUpdate) => {
    const [ hashtag ] = ctx.match;
    const { id } = ctx.message.chat;
    const extra = await ExtraModel.findOne({
        chat: id,
        hashtag: hashtag
    });

    if (extra) {
        try {
            const fileId = extra.code.match(IS_FILE_REGEXP);
            const specialMethod = extra.code.match(SPECIAL_FILE);
            let messageToReply = ctx.message.message_id;
            if (ctx.message.reply_to_message && ctx.message.reply_to_message.message_id) {
                messageToReply = ctx.message.reply_to_message.message_id;
            }

            if (fileId) {
                if (specialMethod) {
                    const method = specialMethod[1];
                    if (method === 'photo')
                        ctx.telegram.sendPhoto(id, fileId[1], {reply_to_message_id: messageToReply});
                    else if (method === 'video')
                        ctx.telegram.sendVideo(id, fileId[1], {reply_to_message_id: messageToReply});
                    else if (method === 'voice')
                        ctx.telegram.sendVoice(id, fileId[1], {reply_to_message_id: messageToReply});
                } else {
                    ctx.telegram.sendDocument(id, fileId[1], {reply_to_message_id: messageToReply});
                }
            } else {
                ctx.telegram.sendMessage(id, extra.code, {reply_to_message_id: messageToReply, parse_mode: "Markdown"})
            }
        } catch (e) {
            console.error(`Failed to send extra on ${hashtag}. Err: ${e}`);
            ctx.reply('Check logs.');
        }
    }
});

export default bot;
