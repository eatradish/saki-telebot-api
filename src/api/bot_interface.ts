export interface BotGetUpdates {
    ok: boolean;
    result: BotGetUpdatesResult[];
}

export interface BotSendMessage {
    ok: boolean;
    result: BotSendMessageResult;
}

export interface BotSendMessageResult {
    message_id: boolean;
    from: BotGetUpdatesMessageFrom;
    chat: BotGetUpdatesMessageChat;
    data: number;
    text: string;
}

export interface BotGetUpdatesResult {
    update_id: number;
    message?: BotGetUpdatesMessage;
    channel_post?: BotGetUpdatesChannelPost;
    edited_message?: {};
}

export interface BotGetUpdatesMessage {
    message_id: number;
    from: BotGetUpdatesMessageFrom;
    chat: BotGetUpdatesMessageChat;
    date: number;
    text: string;
}

export interface BotGetUpdatesMessageChat {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    type: string;
    title?: string;
}

export interface BotGetUpdatesMessageFrom {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username: string;
    language_code?: string;
}

export interface BotGetUpdatesChannelPost {
    message_id: number;
    chat: BotGetUpdatesChannelPostChat;
    data: number;
    text: string;
}

export interface BotGetUpdatesChannelPostChat {
    id: number;
    title: string;
    username: string;
    type: string;
}