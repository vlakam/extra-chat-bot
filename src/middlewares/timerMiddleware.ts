import {Context} from "telegraf";

export default async (ctx: Context, next: Function) => {
    const start = new Date();
    await next();
    const ms = (new Date()).getTime() - start.getTime();
    const title = ctx.chat ? ctx.chat.username || ctx.chat.title || ctx.chat.first_name || ctx.chat.id || "" : "";
    const id = ctx.chat ? ctx.chat.id : "";
    console.log(`${ctx.message ? ctx.message.text : ctx.updateType} ${title} ${id} response time ${ms}ms`);
};
