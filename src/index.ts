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
import { CommandHandlerResponse } from "./interfaces/commandHandlerResponse";

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

        let response: CommandHandlerResponse = { message: '' };
        try {

            response = await commandHandler.handleCommand(msg.text);
            await bot.sendMessage(msg.chat.id, response.message, { parse_mode: 'MarkdownV2', ...response.options });
            if (response.callback)
                executeCallback(response.callback);

        }
        catch (error) {

            handleError(error, msg.text ?? '', response.message, msg.chat.id);

        }

    });

    function executeCallback(callback: (callbackQuery: any) => Promise<CommandHandlerResponse>) {

        bot.removeAllListeners('callback_query');

        bot.on('callback_query', async (callbackQuery) => {

            let responseCallback: CommandHandlerResponse = { message: '' };
            try {

                responseCallback = await callback(callbackQuery);
                await bot.sendMessage(callbackQuery.message!.chat.id, responseCallback.message, { parse_mode: 'MarkdownV2', ...responseCallback.options });

                bot.answerCallbackQuery(callbackQuery.id);

            }
            catch (error) {

                handleError(error, 'CALLBACK_QUERY', responseCallback.message, callbackQuery.message!.chat.id);

            }

        });

    }

    function handleError(error: any, command: string, responseMessage: string, chatId: number) {

        if (error instanceof UnknownCommandException) {

            log.error(
                `[${command}] Unknown command:\n` +
                `response message: ${responseMessage}\n` +
                `${(error as Error).stack}`
            );
            bot.sendMessage(chatId, 'Comando desconocido');

        } else if (error instanceof DataNotFoundException) {

            log.error(
                `[${command}] Data not found:\n` +
                `response message: ${responseMessage}\n` +
                `${(error as Error).stack}`
            );
            bot.sendMessage(chatId, 'No se encontraron datos');

        }
        else {

            log.error(
                `[${command}] Unexpected error:\n` +
                `response message: ${responseMessage}\n` +
                `${(error as Error).stack}`
            );
            bot.sendMessage(chatId, 'Error inesperado al ejecutar el comando');

        }

    }

})();