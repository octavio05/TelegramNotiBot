export class UnknownCommandException extends Error {

    constructor(message: string) {

        super(message);
        this.name = 'UnknownCommandException';

    }

}