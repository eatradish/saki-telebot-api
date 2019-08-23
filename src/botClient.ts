import Bot, { BotDateResultMessage, BotDateResultChannelPost } from './api/bot';
import token from '../settings';

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
}

main();