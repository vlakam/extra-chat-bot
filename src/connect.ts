import mongoose from 'mongoose';

type TInput = {
    db: string;
}
export default async ({db}: TInput) => {

    const connect = async () => {
        await mongoose.connect(db, { useNewUrlParser: true });
        return console.info(`Successfully connected to ${db}`);
    };
    await connect();

    mongoose.connection.on('disconnected', async () => {
        console.error('Lost connection to mongo. Trying to reconnect');
        try {
            await connect();
        } catch (error) {
            console.error('Error connecting to database: ', error);
            return process.exit(1);
        }
    });
};
