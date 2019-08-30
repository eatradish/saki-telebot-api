import * as BotAPI from './bot_interface';
import Bot from './bot';

export class Message implements BotAPI.BotGetUpdatesResultMessage {
    public readonly message_id: number;
    public readonly from: BotAPI.BotGetUpdatesResultMessageFrom;
    public readonly chat: BotAPI.BotGetUpdatesResultMessageChat;
    public readonly date: number;
    public readonly text?: string;
    public readonly photo?: BotAPI.BotGetUpdatesResultMessagePhoto[];
    public readonly sticker?: BotAPI.BotGetUpdatesResultMessageSticker;
    public readonly caption?: string;
    private readonly bot: Bot;
    public constructor(obj: BotAPI.BotGetUpdatesResultMessage, bot: Bot) {
        this.bot = bot;
        this.message_id = obj.message_id;
        this.from = obj.from;
        this.chat = obj.chat;
        this.date = obj.date;
        if (obj.text) this.text = obj.text;
        else if (obj.photo) this.photo = obj.photo;
        else if (obj.sticker) this.sticker = obj.sticker;
        if (obj.caption) this.caption = obj.caption;
    }
    public async replyText(text: string): Promise<BotAPI.BotSendMessage> {
        return await this.bot.sendMessage(this.from.id, text);
    }
}

export class ChannelPost implements BotAPI.BotGetUpdatesResultChannelPost {
    public readonly message_id: number;
    public readonly chat: BotAPI.BotGetUpdatesResultChannelPostChat;
    public readonly data: number;
    public readonly text?: string;
    public readonly photo?: BotAPI.BotGetUpdatesResultMessagePhoto[];
    public readonly sticker?: BotAPI.BotGetUpdatesResultMessageSticker;
    public readonly caption?: string;
    private readonly bot: Bot;
    public constructor(obj: BotAPI.BotGetUpdatesResultChannelPost, bot: Bot) {
        this.bot = bot;
        this.message_id = obj.message_id;
        this.chat = obj.chat;
        if (obj.text) this.text = obj.text;
        else if (obj.photo) this.photo = obj.photo;
        else if (obj.sticker) this.sticker = obj.sticker;
        if (obj.caption) this.caption = obj.caption;
    }
    public async replyText(text: string): Promise<BotAPI.BotSendMessage> {
        return await this.bot.sendMessage(this.chat.id, text);
    }
}

export class EditedMessage implements BotAPI.BotGetUpdatesResultEditedMessage {
    public readonly message_id: number;
    public readonly from: BotAPI.BotGetUpdatesResultMessageFrom;
    public readonly chat: BotAPI.BotGetUpdatesResultMessageChat;
    public readonly date: number;
    public readonly edit_date: number;
    public readonly text: string;
    private readonly bot: Bot;
    public constructor(obj: BotAPI.BotGetUpdatesResultEditedMessage, bot: Bot) {
        this.bot = bot;
        this.message_id = obj.message_id;
        this.from = obj.from;
        this.chat = obj.chat;
        this.date = obj.date;
        this.edit_date = obj.edit_date;
        this.text = obj.text;
    }
    public async replyText(text: string): Promise<BotAPI.BotSendMessage> {
        return await this.bot.sendMessage(this.from.id, text);
    }
}
