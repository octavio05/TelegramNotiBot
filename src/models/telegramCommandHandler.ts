import { DataNotFoundException } from "../customExceptions/dataNotFound";
import { UnknownCommandException } from "../customExceptions/unknownCommandException";
import { Trainings } from "../enums/trainings";
import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { CommandHandler } from "../interfaces/commandHandler";
import { CommandHandlerResponse } from "../interfaces/commandHandlerResponse";
import { Repository } from "../interfaces/Repository";

export class TelegramCommandHandler implements CommandHandler {

    private readonly _configurationRepository: Repository<AutobookingConfigurationDto>;

    constructor(configurationRepository: Repository<AutobookingConfigurationDto>) {

        if (configurationRepository === null || configurationRepository === undefined)
            throw new Error('configurationRepository cannot be null or undefined');

        this._configurationRepository = configurationRepository;

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
            default:
                throw new UnknownCommandException(command);
        }

    }

    private async handleConfigActual(): Promise<CommandHandlerResponse> {

        const actualConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();

        const message = `📅 Días de reserva a futuro: *${actualConfiguration.configuration.maxBookingAdvanceDays}*\n` +
            `⏰ Hora de la clase: *${actualConfiguration.configuration.classTimeRangeInit} a ${actualConfiguration.configuration.classTimeRangeEnd}*\n` +
            `🏋️ Clase: *${actualConfiguration.configuration.trainingName}*\n` +
            `Estado: ${actualConfiguration.configuration.isActive ? '🟢 *Activo*' : '🔴 *Inactivo*'}`;

        return {
            message: this.escapeMarkdownV2(message)
        };

    }

    private async handleStartStop(): Promise<CommandHandlerResponse> {

        const actualConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();

        actualConfiguration.configuration.isActive = !actualConfiguration.configuration.isActive;
        await this._configurationRepository.addOrUpdate(actualConfiguration);

        return {
            message: this.escapeMarkdownV2(`Estado actualizado: ${actualConfiguration.configuration.isActive ? '🟢 *Activo*' : '🔴 *Inactivo*'}`)
        };

    }

    private async handleModifyBookingTraining(): Promise<CommandHandlerResponse> {

        return {
            message: 'Selecciona una opción:',
            options: {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: Trainings.CROSSFIT, callback_data: Trainings.CROSSFIT },
                            { text: Trainings.HYROX, callback_data: Trainings.HYROX }
                        ]
                    ]
                }
            },
            callback: {
                eventName: 'callback_query',
                func: async (callbackQuery: any) => {

                    const actualConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();
                    actualConfiguration.configuration.trainingName = callbackQuery.data as Trainings;
                    await this._configurationRepository.addOrUpdate(actualConfiguration);

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

                    if (!message.text || !this.isValidTime(message.text))
                        return {
                            message: this.escapeMarkdownV2('No se ha proporcionado una hora válida. Escribe la hora de la clase en formato HH:MM'),
                            finished: false
                        };

                    const [timeRangeInit, timeRangeEnd] = this.getTimeRange(message.text);

                    const actualConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();
                    actualConfiguration.configuration.classTimeRangeInit = timeRangeInit;
                    actualConfiguration.configuration.classTimeRangeEnd = timeRangeEnd;
                    await this._configurationRepository.addOrUpdate(actualConfiguration);

                    return {
                        message: this.escapeMarkdownV2(`Hora de la clase modificada correctamente por: *${actualConfiguration.configuration.classTimeRangeInit} a ${actualConfiguration.configuration.classTimeRangeEnd}*`)
                    };

                }
            }
        };

    }

    private async getCurrentConfiguration(): Promise<AutobookingConfigurationDto> {

        const actualConfiguration: AutobookingConfigurationDto | undefined = await this._configurationRepository.get();

        if (actualConfiguration === null || actualConfiguration === undefined)
            throw new DataNotFoundException('actual configuration not found');

        return actualConfiguration;

    }

    private escapeMarkdownV2(text: string): string {
        // Reservados en MarkdownV2: _ * [ ] ( ) ~ ` > # + - = | { } . !
        // Pero no queremos escapar los * que usamos para negrita.
        // Una forma simple es escapar los que dan problemas comunes.
        return text.replace(/([_\(\)~`>#\+\-=\|{}\.!])/g, '\\$1');
    }

    private isValidTime(time: string): boolean {

        const regexHora24 = /^(0?\d|1\d|2[0-3]):([0-5]\d)$/;
        return regexHora24.test(time);

    }

    private getTimeRange(timeRangeInit: string): [string, string] {

        const [hours, minutes] = timeRangeInit.split(':');

        const startHours = Number(hours);
        let endHours = startHours + 1;

        if (endHours >= 24)
            endHours = 0;

        const formattedStart = `${startHours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        const formattedEnd = `${endHours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;

        return [formattedStart, formattedEnd];

    }

}