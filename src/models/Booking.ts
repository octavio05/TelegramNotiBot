import { AutobookingConfigurationDto, DailyTraining } from "../interfaces/autobookingConfiguration";
import { Repository } from "../interfaces/Repository";
import { IBooking } from "../interfaces/IBooking";
import { Trainings } from "../enums/trainings";
import { InvalidUserInputException } from "../customExceptions/invalidUserInput";
import { Weekday } from "../enums/weekdays";

export class Booking implements IBooking {

    public currentConfiguration: AutobookingConfigurationDto = {
        configuration: {
            isActive: false,
            maxDaysInAdvance: 1,
            trainings: {} as Record<Weekday, DailyTraining>
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

        currentConfiguration.configuration.isActive = !currentConfiguration.configuration.isActive;
        await this._configurationRepository.addOrUpdate(currentConfiguration);

        return currentConfiguration;

    }

    public getTrainings(): string[] {

        return Object.values(Trainings);

    }

    public async modifyTraining(day: Weekday, trainingName: Trainings, time: string): Promise<AutobookingConfigurationDto> {

        if (!this.isValidTime(time))
            throw new InvalidUserInputException('Invalid time range.');

        const [classTimeRangeInit, classTimeRangeEnd] = this.getTimeRange(time);

        const currentConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();

        if (!currentConfiguration.configuration.trainings)
            currentConfiguration.configuration.trainings = {};

        currentConfiguration.configuration.trainings[day] = { trainingName, classTimeRangeInit, classTimeRangeEnd };
        await this._configurationRepository.addOrUpdate(currentConfiguration);

        return currentConfiguration;

    }

    public async modifyMaxDaysInAdvance(maxDaysInAdvance: number): Promise<AutobookingConfigurationDto> {

        if (maxDaysInAdvance < 1)
            throw new InvalidUserInputException('Invalid maxDaysInAdvance.');

        const actualConfiguration: AutobookingConfigurationDto = await this.getCurrentConfiguration();
        actualConfiguration.configuration.maxDaysInAdvance = maxDaysInAdvance;
        await this._configurationRepository.addOrUpdate(actualConfiguration);

        return actualConfiguration;

    }

    private async createDefaultConfiguration(): Promise<AutobookingConfigurationDto> {

        return await this._configurationRepository.addOrUpdate(this.currentConfiguration);

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