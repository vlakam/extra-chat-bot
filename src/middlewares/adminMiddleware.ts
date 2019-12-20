import {Context} from "telegraf";
import {TimedLruCache} from "../helpers/lruCache";
import * as tt from 'telegram-typings';

export const adminGroupCache = new TimedLruCache<tt.ChatMember[]>({ maxEntries: 20, timeToLive: 10});

export default async (ctx: Context, next: Function) => {
    if ((ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') && ctx.from) {
        const { id:chatId } = ctx.chat;

        let admins = adminGroupCache.get(chatId.toString());
        if (!admins) { // cache miss
            admins = await ctx.telegram.getChatAdministrators(chatId);
            adminGroupCache.put(chatId.toString(), admins);
        }

        if (admins.some((admin) => admin.user.id === ctx.from.id)) {
            return next();
        }
    } else {
        return next();
    }
};
