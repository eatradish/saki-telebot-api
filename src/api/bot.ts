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
            timeout: 5000,
        });
        this.funcs = new Map<RegExp | string | string[], Function>();
        this.time = time;
    }
    public async sendMessage(chat_id: number, text: string, Option?: BotAPI.BotOptionSendMessage):
        Promise<BotAPI.BotSendMessage> {
        const res = await this.requester.post('/sendMessage', {
            chat_id,
            text,
            parse_mode: Option.parse_mode,
            disable_web_page_preview: Option.disable_web_page_preview,
            disable_notification: Option.disable_notification,
            reply_to_message_id: Option.reply_to_message_id,
            reply_markup: Option.reply_markup,
        });
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/sendMessage failed");
    }
    public async getUpdates(Option?: BotAPI.BotOptionGetUpdates): Promise<BotAPI.BotGetUpdates> {
        const res = await this.requester.post('/getUpdates', {
            offset: Option.offset,
            limit: Option.limit,
            timeout: Option.timeout,
            allow_updates: Option.allowed_updates,
        });
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
    public async listen(): Promise<void> {
        let update_id: number;
        let new_update_id: undefined | number;
        const sleep = ((time: number): Promise<NodeJS.Timeout> => {
            return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
        });
        while (true) {
            let msg;
            let data: BotAPI.BotGetUpdates;
            try {
                data = await this.getUpdates();
            }
            catch (err) {
                console.log(err);
                continue;
            }
            if (data.result.length === 100) {
                try {
                    data = await this.getUpdates({ offset: data.result[99].update_id } as BotAPI.BotOptionGetUpdates);
                }
                catch (err) {
                    console.log(err);
                    continue;
                }
            }
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
            update_id = data.result[data.result.length - 1].update_id;
            if (new_update_id === undefined) new_update_id = update_id + 1;
            if (data.ok && data.result) {
                if (update_id === new_update_id) {
                    this.execFuncs(msg);
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