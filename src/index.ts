require('dotenv').config({ path: '.env' });

import connect from "./connect";
import { launch } from "./bot";

const { MONGODB, BOT_TOKEN } = process.env;

const init = async () => {
    try {
        await connect({db: MONGODB});
        await launch(BOT_TOKEN);
    } catch (err) {
        console.error(`Failed to start: ${err}`);
        process.exit(1);
    }
};

init();
