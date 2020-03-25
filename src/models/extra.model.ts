import mongoose, { Schema, Document } from 'mongoose';

export interface IExtra extends Document {
    hashtag: string;
    chat: string;
    ttl: number;
    kind: string;
}

//Deprecated. Remove ASAP
export interface IOldExtra extends IExtra {
    code: string;
}

export interface INewExtra extends IExtra {
    replica: object;
    type: string;
}

const BaseExtraSchema: Schema = new Schema({
    hashtag: { type: String, required: true },
    chat: { type: String, required: true },
    ttl: { type: Number, required: false, default: -1 },
    kind: {type: String, required: true, enum: ['Old', 'New'], default: 'Old'}
}, {
    discriminatorKey: 'kind',
});

const OldExtraSchema: Schema = new Schema({
    code: { type: String, required: true }
}, {
    discriminatorKey: 'kind'
});

const NewExtraSchema: Schema = new Schema( {
    replica: { type: Object, required: true },
    type: { type: String, required: true }
}, {
    discriminatorKey: 'kind'
})

BaseExtraSchema.index({ chat: 1, hashtag: 1 }, { unique: true });
export const ExtraModel = mongoose.model<IExtra>('Extra', BaseExtraSchema);
export const OldExtraModel = ExtraModel.discriminator<IOldExtra>("OldExtra", OldExtraSchema, "Old");
export const NewExtraModel = ExtraModel.discriminator<INewExtra>("NewExtra", NewExtraSchema, "New");