export class ClassNotDefinedException extends Error {

    constructor(message: string) {

        super(message);
        this.name = 'ClassNotDefinedException';

    }

}