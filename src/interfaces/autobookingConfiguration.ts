import { Trainings } from "../enums/trainings";

export interface AutobookingConfigurationDto {
    _id?: string;
    _rev?: string;
    configuration: AutobookingConfiguration;
}

export interface AutobookingConfiguration {

    maxDaysInAdvance?: number;
    classTimeRangeInit: string;
    classTimeRangeEnd: string;
    trainingName?: Trainings;
    isActive: boolean;

}