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
                userId: ctx.from && ctx.from.id,
                durationMs: Date.now() - start,
            }));
            triggers.delete(ctx);
        }
    }
};
