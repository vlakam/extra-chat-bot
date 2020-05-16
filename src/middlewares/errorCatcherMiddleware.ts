import {Context} from "telegraf";
import report from "../helpers/report";

export default async (ctx: Context, next: Function) => {
    try {
        await next();
    } catch (e) {
        report(`Uncaught error: ${e}`);
    }
}
