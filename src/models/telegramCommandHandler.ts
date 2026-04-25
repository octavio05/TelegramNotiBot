import { UnknownCommandException } from "../customExceptions/unknownCommandException";
import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { CommandHandler } from "../interfaces/commandHandler";
import { CommandHandlerResponse } from "../interfaces/commandHandlerResponse";
import { IBooking } from "../interfaces/IBooking";
import { InvalidUserInputException } from "../customExceptions/invalidUserInput";

export class TelegramCommandHandler implements CommandHandler {

    private readonly _booking: IBooking;

    constructor(booking: IBooking) {

        if (booking === null || booking === undefined)
            throw new Error('booking cannot be null or undefined');

        this._booking = booking;

    }

    public async handleCommand(command: string): Promise<CommandHandlerResponse> {

        switch (command) {
            case '/configactual':
                return await this.handleConfigActual();
            case '/startstop':
                return await this.handleStartStop();
            case '/modificaclasereserva':
                return await this.handleModifyBookingTraining();
            case '/modificahorareserva':
                return await this.handleModifyBookingTime();
            case '/modificadiasreserva':
                return await this.handleModifyMaxDaysInAdvance();
            default:
                throw new UnknownCommandException(command);
        }

    }

    private async handleConfigActual(): Promise<CommandHandlerResponse> {

        const currentConfiguration: AutobookingConfigurationDto = await this._booking.getCurrentConfiguration();

        const message = `📅 Días de reserva a futuro: *${currentConfiguration.configuration.maxDaysInAdvance ?? 'no definido'}*\n` +
            `⏰ Hora de la clase: *${currentConfiguration.configuration.classTimeRangeInit} - ${currentConfiguration.configuration.classTimeRangeEnd}*\n` +
            `🏋️ Clase: *${currentConfiguration.configuration.trainingName ?? 'no definido'}*\n` +
            `Estado: ${currentConfiguration.configuration.isActive ? '🟢 *Activo*' : '🔴 *Inactivo*'}`;

        return {
            message: this.escapeMarkdownV2(message)
        };

    }

    private async handleStartStop(): Promise<CommandHandlerResponse> {

        const currentConfiguration: AutobookingConfigurationDto = await this._booking.toggleIsActive();

        return {
            message: this.escapeMarkdownV2(`Estado actualizado: ${currentConfiguration.configuration.isActive ? '🟢 *Activo*' : '🔴 *Inactivo*'}`)
        };

    }

    private async handleModifyBookingTraining(): Promise<CommandHandlerResponse> {

        return {
            message: 'Selecciona una opción:',
            options: {
                reply_markup: {
                    inline_keyboard: [
                        this._booking.getTrainings().map(training => ({ text: training, callback_data: training }))
                    ]
                }
            },
            callback: {
                eventName: 'callback_query',
                func: async (callbackQuery: any) => {

                    const actualConfiguration: AutobookingConfigurationDto = await this._booking.modifyTraining(callbackQuery.data as string);

                    return {
                        message: this.escapeMarkdownV2(`Clase modificada correctamente por: *${actualConfiguration.configuration.trainingName}*`)
                    };

                }
            }
        };

    }

    private async handleModifyBookingTime(): Promise<CommandHandlerResponse> {

        return {
            message: 'Escribe la hora de la clase en formato HH:MM',
            callback: {
                eventName: 'message',
                func: async (message: any) => {

                    let actualConfiguration: AutobookingConfigurationDto;
                    try {

                        actualConfiguration = await this._booking.modifyClassTime(message.text);

                    }
                    catch (error) {

                        if (error instanceof InvalidUserInputException) {

                            return {
                                message: this.escapeMarkdownV2('No se ha proporcionado una hora válida. Escribe la hora de la clase en formato HH:MM'),
                                finished: false
                            };

                        }

                        throw error;

                    }

                    return {
                        message: this.escapeMarkdownV2(`Hora de la clase modificada correctamente por: *${actualConfiguration.configuration.classTimeRangeInit} a ${actualConfiguration.configuration.classTimeRangeEnd}*`)
                    };

                }
            }
        };

    }

    private async handleModifyMaxDaysInAdvance(): Promise<CommandHandlerResponse> {

        return {
            message: 'Escribe el número de días de reserva a futuro',
            callback: {
                eventName: 'message',
                func: async (message: any) => {

                    let actualConfiguration: AutobookingConfigurationDto;
                    try {

                        actualConfiguration = await this._booking.modifyMaxDaysInAdvance(Number(message.text));

                    }
                    catch (error) {

                        if (error instanceof InvalidUserInputException) {

                            return {
                                message: this.escapeMarkdownV2('No se ha proporcionado un número de días de reserva a futuro válido. Escribe el número de días de reserva a futuro'),
                                finished: false
                            };

                        }

                        throw error;

                    }

                    return {
                        message: this.escapeMarkdownV2(`Número de días de reserva a futuro modificado correctamente por: *${actualConfiguration.configuration.maxDaysInAdvance}*`)
                    };

                }
            }
        };

    }

    private escapeMarkdownV2(text: string): string {

        return text.replace(/([_\(\)~`>#\+\-=\|{}\.!])/g, '\\$1');

    }

}