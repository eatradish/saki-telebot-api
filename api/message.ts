import * as BotAPI from './bot_interface';
import Bot from './bot';

class Messages {
    public readonly message_id: number;
    public readonly chat: BotAPI.BotGetUpdatesResultMessageChat | BotAPI.BotGetUpdatesResultChannelPostChat;
    public readonly date: number;
    public text?: string;
    public photo?: BotAPI.BotGetUpdatesResultMessagePhoto[];
    public sticker?: BotAPI.BotGetUpdatesResultMessageSticker;
    public caption?: string;
    protected readonly bot: Bot;
    public constructor(obj: BotAPI.BotGetUpdatesResultMessage | BotAPI.BotGetUpdatesResultChannelPost, bot: Bot) {
        this.bot = bot;
        this.message_id = obj.message_id;
        this.chat = obj.chat;
        this.date = obj.date;
    }
    public async replyText(text: string): Promise<BotAPI.BotSendMessage | undefined> {
        return await this.bot.sendMessage(this.chat.id, text);
    }
}

export class ChannelPostMessage extends Messages {
    public readonly type: string;
    public constructor(obj: BotAPI.BotGetUpdatesResultChannelPost, bot: Bot) {
        super(obj, bot);
        if (obj.text) this.text = obj.text;
        else if (obj.photo) this.photo = obj.photo;
        else if (obj.sticker) this.sticker = obj.sticker;
        if (obj.caption) this.caption = obj.caption;
        this.type = 'channel';
    }
}

export class Message extends Messages {
    public readonly from: BotAPI.BotGetUpdatesResultMessageFrom;
    public readonly type: string;
    public constructor(obj: BotAPI.BotGetUpdatesResultMessage, bot: Bot) {
        super(obj, bot);
        this.from = obj.from;
        if (obj.text) this.text = obj.text;
        else if (obj.photo) this.photo = obj.photo;
        else if (obj.sticker) this.sticker = obj.sticker;
        if (obj.caption) this.caption = obj.caption;
        this.type = 'message';
    }
}

export class EditedMessage extends Messages {
    public readonly edit_date: number;
    public text: string;
    public readonly type: string;
    public constructor(obj: BotAPI.BotGetUpdatesResultEditedMessage, bot: Bot) {
        super(obj, bot);
        this.edit_date = obj.edit_date;
        this.text = obj.text;
        this.type = 'edited_message';
    }
}
