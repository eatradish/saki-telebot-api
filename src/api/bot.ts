import axios, { AxiosInstance } from 'axios';
import { isRegExp, isString } from 'util';

interface BotDate {
    ok: boolean;
    result: BotDateResult[];
}

interface BotDateResult {
    update_id: number;
    message: BotDateResultMessage;
}

interface BotDateResultMessage {
    message_id: number;
    from: BotDateResultMessageFrom;
    chat: {};
    date: number;
    text: string;
}

interface BotDateResultMessageFrom {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name: string;
    username: string;
    language_code: string;
}

class Bot {
    private readonly requester: AxiosInstance;
    private funcs: Map<RegExp | string | string[], Function>;
    private time: number;
    public constructor(token: string, url = "https://api.telegram.org/bot", time = 1000){
        this.requester = axios.create({
            baseURL: url + token,
        });
        this.funcs = new Map<RegExp | string | string[], Function>();
        this.time = time;
    }
    public async sendMessage(chat_id: number, text: string): Promise<BotDate> {
        const res = await this.requester.post('/sendMessage', {
            chat_id,
            text,
        });
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/sendMessage failed");
    }
    public async getUpdates(): Promise<BotDate> {
        const res = await this.requester.get('/getUpdates');
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/getUpdates failed");
    }
    public async listen(): Promise<void> {
        let update_id: number;
        let new_update_id: undefined | number;
        const sleep = ((time: number): Promise<NodeJS.Timeout> => {
            return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
        });
        while (true) {
            const data = await this.getUpdates();
            update_id = data.result[data.result.length - 1].update_id;
            if (new_update_id === undefined) new_update_id = update_id + 1;
            let id: number;
            let text: string;
            if (data.ok && data.result) {
                if (update_id === new_update_id) {
                    id = data.result[data.result.length - 1].message.from.id;
                    text = data.result[data.result.length - 1].message.text;
                    this.funcs.forEach((cb, arg) => {
                        let match: RegExpExecArray;
                        let props: string[];
                        if (isRegExp(arg)) {
                            match = arg.exec(text);
                            if (match) props = match[0].split(' ');
                            cb(id, props);
                        }
                        else if (isString(arg)) {
                            if (text.split(' ')[0] === arg) {
                                props = text.split(' ');
                                cb(id, props);
                            }
                        }
                        else {
                            props = text.split(' ');
                            if (arg.indexOf(props[0]) !== -1) cb(id, props);
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
}

export default Bot;