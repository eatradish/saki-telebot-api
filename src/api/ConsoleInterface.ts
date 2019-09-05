import { EventEmitter } from 'events';
import 'colors';
import Readline from 'readline';

export default class ConsoleInterface extends EventEmitter {
    private readonly readline: Readline.Interface;
    public constructor() {
        super();
        this.readline = Readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.listenInput();
    }
    public info(message: string): void {
        console.log(`[ ${new Date().toLocaleString()} - INFO ] ${message}`);
    }
    public error(message: string): void {
        console.log(`[ ${new Date().toLocaleString()} - ERROR ] ${message}`.red);
    }
    public warn(message: string): void {
        console.log(`[ ${new Date().toLocaleString()} - WARN ] ${message}`.yellow);
    }
    public debug(message: string): void {
        console.log(`[ ${new Date().toLocaleString()} - DEBUG ] ${message}`.gray);
    }
    private async listenInput(): Promise<void> {
        while (1) {
            const input = await this.prompt();
            this.emit('input', input);
        }
    }
    private prompt(): Promise<string> {
        return new Promise((resolve): void => {
            this.readline.question('> ', (command) => resolve(command));
        });
    }
}