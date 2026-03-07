export class InvalidUserInputException extends Error {

    constructor(message: string) {

        super(message);
        this.name = 'InvalidUserInputException';

    }

}