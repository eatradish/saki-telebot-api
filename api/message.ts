import * as BotAPI from './bot_interface';
import Bot from './bot';

export default class Message {
    protected bot: Bot;
    public obj: BotAPI.BotGetUpdatesResult;
    public constructor(obj: BotAPI.BotGetUpdatesResult, bot: Bot) {
        this.bot = bot;
        this.obj = obj;
    }
    public async replyText(text: string): Promise<BotAPI.BotSendMessage> {
        let chatId: number;
        if (this.obj.message) chatId = this.obj.message.chat.id;
        else if (this.obj.edited_message) chatId = this.obj.edited_message.chat.id;
        else if (this.obj.channel_post) chatId = this.obj.channel_post.chat.id;
        else throw new Error('This message no chat id');
        return await this.bot.sendMessage(chatId, text);
    }
    public getMessageType(): string {
        if (this.obj.reply_to_message) return 'reply';
        else if (this.obj.message) {
            if (this.obj.message.text) return 'text';
            else if (this.obj.message.photo && !this.obj.message.sticker) return 'photo';
            else if (this.obj.message.sticker) return 'sticker';
            else throw new Error('No type');
        }
        else if (this.obj.channel_post) {
            if (this.obj.channel_post.text) return 'text';
            else if (this.obj.channel_post.photo && !this.obj.channel_post.sticker) return 'photo';
            else if (this.obj.channel_post.sticker) return 'sticker';
            else throw new Error('No type');
        }
        else if (this.obj.edited_message) return 'edit';
        else throw new Error('No type');
    }
    public getMessageText(): string | undefined {
        if (this.obj.message && this.obj.message.text) return this.obj.message.text;
        else if (this.obj.channel_post && this.obj.channel_post.text) return this.obj.channel_post.text;
        else if (this.obj.edited_message) return this.obj.edited_message.text;
    }
    public getMessagePhoto(): BotAPI.BotGetUpdatesResultMessagePhoto | undefined {
        if (this.obj.message && this.obj.message.photo) {
            const photo = this.obj.message.photo[this.obj.message.photo.length - 1];
            return photo;
        }
        else if (this.obj.channel_post && this.obj.channel_post.photo) {
            const photo = this.obj.channel_post.photo[this.obj.channel_post.photo.length - 1];
            return photo;
        }
    }
    public getMessageSticker(): BotAPI.BotGetUpdatesResultMessageSticker | undefined {
        if (this.obj.message && this.obj.message.sticker) return this.obj.message.sticker;
        else if (this.obj.channel_post && this.obj.channel_post.sticker) return this.obj.channel_post.sticker;
    }
    public getMessageCaption(): string | undefined {
        if (this.obj.message && this.obj.message.caption) return this.obj.message.caption;
        else if (this.obj.channel_post && this.obj.channel_post.caption) return this.obj.channel_post.caption;
    }
}