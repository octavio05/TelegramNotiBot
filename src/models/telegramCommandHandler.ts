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
            default:
                throw new UnknownCommandException(command);
        }

    }

    // public async handleCallback(callbackQuery: any): Promise<CommandHandlerResponse> {

    //     const data = callbackQuery.data;

    //     if (Object.values(Trainings).includes(data as Trainings)) {
    //         const actualConfiguration: AutobookingConfigurationDto = await this.getActualConfiguration();
    //         actualConfiguration.configuration.trainingName = data as Trainings;
    //         await this._configurationRepository.addOrUpdate(actualConfiguration);

    //         return {
    //             message: this.escapeMarkdownV2(`Clase modificada correctamente por: *${actualConfiguration.configuration.trainingName}*`)
    //         };
    //     }

    //     throw new Error(`Unhandled callback data: ${data}`);

    // }

    private async handleConfigActual(): Promise<CommandHandlerResponse> {

        const actualConfiguration: AutobookingConfigurationDto = await this.getActualConfiguration();

        const message = `📅 Días de reserva a futuro: *${actualConfiguration.configuration.maxBookingAdvanceDays}*\n` +
            `⏰ Hora de la clase: *${actualConfiguration.configuration.classTimeRangeInit} a ${actualConfiguration.configuration.classTimeRangeEnd}*\n` +
            `🏋️ Clase: *${actualConfiguration.configuration.trainingName}*\n` +
            `Estado: ${actualConfiguration.configuration.isActive ? '🟢 *Activo*' : '🔴 *Inactivo*'}`;

        return {
            message: this.escapeMarkdownV2(message)
        };

    }

    private async handleStartStop(): Promise<CommandHandlerResponse> {

        const actualConfiguration: AutobookingConfigurationDto = await this.getActualConfiguration();

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
            callback: async (callbackQuery: any) => {

                const actualConfiguration: AutobookingConfigurationDto = await this.getActualConfiguration();
                actualConfiguration.configuration.trainingName = callbackQuery.data as Trainings;
                await this._configurationRepository.addOrUpdate(actualConfiguration);

                return {
                    message: this.escapeMarkdownV2(`Clase modificada correctamente por: *${actualConfiguration.configuration.trainingName}*`)
                };

            }
        };

    }

    private async getActualConfiguration(): Promise<AutobookingConfigurationDto> {

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

}