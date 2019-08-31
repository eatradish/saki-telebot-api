import axios, { AxiosInstance } from 'axios';
import { isRegExp, isString } from 'util';
import * as BotAPI from './bot_interface';
import * as BotGetUpdatesResult from './message';

class Bot {
    private readonly requester: AxiosInstance;
    private funcs: Map<RegExp | string | string[], Function>;
    private time: number;
    public constructor(token: string, url = "https://api.telegram.org/bot", time = 1000) {
        this.requester = axios.create({
            baseURL: url + token,
            timeout: 10000,
        });
        this.funcs = new Map<RegExp | string | string[], Function>();
        this.time = time;
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
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/sendMessage failed");
    }
    public async getUpdates(option?: BotAPI.BotOptionGetUpdates): Promise<BotAPI.BotGetUpdates> {
        let res;
        if (Option) res = await this.requester.post('/getUpdates', option);
        else res = await this.requester.post('/getUpdates');
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/getUpdates failed");
    }
    public async execFuncs(msg: BotAPI.BotGetUpdatesResultMessage |
        BotAPI.BotGetUpdatesResultChannelPost |
        BotAPI.BotGetUpdatesResultEditedMessage): Promise<void> {
        this.funcs.forEach((cb, arg) => {
            const text = msg.text;
            let match: RegExpExecArray;
            let props: string[];
            if (isRegExp(arg)) {
                match = arg.exec(text);
                if (match) props = match[0].split(' ');
            }
            else if (isString(arg) && text.split(' ')[0] === arg) props = text.split(' ');
            else {
                props = text.split(' ');
                if (arg.indexOf(props[0]) === -1) return;
            }
            cb(msg, props);
        });
    }
    private async getMsg(): Promise<BotAPI.BotGetUpdates> {
        let data: BotAPI.BotGetUpdates;
        try {
            data = await this.getUpdates();
        }
        catch (err) {
            console.log(err);
        }
        if (data.result.length === 100) {
            try {
                data = await this.getUpdates({ offset: data.result[99].update_id } as BotAPI.BotOptionGetUpdates);
            }
            catch (err) {
                console.log(err);
            }
        }
        return data;
    }
    private getLastMsg(data: BotAPI.BotGetUpdates): BotAPI.GetLastMsg {
        let msg;
        const newDate = data.result[data.result.length - 1];
        if (newDate.message !== undefined) {
            msg = newDate.message;
            msg = new BotGetUpdatesResult.Message(msg, this);
        }
        else if (newDate.channel_post !== undefined) {
            msg = newDate.channel_post;
            msg = new BotGetUpdatesResult.ChannelPost(msg, this);
        }
        else if (newDate.edited_message !== undefined) {
            msg = newDate.edited_message;
            msg = new BotGetUpdatesResult.EditedMessage(msg, this);
        }
        return {
            msg,
            update_id: newDate.update_id,
        };
    }
    public async listen(): Promise<void> {
        let update_id: number;
        let new_update_id: undefined | number;
        const sleep = ((time: number): Promise<NodeJS.Timeout> => {
            return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
        });
        while (true) {
            const data = await this.getMsg();
            const lastData = this.getLastMsg(data);
            update_id = lastData.update_id;
            if (new_update_id === undefined) new_update_id = update_id + 1;
            if (data.ok && data.result) {
                if (update_id === new_update_id) {
                    this.execFuncs(lastData.msg);
                    new_update_id += 1;
                }
            }
            await sleep(this.time);
        }
    }
    public on(match: RegExp | string | string[], cb: Function): void {
        this.funcs.set(match, cb);
    }
    public async getUserList(): Promise<Map<number, string> | undefined> {
        const data = await this.getUpdates();
        const map = new Map<number, string>();
        let name: string;
        let id: number;
        for (const index of data.result) {
            let type: string;
            if (index.channel_post) type = 'channel';
            else if (index.edited_message) continue;
            else type = index.message.chat.type;
            if (type === 'group' || type === 'supergroup') {
                name = index.message.chat.title;
                id = index.message.chat.id;
            }
            else if (type === 'private') {
                name = index.message.chat.username;
                id = index.message.chat.id;
            }
            else if (type === 'channel') {
                name = index.channel_post.chat.title;
                id = index.channel_post.chat.id;
            }
            else continue;
            if (map.get(id) === undefined) map.set(id, name);
        }
        return map;
    }
}


export default Bot;