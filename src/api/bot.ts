import axios, { AxiosInstance } from 'axios';

class Bot {
    private readonly requester: AxiosInstance;
    public constructor(token: string, url = "https://api.telegram.org/bot") {
        this.requester = axios.create({
            baseURL: url + token,
        });
    }
    public async sendMessage(chat_id: number, text: string) {
        const res = await this.requester.post('/sendMessage', {
            chat_id,
            text,  
        });
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/sendMessage failed");
    }
    public async getUpdates() {
        const res = await this.requester.get('/getUpdates');
        if (res.status === 200 && res.data) return res.data;
        else throw new Error("/getUpdates failed")
    }
}

export default Bot;