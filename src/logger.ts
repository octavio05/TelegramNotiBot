import fs from 'fs';
import * as path from 'path';
import { ILogger } from './interfaces/logger';
import { LoggerType } from './enums/loggerType';

export class Logger implements ILogger {

    private _fileName: string = 'app.log';
    private readonly _logPath: string;


    constructor(filePath: string) {

        this._logPath = path.join(filePath, this._fileName);

        try {

            this.createFolderIfNotExists(filePath);

        } catch (error) {

            console.error(`[LOGGER] Could not create logs folder: ${error}`);

        }

    }


    public info(message: string): void {

        this.writeLog(message, LoggerType.INFO);

    }

    public warn(message: string): void {

        this.writeLog(message, LoggerType.WARN);

    }

    public error(message: string): void {

        this.writeLog(message, LoggerType.ERROR);

    }

    public fatal(message: string): void {

        this.writeLog(message, LoggerType.FATAL);

    }

    private writeLog(message: string, type: LoggerType): void {

        const formattedMessage = `[${this.getFormatedDate()}] [${type}] ${message}`;

        if (type === LoggerType.ERROR || type === LoggerType.FATAL)
            console.error(formattedMessage);
        else
            console.log(formattedMessage);

        try {

            fs.appendFileSync(this._logPath, `${formattedMessage}\n`);

        } catch (error) {

            console.error(`[LOGGER] Could not write to log file: ${error}`);

        }

    }


    private createFolderIfNotExists(logPath: string): void {

        if (!fs.existsSync(logPath))
            fs.mkdirSync(logPath);

    }

    private getFormatedDate(): string {

        const date = new Date();

        const es = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return es.format(date).replace(',', '');

    }

}