import {Context} from "telegraf";
import {LruCache} from "../helpers/lruCache";
import * as tt from 'telegram-typings';

const adminGroupCache = new LruCache<tt.ChatMember[]>();

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
