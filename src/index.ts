import Bot from './api/bot';
import token from '../settings';

const paren = (str: string) => {
    const left = '({<[（{《「';
    const right = ')}>]）}》」';
    const stack = [];
    for (let i = 0; i < str.length; i++) {
        if (left.indexOf(str[i]) !== -1) stack.push(str[i]);
        const match = left[right.indexOf(str[i])]
        if (right.indexOf(str[i]) !== -1 && stack.indexOf(match) !== -1) stack.splice(stack.indexOf(match, 1));
    }
    if (stack.length === 0) return;
    const resList = [];
    let res = '';
    for (const index of stack) {
        resList.push(right[left.indexOf(index)]);
    }
    for (const index of resList) {
        res = res + index;
    }
    return res;
}


const bot = new Bot(token);
const sleep = ((time: number) => {
    return new Promise(resolve => setTimeout(resolve, time));
});

const main = async () => {
    let data;
    let new_upload_id;
    let old_upload_id;
    while (true) {
        if (data === undefined) {
            data = await bot.getUpdates();
            old_upload_id = data.result[data.result.length - 1].update_id;
        }
        const newData = await bot.getUpdates();
        new_upload_id = newData.result[newData.result.length - 1].update_id;
        let id;
        let text;
        if (newData.ok && newData.result) {
            if (new_upload_id !== old_upload_id) {
                id = newData.result[newData.result.length - 1].message.from.id;
                text = newData.result[newData.result.length - 1].message.text;
                const p = paren(text);
                let result;
                if (p !== undefined) result = await bot.sendMessage(id, p);
                if (result) console.log(result);
                old_upload_id = new_upload_id;
            }
        }
        await sleep(5000);
    }
}

main();


