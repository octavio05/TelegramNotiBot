import { UnknownCommandException } from "../customExceptions/unknownCommandException";
import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { CommandHandler } from "../interfaces/commandHandler";
import { CommandHandlerResponse } from "../interfaces/commandHandlerResponse";
import { IBooking } from "../interfaces/IBooking";
import { InvalidUserInputException } from "../customExceptions/invalidUserInput";
import { Weekday, WeekdayLabels } from "../enums/weekdays";
import { Trainings } from "../enums/trainings";


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
            case '/modificareserva':
                return await this.handleModifyBooking();
            case '/modificadiasreserva':
                return await this.handleModifyMaxDaysInAdvance();
            default:
                throw new UnknownCommandException(command);
        }

    }

    private async handleConfigActual(): Promise<CommandHandlerResponse> {

        const currentConfiguration: AutobookingConfigurationDto = await this._booking.getCurrentConfiguration();
        const configTrainings = currentConfiguration.configuration.trainings ?? {};

        const daysWithReservations = Object.entries(configTrainings)
            .map(([day, t]) => `  • ${WeekdayLabels[day as Weekday]}: *${t!.trainingName}* (${t!.classTimeRangeInit} - ${t!.classTimeRangeEnd})`)
            .join('\n');

        const message = `📅 Días de reserva a futuro: *${currentConfiguration.configuration.maxDaysInAdvance ?? 'no definido'}*\n` +
            `🕒 Reservas:\n${daysWithReservations || '  (ninguna)'}\n\n` +
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

    private async handleModifyBooking(): Promise<CommandHandlerResponse> {

        let selectedDay: Weekday;
        let selectedTraining: Trainings;

        return {
            message: 'Selecciona un día de la semana:',
            options: {
                reply_markup: {
                    inline_keyboard: [
                        Object.values(Weekday).map(day => ({ text: WeekdayLabels[day], callback_data: day }))
                    ]
                }
            },
            callback: {
                eventName: 'callback_query',
                func: async (callbackQuery: any) => {

                    selectedDay = callbackQuery.data as Weekday;

                    return {
                        message: 'Selecciona una clase:',
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

                                selectedTraining = callbackQuery.data as Trainings;

                                return {
                                    message: 'Escribe la hora de la clase en formato HH:MM',
                                    callback: {
                                        eventName: 'message',
                                        func: async (message: any) => {

                                            let actualConfiguration: AutobookingConfigurationDto;
                                            try {

                                                actualConfiguration = await this._booking.modifyTraining(selectedDay, selectedTraining, message.text);

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

                                            const finalMessage = `Configuración actualizada correctamente:\n` +
                                                `📅 Día: *${WeekdayLabels[selectedDay]}*\n` +
                                                `🏋️ Clase: *${actualConfiguration.configuration.trainings![selectedDay]!.trainingName}*\n` +
                                                `⏰ Hora: *${actualConfiguration.configuration.trainings![selectedDay]!.classTimeRangeInit} - ${actualConfiguration.configuration.trainings![selectedDay]!.classTimeRangeEnd}*`;

                                            return {
                                                message: this.escapeMarkdownV2(finalMessage)
                                            };

                                        }
                                    }
                                }
                            }
                        }
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