import {ContextMessageUpdate} from "telegraf";
import report from "../helpers/report";

export default async (ctx: ContextMessageUpdate, next: Function) => {
    try {
        await next();
    } catch (e) {
        report(`Uncaught error: ${e}`);
    }
}
