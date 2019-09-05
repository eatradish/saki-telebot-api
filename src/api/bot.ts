import * as Axios from 'axios';
import { isRegExp, isString } from 'util';
import * as BotAPI from './bot_interface';
import * as BotGetUpdatesResult from './message';
import ConsoleInterface from './ConsoleInterface';

class Bot {
    private readonly requester: Axios.AxiosInstance;
    public readonly name: string;
    private funcs: Map<Array<string | RegExp>, Function>;
    private time: number;
    private evenList: Array<string | RegExp>[];
    private consoleTnterface: ConsoleInterface;
    public constructor(token: string, url = "https://api.telegram.org/bot", time = 1000) {
        this.requester = Axios.default.create({
            baseURL: url + token,
            timeout: 10000,
        });
        this.funcs = new Map<Array<string | RegExp>, Function>();
        this.time = time;
        this.consoleTnterface = new ConsoleInterface();
        this.consoleTnterface.on('info', (info) => this.consoleTnterface.info(info));
        this.consoleTnterface.on('error', (error) => this.consoleTnterface.error(error));
    }
    public async getMe(): Promise<BotAPI.BotGetMe> {
        const res = await this.requester.get('/getMe');
        if (res.status === 200 && res.data) {
            this.consoleTnterface.emit('info', 'GET /getMe success');
            return res.data;
        }
        else {
            const err = "/getMe failed";
            this.consoleTnterface.emit('error', err);
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
            this.consoleTnterface.emit('info', 'POST /sendMessage success');
            return res.data;
        }
        else {
            const err = "/sendMessage failed";
            this.consoleTnterface.emit('info', err);
            throw new Error(err);
        }
    }
    public async getUpdates(option?: BotAPI.BotOptionGetUpdates): Promise<BotAPI.BotGetUpdates> {
        if (!option) option = {};
        const res = await this.requester.post('/getUpdates', option);
        if (res.status === 200 && res.data) {
            this.consoleTnterface.emit('info', 'POST /getupdates success');
            return res.data;
        }
        else{
            const err = "/getUpdates failed";
            this.consoleTnterface.emit('error', err);
            throw new Error(err);
        }
    }
    public async execFuncs(msg: BotAPI.BotGetUpdatesResultMessage |
        BotAPI.BotGetUpdatesResultChannelPost |
        BotAPI.BotGetUpdatesResultEditedMessage): Promise<void> {
        const text = msg.text;
        let props: string[];
        let match;
        for (const even of this.evenList) {
            for (const e of even) {
                if (isRegExp(e) && e.exec(text)) {
                    props = match[0].split(' ');
                    match = even
                    break;
                }
                else if (isString(e) && text.indexOf(e) !== -1) {
                    props = text.split(' ');
                    match = even;
                    break;
                }
            }
            if (props && match) {
                this.funcs.get(match).call(msg, props);
                this.consoleTnterface.emit('info', 'exec function');
            }
        }
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
                data = await this.getUpdates({ offset: data.result[99].update_id });
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
            msg = new BotGetUpdatesResult.ChannelPostMessage(msg, this);
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
        this.consoleTnterface.emit('info', 'listening');
        let update_id: number;
        let new_update_id: undefined | number;
        const sleep = ((time: number): Promise<NodeJS.Timeout> => {
            this.consoleTnterface.emit('info', 'sleeping...');
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
    public on(even: RegExp | string | Array<string | RegExp>, fn: Function): void {
        if (isRegExp(even)) even = [even] as Array<string | RegExp>;
        else if (isString(even)) even = [even] as Array<string | RegExp>;
        this.evenList.push(even);
        this.funcs.set(even, fn);
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