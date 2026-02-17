export interface CommandHandlerResponse {

    message: string;
    options?: any;
    callback?: (callbackQuery: any) => Promise<CommandHandlerResponse>;

}