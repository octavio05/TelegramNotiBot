import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { Repository } from "../interfaces/Repository";
import { IBooking } from "../interfaces/IBooking";

export class Booking implements IBooking {

    public currentConfiguration: AutobookingConfigurationDto = {
        configuration: {
            classTimeRangeInit: '',
            classTimeRangeEnd: '',
            isActive: false,
            maxDaysInAdvance: 1
        }
    };

    private readonly _configurationRepository: Repository<AutobookingConfigurationDto>;

    constructor(configurationRepository: Repository<AutobookingConfigurationDto>) {

        if (configurationRepository === null || configurationRepository === undefined)
            throw new Error('configurationRepository cannot be null or undefined');

        this._configurationRepository = configurationRepository;

    }

    public async getCurrentConfiguration(): Promise<AutobookingConfigurationDto> {

        return await this._configurationRepository.get() ?? await this.createDefaultConfiguration();

    }

    public async isActiveToggle(): Promise<void> {

        const currentConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();

        currentConfiguration.configuration.isActive = !currentConfiguration.configuration.isActive;
        await this._configurationRepository.addOrUpdate(currentConfiguration);

    }

    private async createDefaultConfiguration(): Promise<AutobookingConfigurationDto> {

        return await this._configurationRepository.addOrUpdate(this.currentConfiguration);
    }

}