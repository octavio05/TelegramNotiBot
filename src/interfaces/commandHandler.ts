import { CommandHandlerResponse } from "./commandHandlerResponse";

export interface CommandHandler {

    handleCommand(command: string): Promise<CommandHandlerResponse>;

}