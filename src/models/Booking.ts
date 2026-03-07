import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { Repository } from "../interfaces/Repository";
import { IBooking } from "../interfaces/IBooking";
import { ClassTimeNotDefinedException } from "../customExceptions/classTimeNotDefined";
import { ClassNotDefinedException } from "../customExceptions/classNotDefined";
import { Trainings } from "../enums/trainings";

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
    private _currentConfiguration?: AutobookingConfigurationDto;

    constructor(configurationRepository: Repository<AutobookingConfigurationDto>) {

        if (configurationRepository === null || configurationRepository === undefined)
            throw new Error('configurationRepository cannot be null or undefined');

        this._configurationRepository = configurationRepository;

    }

    public async getCurrentConfiguration(): Promise<AutobookingConfigurationDto> {

        if (!this._currentConfiguration)
            this._currentConfiguration = await this._configurationRepository.get() ?? await this.createDefaultConfiguration();

        return this._currentConfiguration;

    }

    public async toggleIsActive(): Promise<AutobookingConfigurationDto> {

        const currentConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();

        if (!currentConfiguration.configuration.classTimeRangeInit || !currentConfiguration.configuration.classTimeRangeEnd)
            throw new ClassTimeNotDefinedException('classTimeRangeInit or classTimeRangeEnd is undefined.');

        if (!currentConfiguration.configuration.trainingName)
            throw new ClassNotDefinedException('trainingName is undefined.');

        currentConfiguration.configuration.isActive = !currentConfiguration.configuration.isActive;
        await this._configurationRepository.addOrUpdate(currentConfiguration);

        return currentConfiguration;

    }

    public getTrainings(): string[] {

        return Object.values(Trainings);

    }

    public async modifyTraining(training: string): Promise<AutobookingConfigurationDto> {

        if (!Object.values(Trainings).includes(training as Trainings))
            throw new Error(`'${training}' is not a valid training.`);

        const currentConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();
        currentConfiguration.configuration.trainingName = training as Trainings;
        await this._configurationRepository.addOrUpdate(currentConfiguration);

        return currentConfiguration;

    }

    private async createDefaultConfiguration(): Promise<AutobookingConfigurationDto> {

        return await this._configurationRepository.addOrUpdate(this.currentConfiguration);

    }

}