import mongoose, { Schema, Document } from 'mongoose';

export interface IExtra extends Document {
    hashtag: string;
    chat: string;
    ttl: number;
    kind: string;

    dump: () => string;
    toList: () => string;
}

//Deprecated. Remove ASAP
export interface IOldExtra extends IExtra {
    code: string;
}

export interface INewExtra extends IExtra {
    replica: object;
    type: string;
    description?: string;
    private: boolean;
}

const BaseExtraSchema: Schema = new Schema({
    hashtag: { type: String, required: true },
    chat: { type: String, required: true },
    ttl: { type: Number, required: false, default: -1 },
    kind: { type: String, required: true, enum: ['Old', 'New'], default: 'Old' }
}, {
    discriminatorKey: 'kind',
});

BaseExtraSchema.methods.dump = (): string => { return ''; };
BaseExtraSchema.methods.toList = (): string => { return ''; };

const OldExtraSchema: Schema = new Schema({
    code: { type: String, required: true }
}, {
    discriminatorKey: 'kind'
});

OldExtraSchema.methods.dump = function (): string {
    return JSON.stringify({
        kind: 'Old',
        code: this.code,
    }, null, 2);
};
OldExtraSchema.methods.toList = function (): string { return this.hashtag; };

const NewExtraSchema: Schema = new Schema({
    replica: { type: Object, required: true },
    type: { type: String, required: true },
    description: { type: String, required: false },
    private: { type: Boolean, required: true, default: false },
}, {
    discriminatorKey: 'kind'
})

NewExtraSchema.methods.dump = function (): string {
    return JSON.stringify({
        kind: 'New',
        type: this.type,
        replica: this.replica,
        description: this.description,
        private: this.private
    }, null, 2);
};
NewExtraSchema.methods.toList = function (): string { return `${this.hashtag} ${this.description ? `- ${this.description}` : ''}`;; };

BaseExtraSchema.index({ chat: 1, hashtag: 1 }, { unique: true });
export const ExtraModel = mongoose.model<IExtra>('Extra', BaseExtraSchema);
export const OldExtraModel = ExtraModel.discriminator<IOldExtra>("OldExtra", OldExtraSchema, "Old");
export const NewExtraModel = ExtraModel.discriminator<INewExtra>("NewExtra", NewExtraSchema, "New");