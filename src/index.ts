import TelegramBot from "node-telegram-bot-api";
import { config } from "./config";
import { Logger } from "./logger";
import { DatabaseConfig } from "./interfaces/databaseConfig";
import { CouchDbAdapter } from "./adapters/couchDbAdapter";
import { ConfigurationRepository } from "./repositories/configurationRepository";
import { DatabaseAdapter } from "./interfaces/databaseAdapter";
import { AutobookingConfigurationDto } from "./interfaces/autobookingConfiguration";
import { TelegramCommandHandler } from "./models/telegramCommandHandler";
import { Repository } from "./interfaces/Repository";
import { CommandHandler } from "./interfaces/commandHandler";
import { UnknownCommandException } from "./customExceptions/unknownCommandException";
import { DataNotFoundException } from "./customExceptions/dataNotFound";

(async () => {

    const log = new Logger("logs");
    const bot = new TelegramBot(config.TELEGRAM_TOKEN, { polling: true });
    const dbConfig: DatabaseConfig = {
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        host: config.DB_HOST,
        port: config.DB_PORT,
        dbName: config.DB_NAME
    };
    const dbAdapter: DatabaseAdapter = new CouchDbAdapter(dbConfig);
    const configurationRepository: Repository<AutobookingConfigurationDto> = new ConfigurationRepository(dbAdapter);
    const commandHandler: CommandHandler = new TelegramCommandHandler(configurationRepository);

    bot.on("message", async (msg) => {

        if (msg.chat.id !== config.TELEGRAM_CHAT_ID) {

            log.warn(`Message from unknown chat: ${msg.chat.id}: ${msg.text}`);
            return;

        }

        if (!msg.text)
            return;

        let response: string = '';
        try {

            response = await commandHandler.handleCommand(msg.text);
            await bot.sendMessage(msg.chat.id, response, { parse_mode: 'MarkdownV2' });

        }
        catch (error) {

            if (error instanceof UnknownCommandException) {

                log.error(
                    `[${msg.text}] Unknown command:\n` +
                    `response message: ${response}\n` +
                    `${(error as Error).stack}`
                );
                await bot.sendMessage(msg.chat.id, 'Comando desconocido');
                return;

            } else if (error instanceof DataNotFoundException) {

                log.error(
                    `[${msg.text}] Data not found:\n` +
                    `response message: ${response}\n` +
                    `${(error as Error).stack}`
                );
                await bot.sendMessage(msg.chat.id, 'No se encontraron datos');
                return;

            }
            else {

                log.error(
                    `[${msg.text}] Unexpected error:\n` +
                    `response message: ${response}\n` +
                    `${(error as Error).stack}`
                );
                await bot.sendMessage(msg.chat.id, 'Error inesperado al ejecutar el comando');
                return;

            }

        }

    });



})();