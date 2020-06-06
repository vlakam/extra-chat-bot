import Telegraf, {Context} from "telegraf";
import adminMiddleware from "../middlewares/adminMiddleware";
import { BotCommand } from "telegraf/typings/telegram-types";

export default (bot: Telegraf<Context>, commands: Array<BotCommand>) => {
    bot.command('import', adminMiddleware, async (ctx: Context) => {
        ctx.reply(`Not implemented. Please donate a шаверма`);
    });

    commands.push({ command: 'import', description: 'Import an chat backup' });
}
