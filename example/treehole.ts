import Bot from '../api/bot';
import * as Cheerio from 'cheerio';
import axios from 'axios';
import token from '../settings';
import EventInterface from '../util/EventInterface';

interface TreeHoleItem {
    id: number;
    username: string;
    text: string;
}
//这里的 parser 使用了两种 parse 方法获得信息，非常糟糕的方法，求提供一些建议
const parser = (needParse: string): TreeHoleItem[] | undefined => {
    const che = Cheerio.load(needParse);
    const html = che.html();
    const parseList = html.split("</div>");
    const parseList2 = html.split("\n");
    let start = -1;
    let start2 = -1;
    for (let i = 0; i < parseList.length; i++) {
        const isStart = parseList[i].indexOf('<ol class="commentlist" style="list-style-type: none;">') !== -1;
        if (isStart) start = i;
    }
    for (let i = 0; i < parseList2.length; i++) {
        const isStart2 = parseList2[i].indexOf('<ol class="commentlist" style="list-style-type: none;">') !== -1;
        if (isStart2) start2 = i;
    }
    const tempList = [];
    const resList = [];
    let data;
    const ids = [];
    if (start === -1 || start2 === -1 ) return;
    for (let i = start2; i < parseList2.length; i++) {
        if (parseList2[i].indexOf('<div class="cp-pagenavi">') !== -1) break;
        if (parseList2[i].indexOf('<li id="comment-') !== -1) {
            data = parseList2[i].replace('<li id="comment-', '');
            data = data.replace('">', '');
            ids.push(data);
        }
    }
    for (let i = start; i < parseList.length; i++) {
        if (parseList[i].indexOf('<div class="cp-pagenavi">') !== -1) break;
        let cheItemText = Cheerio.load(parseList[i]).text();
        if (cheItemText !== '' &&
            cheItemText !== '[举报]' &&
            cheItemText.indexOf('吐槽 [') === -1 &&
            cheItemText.indexOf('OO [') === -1 &&
            cheItemText.indexOf('XX [') === -1) {
            for (const i of ids) {
                if (cheItemText.indexOf(i) !== -1) {
                    cheItemText = cheItemText.replace(i, '');
                    break;
                }
            }
            tempList.push(cheItemText);
        }
    }
    for (let i = 0; i < ids.length; i++) {
        const id = Number(ids[i]);
        const username = tempList[i * 2];
        const text = tempList[2 * i + 1];
        const treehole_item = {
            id, username, text
        } as TreeHoleItem;
        resList.push(treehole_item);
    }
    return resList;
}

const treehole = async (): Promise<void> => {
    const bot = new Bot(token.treehold);
    const eventInterface = new EventInterface();
    eventInterface.on('info', (info) => eventInterface.info(info));
    let lastDataId: undefined | number;
    const sleep = ((time: any): Promise<NodeJS.Timeout> => {
        eventInterface.emit('info', 'sleeping');
        return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
    });
    const step = async (): Promise<void> => {
        const resp = await axios.get('http://jandan.net/treehole');
        if (resp.status === 200 && resp.data) {
            eventInterface.emit('info', 'GET treehole success');
            const list = parser(resp.data);
            if (!list) return;
            const newLastDataId = list[0].id;
            if (lastDataId === undefined) lastDataId = list[0].id;
            if (lastDataId < newLastDataId) {
                eventInterface.emit('info', 'Have new treehole!');
                bot.sendMessage(-1001292615621, list[0].username + list[0].text);
                lastDataId = newLastDataId;
            }
        }
        else throw new Error('resp failed');
    }
    while (true) {
        await step();
        await sleep(30000);
    }
}

treehole();