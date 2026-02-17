export interface CommandHandler {

    handleCommand(command: string): Promise<string>;

}