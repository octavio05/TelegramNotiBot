import { AutobookingConfigurationDto } from "./autobookingConfiguration";

export interface IBooking {

    getCurrentConfiguration(): Promise<AutobookingConfigurationDto>;
    toggleIsActive(): Promise<AutobookingConfigurationDto>;
    getTrainings(): string[];
    modifyTraining(training: string): Promise<AutobookingConfigurationDto>;

}