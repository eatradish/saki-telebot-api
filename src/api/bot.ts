import axios, { AxiosInstance } from 'axios';
import { isRegExp, isString } from 'util';
import  * as BotAPI from './bot_interface';

class Bot {
    private readonly requester: AxiosInstance;
    private funcs: Map<RegExp | string | string[], Function>;
    private time: number;
    public constructor(token: string, url = "https://api.telegram.org/bot", time = 1000) {
        this.requester = axios.create({
            baseURL: url + token,
        });
        this.funcs = new Map<RegExp | string | string[], Function>();
        this.time = time;
    }
    public async sendMessage(chat_id: number, text: string): Promise<BotAPI.BotSendMessage> {
        const res = await this.requester.post('/sendMessage', {
            chat_id,
            text,
        });
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/sendMessage failed");
    }
    public async getUpdates(offset?: number): Promise<BotAPI.BotGetUpdates> {
        const res = await this.requester.post('/getUpdates', {
            offset,
        });
        if (res.status === 200 && res.data){
            return res.data;
        }
        else throw new Error("/getUpdates failed");
    }
    public async listen(): Promise<void> {
        let update_id: number;
        let new_update_id: undefined | number;
        const sleep = ((time: number): Promise<NodeJS.Timeout> => {
            return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
        });
        while (true) {
            let msg: BotAPI.BotGetUpdatesMessage | BotAPI.BotGetUpdatesChannelPost;
            let data = await this.getUpdates();
            if (data.result.length === 100) {
                data = await this.getUpdates(data.result[50].update_id);
            }
            const newDate = data.result[data.result.length - 1];
            if (newDate.message !== undefined) msg = data.result[data.result.length - 1].message;
            else if (newDate.channel_post !== undefined) msg = data.result[data.result.length - 1].channel_post
            update_id = data.result[data.result.length - 1].update_id;
            if (new_update_id === undefined) new_update_id = update_id + 1;
            if (data.ok && data.result) {
                if (update_id === new_update_id) {
                    this.funcs.forEach((cb, arg) => {
                        let match: RegExpExecArray;
                        let props: string[];
                        const text = msg.text;
                        if (isRegExp(arg)) {
                            match = arg.exec(text);
                            if (match) props = match[0].split(' ');
                            cb(msg, props)
                        }
                        else if (isString(arg)) {
                            if (text.split(' ')[0] === arg) {
                                props = text.split(' ');
                                cb(msg, props);
                            }
                        }
                        else {
                            props = text.split(' ');
                            if (arg.indexOf(props[0]) !== -1) cb(msg, props);
                        }
                    });
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
            else if(index.edited_message) continue;
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