import mongoose from 'mongoose';
import report from "../helpers/report";

const { MONGODB } = process.env;

mongoose.Promise = Promise;

const reportMongo = (msg: string) => {
    report(msg, 'MONGODB');
    console.log(`MONGODB: ${msg}`);
};

mongoose.connection.on('connected', () => {
    reportMongo('Connection Established');
});

mongoose.connection.on('reconnected', () => {
    reportMongo('Connection Reestablished');
});

mongoose.connection.on('disconnected', () => {
    reportMongo('Connection Disconnected')
});

mongoose.connection.on('close', () => {
    reportMongo('Connection Closed')
});

mongoose.connection.on('error', (error) => {
    reportMongo('ERROR: ' + error)
});

const connect = async () => {
    await mongoose.connect(MONGODB, {
        useNewUrlParser: true,
        useCreateIndex: true,
    });
};

connect().catch((error) => {
    console.error('Error connecting to database: ', error);
    return process.exit(1);
});

export * from './extra.model'
