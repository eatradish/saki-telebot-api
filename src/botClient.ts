import Bot from './api/bot';
import * as BotAPI from './api/bot_interface';
import token from '../settings';
import * as readline from 'readline';

const main = async (): Promise<void> => {
    const bot = new Bot(token.botClient);
    bot.on(/.*/, (msg: BotAPI.BotGetUpdatesResultMessage | BotAPI.BotGetUpdatesResultChannelPost) => {
        let a: string;
        const type = msg.chat.type;
        if (type == 'group' || type == 'supergroup' || type == 'private') {
            msg = msg as BotAPI.BotGetUpdatesResultMessage;
            if (type == 'group' || type == 'supergroup') a = 'group: ' + msg.chat.title;
            else a = 'private: ';
            const s = '> (' + a + ') ' + msg.from.username + ' (' +
                msg.from.first_name + ' ' + msg.from.last_name + '): ';
            console.log(msg)
            if (msg.text) console.log(s + msg.text);
            else if (msg.photo) {
                const ss = s + '[photo], file_id: ' + msg.photo[msg.photo.length - 1].file_id;
                if (msg.caption !== undefined) console.log(ss + ', text: ' + msg.caption);
                else console.log(ss);
            }
            else if (msg.sticker) console.log(s + '[sticker], emoji: ' + msg.sticker.emoji);
        }
        else {
            msg = msg as BotAPI.BotGetUpdatesResultChannelPost;
            const s = '> (' + msg.chat.title + '): ';
            if (msg.text) console.log(s + msg.text);

        }
    });
    bot.listen();

    const send = (map: Map<number, string>): void => {
        let result: BotAPI.BotSendMessage;
        console.log(map);
        const r = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        r.setPrompt('send>>> ');
        r.on('line', async (input) => {
            const data = input.split(', ');
            const id = Number(data[0])
            const text = data.splice(-1, 1).join('');
            if (id !== undefined && id !== NaN) result = await bot.sendMessage(id, text);
            if (result !== undefined) console.log('to ' + map.get(id) + ': ' + result.result.text);
        });
    }
    const map = await bot.getUserList();
    send(map);
}

main();