import { DataNotFoundException } from "../customExceptions/dataNotFound";
import { UnknownCommandException } from "../customExceptions/unknownCommandException";
import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { CommandHandler } from "../interfaces/commandHandler";
import { Repository } from "../interfaces/Repository";

export class TelegramCommandHandler implements CommandHandler {

    private readonly _configurationRepository: Repository<AutobookingConfigurationDto>;

    constructor(configurationRepository: Repository<AutobookingConfigurationDto>) {

        if (configurationRepository === null || configurationRepository === undefined)
            throw new Error('configurationRepository cannot be null or undefined');

        this._configurationRepository = configurationRepository;

    }

    public async handleCommand(command: string): Promise<string> {

        switch (command) {
            case '/configactual':
                return await this.handleConfigActual();
            default:
                throw new UnknownCommandException(command);
        }

    }

    private async handleConfigActual(): Promise<string> {

        const actualConfiguration: AutobookingConfigurationDto | undefined = await this._configurationRepository.get();

        if (actualConfiguration === null || actualConfiguration === undefined)
            throw new DataNotFoundException('actual configuration not found');

        return `📅 Días de reserva a futuro: *${actualConfiguration.configuration.maxBookingAdvanceDays}*\n⏰ Hora de la clase: *${actualConfiguration.configuration.classTimeRangeInit} a ${actualConfiguration.configuration.classTimeRangeEnd}*\n🏋️ Clase: *${actualConfiguration.configuration.trainingName}*`;

    }

}