export interface CommandHandlerResponse {

    message: string;
    options?: any;
    callback?: CommandHandlerResponseCallback;
    finished?: boolean;

}

export interface CommandHandlerResponseCallback {

    eventName: string;
    func: (callbackQuery: any) => Promise<CommandHandlerResponse>;

}