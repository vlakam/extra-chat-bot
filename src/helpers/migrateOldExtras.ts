import { createExtra } from "../commands/extra";
import { Telegraf } from "telegraf";
import mongoose from "mongoose";

const {BOT_TOKEN, MASTER_ID, TELEGRAM_API} = process.env;

const IS_FILE_REGEXP = /^###.+###:(.*)/;
const SPECIAL_FILE = /^###file_id!(.*)###/;

export const migrateOldExtras = async () => {
    const telegram = new Telegraf(BOT_TOKEN, {
        username: "extra-bot",
        telegram: {
            // @ts-ignore
            apiRoot: TELEGRAM_API || 'https://api.telegram.org'
        }
    }).telegram;
    const connection = mongoose.connection;
    if (connection.readyState !== 1) return;
    //untested shit
    const extraCollection = connection.collection('extra');

    for await (const extra of extraCollection.find({kind: 'Old'})) {
        console.log(`Migrating ${extra.hashtag} of chat ${extra.chat}`);
        try {
            const fileId = extra.code.match(IS_FILE_REGEXP);
            const specialMethod = extra.code.match(SPECIAL_FILE);
            
            let newMessage;
            if (fileId) {
                if (specialMethod) {
                    const method = specialMethod[1];
                    if (method === 'photo')
                        newMessage = await telegram.sendPhoto(MASTER_ID, fileId[1]);
                    else if (method === 'video')
                        newMessage = await telegram.sendVideo(MASTER_ID, fileId[1]);
                    else if (method === 'voice')
                        newMessage = await telegram.sendVoice(MASTER_ID, fileId[1]);
                } else {
                    newMessage = await telegram.sendDocument(MASTER_ID, fileId[1]);
                }
            } else {
                newMessage = await telegram.sendMessage(MASTER_ID, extra.code, {
                    parse_mode: "Markdown"
                })
            }

            await createExtra(extra.hashtag, null, parseInt(extra.chat), newMessage);
            console.log(`Migrated ${extra.hashtag} of chat ${extra.chat}`);
            await telegram.deleteMessage(MASTER_ID, newMessage.message_id);
        } catch (e) {
            console.error(`Cannot migrate ${extra.hashtag} of chat ${extra.chat}. Error: ${e.toString()}`);
        }
    }
}