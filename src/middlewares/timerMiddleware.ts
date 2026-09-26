import {Context} from "telegraf";

const triggers = new WeakMap<Context, string>();

export const markTrigger = (ctx: Context, action: string) => {
    triggers.set(ctx, action);
};

export default async (ctx: Context, next: Function) => {
    const start = Date.now();
    try {
        await next();
    } finally {
        const action = triggers.get(ctx);
        if (action) {
            console.log(JSON.stringify({
                time: new Date().toISOString(),
                action,
                chatId: ctx.chat && ctx.chat.id,
                chatName: ctx.chat && (ctx.chat.title ||
                    [ctx.chat.first_name, ctx.chat.last_name].filter(Boolean).join(' ') ||
                    ctx.chat.username),
                chatUsername: ctx.chat && ctx.chat.username,
                userId: ctx.from && ctx.from.id,
                userName: ctx.from && [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' '),
                userUsername: ctx.from && ctx.from.username,
                durationMs: Date.now() - start,
            }));
            triggers.delete(ctx);
        }
    }
};
