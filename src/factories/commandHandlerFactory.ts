import { config } from "../config";
import { CouchDbAdapter } from "../adapters/couchDbAdapter";
import { DatabaseConfig } from "../interfaces/databaseConfig";
import { DatabaseAdapter } from "../interfaces/databaseAdapter";
import { AutobookingConfigurationDto } from "../interfaces/autobookingConfiguration";
import { Repository } from "../interfaces/Repository";
import { CommandHandler } from "../interfaces/commandHandler";
import { ConfigurationRepository } from "../repositories/configurationRepository";
import { Booking } from "../models/Booking";
import { TelegramCommandHandler } from "../models/telegramCommandHandler";

export function createCommandHandler(): CommandHandler {

    const dbConfig: DatabaseConfig = {
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        host: config.DB_HOST,
        port: config.DB_PORT,
        dbName: config.DB_NAME
    };

    const dbAdapter: DatabaseAdapter = new CouchDbAdapter(dbConfig);
    const configurationRepository: Repository<AutobookingConfigurationDto> = new ConfigurationRepository(dbAdapter);
    const booking = new Booking(configurationRepository);

    return new TelegramCommandHandler(booking);

}
