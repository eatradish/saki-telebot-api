import axios, { AxiosInstance } from 'axios';

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
    private funcs: Map<RegExp, Function>;
    public constructor(token: string, url = "https://api.telegram.org/bot") {
        this.requester = axios.create({
            baseURL: url + token,
        });
        this.funcs = new Map<RegExp, Function>();
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
        console.log(res.data);
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/getUpdates failed");
    }
    public async listen(): Promise<void> {
        let data;
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
            console.log(newData.result[newData.result.length - 1].message)
            if (newData.ok && newData.result) {
                if (new_upload_id !== old_upload_id) {
                    id = newData.result[newData.result.length - 1].message.from.id;
                    text = newData.result[newData.result.length - 1].message.text;
                    this.funcs.forEach((cb, reg) => {
                        const match = reg.exec(text)
                        if (match) {
                            const props = match[0].split(' ');
                            cb(id, props);
                        }
                    });
                    old_upload_id = new_upload_id;
                }
            }
            sleep(5000);
        }
    }
    public on(re: RegExp, cb: Function): void {
        this.funcs.set(re, cb);
    }
}

export default Bot;