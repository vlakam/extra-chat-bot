import mongoose, { Schema, Document } from 'mongoose';

export interface IExtra extends Document {
    hashtag: string;
    code: string;
    chat: string;
    ttl: number
}

const ExtraSchema: Schema = new Schema({
    hashtag: { type: String, required: true },
    code: { type: String, required: true },
    chat: { type: String, required: true },
    ttl: { type: Number, required: false, default: -1 }
});

ExtraSchema.index({ chat: 1, hashtag: 1 }, { unique: true });

export const ExtraModel = mongoose.model<IExtra>('Extra', ExtraSchema);

