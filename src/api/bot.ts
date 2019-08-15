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
    public constructor(token: string, url = "https://api.telegram.org/bot") {
        this.requester = axios.create({
            baseURL: url + token,
        });
        this.funcs = new Map<RegExp | string | string[], Function>();
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
        let data: undefined | BotDate;
        let new_upload_id: number;
        let old_upload_id: number;
        const sleep = ((time: number): Promise<NodeJS.Timeout> => {
            return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, time));
        });
        while (true) {
            if (data === undefined) {
                data = await this.getUpdates();
                old_upload_id = data.result[data.result.length - 1].update_id;
            }
            const newData = await this.getUpdates();
            new_upload_id = newData.result[newData.result.length - 1].update_id;
            let id: number;
            let text: string;
            if (newData.ok && newData.result) {
                if (new_upload_id !== old_upload_id) {
                    id = newData.result[newData.result.length - 1].message.from.id;
                    text = newData.result[newData.result.length - 1].message.text;
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
                            if (arg.indexOf(props[0]) !== -1) cb(id, props)
                        }
                    });
                    old_upload_id = new_upload_id;
                }
            }
            await sleep(5000);
        }
    }
    public on(match: RegExp | string | string[], cb: Function): void {
        this.funcs.set(match, cb);
    }
}

export default Bot;