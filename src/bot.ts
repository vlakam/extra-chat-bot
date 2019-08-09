import Telegraf, {Context, ContextMessageUpdate} from 'telegraf';
import fetch from 'node-fetch';
import ExtraModel from './models/extra.model';
import * as tt from 'telegram-typings';

const IS_FILE_REGEXP = /^###.+###:(.*)/;
const SPECIAL_FILE = /^###file_id!(.*)###/;

const bot = new Telegraf('', {
    telegram: {
        // @ts-ignore
        apiRoot: 'http://51.15.86.205:8012'
    }
});

bot.use((ctx:ContextMessageUpdate, next: Function) => {
    const start = new Date();
    return next().then(() => {
        const ms = (new Date()).getTime() - start.getTime();
        console.log(`${ctx.message.text} ${ctx.message.chat.id} response time ${ms}ms`)
    })
});

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
        // TODO: uncomment
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
                        await ctx.telegram.sendPhoto(id, fileId[1], {reply_to_message_id: messageToReply});
                    else if (method === 'video')
                        await ctx.telegram.sendVideo(id, fileId[1], {reply_to_message_id: messageToReply});
                    else if (method === 'voice')
                        await ctx.telegram.sendVoice(id, fileId[1], {reply_to_message_id: messageToReply});
                } else {
                    await ctx.telegram.sendDocument(id, fileId[1], {reply_to_message_id: messageToReply});
                }
            } else {
                await ctx.telegram.sendMessage(id, extra.code, {reply_to_message_id: messageToReply, parse_mode: "Markdown"})
            }
        } catch (e) {
            console.error(`Failed to send extra on ${hashtag}. Err: ${e}`);
            ctx.reply('Check logs.');
        }
    }
});

const snapCooldown = {};

bot.command('snap', adminMiddleware, async (ctx: ContextMessageUpdate) => {
    const { id:chatId } = ctx.chat;
    const { id:userId } = ctx.message.from;
    const oldSnap = snapCooldown[chatId] || new Date(0);
    const minutesDifference = ((new Date().getTime() - oldSnap)/1000)/60;

    if (minutesDifference <= 180) {
        return ctx.reply(`You must wait another ${Math.round(180 - minutesDifference)} minutes to make a backup`);
    }

    try {
        // TODO: new backup format.
        let backup = {};
        let extras = await ExtraModel.find({
            chat: chatId
        });

        backup[chatId] = {
            hashes: {
                extra: extras.reduce((acc, val) => {
                    acc[val.hashtag] = val.code;
                    return acc;
                }, {})
            }
        };

        const buf = Buffer.from(JSON.stringify(backup));
        await ctx.telegram.sendDocument(userId, {source: buf}, {caption: `${chatId} - ${new Date().toISOString()}`});
        snapCooldown[chatId] = new Date();
    } catch (e) {
        console.error(`Failed to send backup. Err ${e}`);
    }
});

bot.hears(/^\/extra (.+)$/, adminMiddleware, async (ctx: ContextMessageUpdate) => {
    const op = ctx.match[1];
    const { id:chatId } = ctx.chat;

    if (op === 'list') {
        try {
            let extras = await ExtraModel.find({
                chat: chatId
            });

            return await ctx.reply(`List of custom commands:\n${extras.map((extra) => extra.hashtag).join('\n')}`);
        } catch (e) {
            console.error(`Failed to show list of extras. ${e}`);
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
            console.error(`Failed to delete extra. ${e}`);
        }
    } else if (op.startsWith('#')) {
        const hashtag = ctx.message.text.match(/(#[\w]+)/);
        const saveMessage:tt.Message = ctx.message.reply_to_message;
        if (!saveMessage) {
            return ctx.reply('Reply to message');
        }

        if (!hashtag) {
            return;
        }

        try {
            const oldExtra = await ExtraModel.findOne({
                hashtag,
                chat: chatId
            });

            if (oldExtra) {
                return;
            }
        } catch (e) { }

        try {
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

            await ExtraModel.create({hashtag, chat: chatId, code});
            await ctx.reply(`Saved ${response} as response to ${hashtag}`);
        } catch (e) {
            console.error(`Failed to add extra. ${e}`);
        }
    }
});

export default bot;
