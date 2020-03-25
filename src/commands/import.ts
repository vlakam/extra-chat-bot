import Telegraf, {ContextMessageUpdate} from "telegraf";
import adminMiddleware from "../middlewares/adminMiddleware";

export default (bot: Telegraf<ContextMessageUpdate>) => {
    bot.command('import', adminMiddleware, async (ctx: ContextMessageUpdate) => {
        ctx.reply(`Not implemented. Please donate a шаверма`);
    });
}
