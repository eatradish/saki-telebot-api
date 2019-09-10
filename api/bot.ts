import * as Axios from 'axios';
import { isRegExp, isString } from 'util';
import * as BotAPI from './bot_interface';
import * as BotGetUpdatesResult from './message';
import EventInterface from '../util/EventInterface';
import axiosRetry from 'axios-retry';

export default class Bot {
    private readonly requester: Axios.AxiosInstance;
    private time: number;
    private evenList: Array<string | RegExp>[] = [];
    private funcList: Function[] = [];
    private eventInterface = new EventInterface();
    public constructor(token: string, url = "https://api.telegram.org/bot", time = 3000) {
        this.requester = Axios.default.create({
            baseURL: url + token,
            timeout: 10000,
        });
        this.time = time;
        this.eventInterface.on('info', (info) => this.eventInterface.info(info));
        this.eventInterface.on('error', (error) => this.eventInterface.error(error));
        axiosRetry(this.requester, { retries: 3 });
    }
    public async getMe(): Promise<BotAPI.BotGetMe> {
        const res = await this.requester.get('/getMe');
        if (res.status === 200 && res.data) {
            this.eventInterface.emit('info', 'GET /getMe success');
            return res.data;
        }
        else {
            const err = "/getMe failed";
            this.eventInterface.emit('error', err);
            throw new Error(err);
        }
    }
    public async sendMessage(chat_id: number, text: string, option?: BotAPI.BotOtherOptionSendMessage):
        Promise<BotAPI.BotSendMessage> {
        const reqData: BotAPI.BotOptionSendMessage = {
            chat_id,
            text,
        };
        if (option) {
            for (const i in option) {
                if (i === 'parse_mode') reqData.parse_mode = option[i];
                else if (i === 'disable_web_page_preview') reqData.disable_web_page_preview = option[i];
                else if (i === 'disable_notification') reqData.disable_notification = option[i];
                else if (i === 'reply_to_message_id') reqData.reply_to_message_id = option[i];
                else if (i === 'reply_markup') reqData.reply_markup = option[i];
                else continue;
            }
        }
        const res = await this.requester.post('/sendMessage', reqData);
        if (res.status === 200 && res.data) {
            this.eventInterface.emit('info', 'POST /sendMessage success');
            return res.data;
        }
        else {
            const err = "/sendMessage failed";
            this.eventInterface.emit('info', err);
            throw new Error(err);
        }
    }
    public async getUpdates(option?: BotAPI.BotOptionGetUpdates): Promise<BotAPI.BotGetUpdates> {
        if (!option) option = {};
        const res = await this.requester.post('/getUpdates', option);
        if (res.status === 200 && res.data) {
            this.eventInterface.emit('info', 'POST /getupdates success');
            return res.data;
        }
        else {
            const err = "/getUpdates failed";
            this.eventInterface.emit('error', err);
            throw new Error(err);
        }
    }
    public async execFuncs(msg: BotGetUpdatesResult.default): Promise<void> {
        const type = msg.getMessageType();
        const text = msg.getMessageText();
        const photo = msg.getMessagePhoto();
        const sticker = msg.getMessageSticker();
        const caption = msg.getMessageCaption();
        let props: any[] = [];
        const funcMatchIndexList: number[] = [];
        for (let i = 0; i < this.evenList.length; i++) {
            for (const e of this.evenList[i]) {
                if (isRegExp(e) && type === 'text' && text) {
                    const match = e.exec(text);
                    if (match) {
                        const input = match[0];
                        props.push(input.split('')[0])
                        props.push(input.split('').slice(1).slice(1).join(''));
                        funcMatchIndexList.push(i);
                    }
                }
                else if (isString(e) && text && text.indexOf(e) !== -1) {
                    props = [text];
                    funcMatchIndexList.push(i);
                }
                else if (isString(e) && text && e === 'text') {
                    props = [text];
                    funcMatchIndexList.push(i);
                }
                else if (isString(e) && photo && !sticker && e === 'photo') {
                    props = [photo];
                    if (caption) props.push(caption);
                    funcMatchIndexList.push(i);
                }
                else if (isString(e) && sticker && e === 'sticker') {
                    props = [sticker];
                    funcMatchIndexList.push(i);
                }
                else if (isString(e) && e === 'edit' && type === e) {
                    props = [text];
                    funcMatchIndexList.push(i);
                }
                else if (isString(e) && e === 'reply' && type === e) {
                    props = [text];
                    funcMatchIndexList.push(i);
                }
            }
        }
        if (props.length !== 0 && funcMatchIndexList.length !== 0) {
            for (const index of funcMatchIndexList) {
                const fn = this.funcList[index];
                if (fn) fn(msg, props);
            }
        }
    }
    private async getMsg(): Promise<BotAPI.BotGetUpdates> {
        let data = await this.getUpdates();
        if (data && data.result && data.result.length === 100) {
            data = await this.getUpdates({ offset: data.result[99].update_id });
        }
        return data;
    }
    private getLastMsg(data: BotAPI.BotGetUpdates): BotAPI.GetLastMsg {
        if (data.result && data.result.length === 0) return {} as BotAPI.GetLastMsg;
        const msg = new BotGetUpdatesResult.default(data.result[data.result.length - 1], this);
        return {
            msg,
            update_id: msg.obj.update_id,
        };
    }
    public async listen(): Promise<void> {
        this.eventInterface.emit('info', 'listening');
        let update_id: number;
        let new_update_id: undefined | number;
        const sleep = (time: any): Promise<NodeJS.Timeout> => {
            this.eventInterface.emit('info', 'sleeping...');
            return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
        }
        const step = async (): Promise<void> => {
            const data = await this.getMsg();
            if (!data) return;
            const lastData = this.getLastMsg(data);
            if (!lastData) return;
            update_id = lastData.update_id;
            if (!new_update_id) new_update_id = update_id + 1;
            if (data.ok && data.result) {
                if (update_id === new_update_id) {
                    this.execFuncs(lastData.msg);
                    new_update_id += 1;
                    this.eventInterface.emit('info', 'exec function');
                }
            }
        }
        while (1) {
            await step();
            await sleep(this.time);
        }
    }
    public on(even: RegExp | string | Array<string | RegExp>, fn: Function): void {
        if (isRegExp(even)) even = [even] as Array<string | RegExp>;
        else if (isString(even)) even = [even] as Array<string | RegExp>;
        if (this.funcList.indexOf(fn) !== -1 && this.evenList.indexOf(even) !== -1) {
            const err = 'function already exist';
            this.eventInterface.emit('error', err);
            throw new Error(err);
        }
        else {
            this.funcList.push(fn);
            this.evenList.push(even);
        }
    }
    public async getUserList(): Promise<Map<number, string>> {
        const data = await this.getUpdates();
        const map = new Map<number, string>();
        let name: string | undefined;
        let id = -1;
        if (!data) throw new Error('no data');
        for (const index of data.result) {
            let type: string;
            if (index.channel_post) type = 'channel';
            else if (index.edited_message) continue;
            else if (index.message) type = index.message.chat.type;
            else throw new Error('no data');
            if (index.message) {
                if (type === 'group' || type === 'supergroup') {
                    name = index.message.chat.title;
                    id = index.message.chat.id;
                }
                else if (type === 'private') {
                    name = index.message.chat.username;
                    id = index.message.chat.id;
                }
            }
            else if (index.channel_post) {
                name = index.channel_post.chat.title;
                id = index.channel_post.chat.id;
            }
            else continue;
            if (id !== -1 && !map.get(id) && name) map.set(id, name);
        }
        return map;
    }
}
