import Bot from '../api/bot';
import token from '../settings';
import * as BotApi from '../api/bot_interface';

const paren = (str: string): string | undefined => {
    const left = '({<[（{《「';
    const right = ')}>]）}》」';
    const qwq = '○(￣□￣○)';
    const stack = [];
    for (let i = str.length - 1; i >= 0; i--) {
        if (left.indexOf(str[i]) !== -1) stack.push(str[i]);
        const match = left[right.indexOf(str[i])]
        if (right.indexOf(str[i]) !== -1 && stack.indexOf(match) !== -1) stack.splice(stack.indexOf(match, 1));
    }
    if (stack.length === 0) return;
    const resList = [];
    for (const index of stack) {
        resList.push(right[left.indexOf(index)]);
    }
    const res = resList.join('');
    return res + qwq;
}

const main = (): void => {
    const bot = new Bot(token.paren);
    bot.on(/.*/, (msg: BotApi.BotGetUpdatesResultMessage, props: string[]) => {
        const p = paren(props[0]);
        if (p) bot.sendMessage(msg.from.id, p); 
    });
    bot.on('/start', (msg: BotApi.BotGetUpdatesResultMessage) => {
        const id = msg.from.id;
        bot.sendMessage(id, '咸鱼叫，咸鱼叫，咸鱼被吃掉！');
    })
    bot.listen();
}

main();


