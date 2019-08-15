import Bot from './api/bot';
import token from '../settings';

const paren = (str: string): string => {
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
    const bot = new Bot(token);
    bot.on(/.*/, (id, props) => {
        const p = paren(props[0]);
        if (p) bot.sendMessage(id, p); 
    });
    bot.listen();
}

main();


