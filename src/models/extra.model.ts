import { Context, Extra } from 'telegraf';
import replicators from 'telegraf/core/replicators';
import * as TT from 'telegram-typings';
import mongoose, { Schema, Document } from 'mongoose';
import report from '../helpers/report';

export interface IExtra extends Document {
    hashtag: string;
    chat: string;
    ttl: number;
    kind: string;

    replica: object;
    type: string;
    description?: string;
    private: boolean;
    aliases: Array<string>;

    dump: () => string;
    toList: () => string;
    sendToChat: (ctx: Context, chatId?: number, isPrivate?: boolean) => Promise<TT.Message>;
    sendButton: (ctx: Context) => Promise<TT.Message>;
}

const ExtraSchema: Schema = new Schema({
    hashtag: { type: String, required: true },
    chat: { type: String, required: true },
    ttl: { type: Number, required: false, default: -1 },
    kind: { type: String, required: true, enum: ['Old', 'New'], default: 'New' },
    replica: { type: Object, required: true },
    type: { type: String, required: true },
    description: { type: String, required: false },
    private: { type: Boolean, required: true, default: false },
});

ExtraSchema.methods.dump = function (): string {
    return JSON.stringify({
        kind: 'New',
        type: this.type,
        replica: this.replica,
        description: this.description,
        private: this.private,
    });
};

ExtraSchema.methods.toList = function (): string {
    return `${this.hashtag}${this.description ? ` - ${this.description}` : ''}`;
};

ExtraSchema.methods.sendToChat = async function (
    ctx: Context,
    chatId?: number,
    isPrivate = false,
): Promise<TT.Message> {
    let id = chatId || ctx.message.chat.id;
    let messageToReply = ctx.message.message_id;
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.message_id) {
        messageToReply = ctx.message.reply_to_message.message_id;
    }

    const method = replicators.copyMethods[this.type];
    const newMessage = ((await ctx.telegram.callApi(method, {
        chat_id: id,
        ...this.replica,
        reply_to_message_id: !isPrivate ? messageToReply : null,
    })) as unknown) as TT.Message;

    return newMessage;
};

ExtraSchema.methods.sendButton = async function (ctx: Context): Promise<TT.Message> {
    return ctx.reply(
        'Я попробовал отправить экстру в личку. Если она не пришла или нужна копия - нажмите кнопку.',
        Extra.markup((m) => m.inlineKeyboard([[
            m.callbackButton(`Пришли копию ${this.hashtag}`, `private ${this._id}`)
        ]])),
    );
};

ExtraSchema.statics.create = async function (
    hashtag: string,
    description: string | null,
    chatId: number,
    saveMessage: TT.Message,
): Promise<string | null> {
    try {
        const oldExtra = await this.findOne({
            hashtag,
            chat: chatId,
        });

        const extraType = Object.keys(replicators.copyMethods).find((type) => saveMessage[type]);
        const extraReplica = replicators[extraType](saveMessage);
        if (oldExtra) {
            await this.deleteOne({ hashtag, chat: chatId });
        }

        await this.create({
            hashtag,
            chat: chatId,
            type: extraType,
            replica: extraReplica,
            description,
            private: false,
        });

        return extraType;
    } catch (e) {
        report(`Failed to add extra. ${e}`, 'extra');
    }

    return null;
};

ExtraSchema.index({ chat: 1, hashtag: 1 }, { unique: true });
export const ExtraModel = mongoose.model<IExtra>('Extra', ExtraSchema);
export const NewExtraModel = ExtraModel;
