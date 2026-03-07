import { AutobookingConfigurationDto } from "./autobookingConfiguration";

export interface IBooking {

    getCurrentConfiguration(): Promise<AutobookingConfigurationDto>;
    isActiveToggle(): Promise<void>;

}