import TelegramBot from "node-telegram-bot-api";
import { config } from "../config";

export function createTelegramBot(): TelegramBot {

    return new TelegramBot(config.TELEGRAM_TOKEN, { polling: true });

}
