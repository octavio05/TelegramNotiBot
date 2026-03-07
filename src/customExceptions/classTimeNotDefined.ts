export class ClassTimeNotDefinedException extends Error {

    constructor(message: string) {

        super(message);
        this.name = 'ClassTimeNotDefinedException';

    }

}