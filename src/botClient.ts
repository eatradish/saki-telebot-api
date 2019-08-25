import Bot, { BotDateResultMessage, BotDateResultChannelPost, BotDate } from './api/bot';
import token from '../settings';
import * as readline from 'readline';

const main = (): void => {
    const bot = new Bot(token.botClient);
    bot.on(/.*/, (msg: BotDateResultMessage | BotDateResultChannelPost) => {
        let a: string;
        const type = msg.chat.type;
        if (type == 'group' || type == 'supergroup' || type == 'private') {
            msg = msg as BotDateResultMessage;
            if (type == 'group' || type == 'supergroup') a = msg.chat.title;
            else a = 'private';
            console.log('> (' + a + ') ' + msg.from.username + ' (' +
                msg.from.first_name + ' ' + msg.from.last_name + '): ' + msg.text);
        }
        else {
            msg = msg as BotDateResultChannelPost;
            console.log('> (' + msg.chat.title + '): ' + msg.text);
        }
    });
    bot.listen();

    const send = async (): Promise<void> => {
        let result: BotDate
        const map = await bot.getUserList();
        console.log(map);
        const r = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        r.setPrompt('>');
        r.on('line', async (input) => {
            const data = input.split(' ');
            const id = Number(data[0])
            const text = data.splice(-1, 1).join('');
            if (id !== undefined && id !== NaN) result = await bot.sendMessage(id, text);
            if (result !== undefined) console.log('You: ' + result);
        });
        /*r.question('sendMessage: (id text) ', async (input) => {
            const data = input.split(' ');
            const id = Number(data[0])
            const text = data.splice(0, 1).join('');
            console.log(id, text);
            if (id !== undefined && id !== NaN) bot.sendMessage(id, text);
        });*/
    }
   send();
}

main();