import { Trainings } from "../enums/trainings";
import { Weekday } from "../enums/weekdays";
import { AutobookingConfigurationDto } from "./autobookingConfiguration";

export interface IBooking {

    getCurrentConfiguration(): Promise<AutobookingConfigurationDto>;
    toggleIsActive(): Promise<AutobookingConfigurationDto>;
    getTrainings(): string[];
    modifyTraining(day: Weekday, training: Trainings, time: string): Promise<AutobookingConfigurationDto>;
    modifyMaxDaysInAdvance(maxDaysInAdvance: number): Promise<AutobookingConfigurationDto>;

}