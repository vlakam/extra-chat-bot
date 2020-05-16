import Telegraf, {Context} from "telegraf";
import adminMiddleware from "../middlewares/adminMiddleware";

export default (bot: Telegraf<Context>) => {
    bot.command('import', adminMiddleware, async (ctx: Context) => {
        ctx.reply(`Not implemented. Please donate a шаверма`);
    });
}
