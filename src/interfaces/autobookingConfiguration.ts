export interface AutobookingConfigurationDto {
    _id: string;
    _rev: string;
    configuration: AutobookingConfiguration;
}

export interface AutobookingConfiguration {

    maxBookingAdvanceDays: number;
    classTimeRangeInit: string;
    classTimeRangeEnd: string;
    trainingName: string;

}