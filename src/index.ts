import TelegramBot from "node-telegram-bot-api";
import { config } from "./config";
import { Logger } from "./logger";

(async () => {

    const log = new Logger("logs");
    const bot = new TelegramBot(config.TELEGRAM_TOKEN, { polling: true });

    bot.on("message", (msg) => {

        log.info(`Message from ${msg.chat.id}: ${msg.text}`);

    });

})();