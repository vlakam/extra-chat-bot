import mongoose, { Schema, Document } from 'mongoose';

export interface IExtra extends Document {
    hashtag: string;
    code: string;
    chat: string
}

const ExtraSchema: Schema = new Schema({
    hashtag: { type: String, required: true },
    code: { type: String, required: true },
    chat: { type: String, required: true }
});

ExtraSchema.index({ chat: 1, hashtag: 1 }, { unique: true });

export default mongoose.model<IExtra>('Extra', ExtraSchema);
