import { config } from "./config";
import { Logger } from "./logger";
import { CommandHandler } from "./interfaces/commandHandler";
import { CommandHandlerResponse, CommandHandlerResponseCallback } from "./interfaces/commandHandlerResponse";
import { UnknownCommandException } from "./customExceptions/unknownCommandException";
import { DataNotFoundException } from "./customExceptions/dataNotFound";
import { ClassTimeNotDefinedException } from "./customExceptions/classTimeNotDefined";
import { ClassNotDefinedException } from "./customExceptions/classNotDefined";
import { createCommandHandler } from "./factories/commandHandlerFactory";
import { createTelegramBot } from "./factories/telegramBotFactory";

(async () => {

    const log = new Logger("logs");
    const bot = createTelegramBot();
    const commandHandler: CommandHandler = createCommandHandler();

    bot.onText(/^\/(.+)/, async (msg, match) => {

        if (msg.chat.id !== config.TELEGRAM_CHAT_ID) {

            log.warn(`Message from unknown chat: ${msg.chat.id}: ${msg.text}`);
            return;

        }

        if (!match)
            return;

        let response: CommandHandlerResponse = { message: '' };
        try {

            response = await commandHandler.handleCommand(match.input);
            await bot.sendMessage(msg.chat.id, response.message, { parse_mode: 'MarkdownV2', ...response.options });
            if (response.callback)
                executeCallback(response.callback);

        }
        catch (error) {

            handleError(error, match.input, response.message, msg.chat.id);

        }

    });

    function executeCallback(callback: CommandHandlerResponseCallback) {

        const handler = async (msgOrQuery: any) => {

            const chatId = msgOrQuery.message?.chat.id || msgOrQuery.chat?.id;

            if (!chatId || chatId !== config.TELEGRAM_CHAT_ID)
                return;

            let responseCallback: CommandHandlerResponse = { message: '' };
            try {

                responseCallback = await callback.func(msgOrQuery);
                await bot.sendMessage(chatId, responseCallback.message, { parse_mode: 'MarkdownV2', ...responseCallback.options });

                if (callback.eventName === 'callback_query') {

                    bot.answerCallbackQuery(msgOrQuery.id);

                }

                if (responseCallback.finished !== false) {

                    bot.removeListener(callback.eventName, handler);

                }

            }
            catch (error) {

                handleError(error, callback.eventName, responseCallback.message, chatId);
                bot.removeListener(callback.eventName, handler);

            }

        };

        bot.on(callback.eventName, handler);

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

        } else if (error instanceof ClassTimeNotDefinedException) {

            log.error(
                `[${command}] Class time not defined:\n` +
                `response message: ${responseMessage}\n` +
                `${(error as Error).stack}`
            );
            bot.sendMessage(chatId, 'La hora de la clase no está definida. Modifícala usando el comando /modificahorareserva');

        } else if (error instanceof ClassNotDefinedException) {

            log.error(
                `[${command}] Class not defined:\n` +
                `response message: ${responseMessage}\n` +
                `${(error as Error).stack}`
            );
            bot.sendMessage(chatId, 'La clase no está definida. Modifícala usando el comando /modificaclasereserva');

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