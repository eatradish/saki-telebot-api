import Bot from '../api/bot';
import * as Cheerio from 'cheerio';
import axios from 'axios';
import token from '../../settings';

interface TreeHoleItem {
    id: number;
    username: string;
    text: string;
}

const parser = (needParse: string): TreeHoleItem[] => {
    const che = Cheerio.load(needParse);
    const html = che.html();
    const parseList = html.split("\n");
    const startStr = '<ol class="commentlist" style="list-style-type: none;">';
    const endStr = '<div class="cp-pagenavi">';
    let start, end;
    let tempList = [];
    const resList = [];
    for (let i = 0; i < parseList.length; i++) {
        if (parseList[i].indexOf(startStr) !== -1) start = i;
        else if (parseList[i].indexOf(endStr) !== -1) end = i;
    }
    for (let i = start + 1; i < end; i++) {
        tempList.push(parseList[i]);
    }
    let i = tempList.length - 1;
    while (i >= 0) {
        if (tempList[i].indexOf('</ol>') === -1) {
            tempList.splice(i, 1);
            i -= 1;
        }
        else break;
    }
    tempList.pop();
    tempList = tempList.join('\n').split('</li>');
    const ids = [];
    const tempList2 = [];
    for (let i = 0; i < tempList.length; i++) {
        tempList[i] += '</li>';
        const id = cheerio('li', tempList[i]).attr('id').replace('comment-', '');
        ids.push(id);
    }
    for (let i = 0; i < tempList.length; i++) {
        tempList2.push(cheerio.load(tempList[i]).text().replace(ids[i], ''));
    }
    for (let i = 0; i < ids.length; i++) {
        const treeHoleItemObj = {
            id: Number(ids[i]),
            username: tempList2[i * 2],
            text: tempList2[2 * i + 1],
        } as TreeHoleItem;
        resList.push(treeHoleItemObj);
    }
    return resList;
}

const treehole = async (): Promise<void> => {
    const bot = new Bot(token.treehold);
    let lastDataId: number;
    const sleep = ((time: number): Promise<NodeJS.Timeout> => {
        return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
    });
    while (true) {
        const resp = await axios.get('http://jandan.net/treehole');
        if (resp.status === 200 && resp.data) {
            const list = parser(resp.data);
            const newLastDataId = list[0].id;
            if (lastDataId === undefined) lastDataId = list[0].id;
            if (lastDataId < newLastDataId) {
                bot.sendMessage(-1001292615621,
                    list[0].username + ': ' + list[0].text);
                lastDataId = newLastDataId;
            }
        }
        else throw new Error('resp failed');
        await sleep(30000);
    }
}

treehole();