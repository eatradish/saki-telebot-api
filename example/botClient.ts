import Bot from '../api/bot';
import * as BotAPI from '../api/bot_interface';
import token from '../settings';
import * as readline from 'readline';
import { Message } from '../api/message';
import { isNumber } from 'util';

const main = async (): Promise<void> => {
    const bot = new Bot(token.botClient);
    bot.on(/.*/, (msg: BotAPI.BotGetUpdatesResultMessage |
        BotAPI.BotGetUpdatesResultChannelPost |
        BotAPI.BotGetUpdatesResultEditedMessage) => {
        let a: string;
        const type = msg.chat.type;
        if (type == 'group' || type == 'supergroup' || type == 'private') {
            msg = msg as BotAPI.BotGetUpdatesResultMessage;
            if (type == 'group' || type == 'supergroup') a = 'group: ' + msg.chat.title;
            else a = 'private';
            const s = '> (' + a + ') ' + msg.from.username + ' (' +
                msg.from.first_name + ' ' + msg.from.last_name + '): ';
            if (msg.text) console.log(s + msg.text);
            else if (msg.photo) {
                const ss = s + '[photo], file_id: ' + msg.photo[msg.photo.length - 1].file_id;
                if (msg.caption !== undefined) console.log(ss + ', text: ' + msg.caption);
                else console.log(ss);
            }
            else if (msg.sticker) console.log(s + '[sticker], emoji: ' + msg.sticker.emoji);
            else return;
        }
        else {
            msg = msg as BotAPI.BotGetUpdatesResultChannelPost;
            const s = '> (' + msg.chat.title + '): ';
            if (msg.text) console.log(s + msg.text);
            else if (msg.photo) console.log(s + '[photo]: ' + msg.photo[msg.photo.length - 1].file_id);
            else if (msg.sticker) console.log(s + '[sticker]: ' + msg.sticker.emoji);
            else return;
        }
    });
    bot.on('/start', (msg: Message) => msg.replyText('咸鱼叫，咸鱼叫，咸鱼被吃掉！'));
    bot.listen();

    const send = (map: Map<number, string>): void => {
        let result: BotAPI.BotSendMessage;
        const r = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        r.setPrompt('>>> ');
        r.on('line', async (input) => {
            const arg = input.split(' ');
            const command = arg[0];
            if (command === 'text') {
                const id = Number(arg[1]);
                arg.shift();
                arg.shift();
                const data = arg.join(' ');
                if (isNumber(id) && id !== NaN) result = await bot.sendMessage(id, data);
                if (result !== undefined) console.log('to ' + map.get(id) + ': ' + result.result.text);
            }
            else if (command === 'list') console.log(map);
        });
    }
    const map = await bot.getUserList();
    send(map);
}

main();