import * as MessageObject from './message';

export interface BotGetUpdates {
    ok: boolean;
    result: BotGetUpdatesResult[];
}

export interface BotSendMessage {
    ok: boolean;
    result: BotSendMessageResult;
}

export interface BotOtherOptionSendMessage {
    parse_mode?: string;
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
    reply_to_message_id?: number;
    reply_markup?: {};
}

export interface BotOptionSendMessage {
    chat_id: number;
    text: string;
    parse_mode?: string;
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
    reply_to_message_id?: number;
    reply_markup?: {};
}

export interface BotOptionGetUpdates {
    offset?: number;
    limit?: number;
    timeout?: number;
    allowed_updates?: string[];
}

export interface BotSendMessageResult {
    message_id: boolean;
    from: BotGetUpdatesResultMessageFrom;
    chat: BotGetUpdatesResultMessageChat;
    data: number;
    text: string;
}

export interface BotGetUpdatesResult {
    update_id: number;
    message?: BotGetUpdatesResultMessage;
    channel_post?: BotGetUpdatesResultChannelPost;
    edited_message?: BotGetUpdatesResultEditedMessage;
    reply_to_message?: BotGetUpdatesResultReplyToMessage;
}

export interface BotGetUpdatesResultEditedMessage {
    message_id: number;
    from: BotGetUpdatesResultMessageFrom;
    chat: BotGetUpdatesResultMessageChat;
    date: number;
    edit_date: number;
    text: string;
}

export interface BotGetUpdatesResultMessage {
    message_id: number;
    from: BotGetUpdatesResultMessageFrom;
    chat: BotGetUpdatesResultMessageChat;
    date: number;
    text?: string;
    photo?: BotGetUpdatesResultMessagePhoto[];
    sticker?: BotGetUpdatesResultMessageSticker;
    caption?: string;
}

export interface BotGetUpdatesResultMessageSticker {
    width: number;
    height: number;
    emoji: string;
    set_name: string;
    is_animated: boolean;
    thumb: BotGetUpdatesResultMessagePhoto;
    file_id: string;
    file_size: number;
}

export interface BotGetUpdatesResultMessagePhoto {
    file_id: string;
    file_size: number;
    width: number;
    height: number;
}

export interface BotGetUpdatesResultMessageChat {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    type: string;
    title?: string;
    all_members_are_administrators?: boolean;
}

export interface BotGetUpdatesResultMessageFrom {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username: string;
    language_code?: string;
}

export interface BotGetUpdatesResultChannelPost {
    message_id: number;
    chat: BotGetUpdatesResultChannelPostChat;
    date: number;
    text?: string;
    photo?: BotGetUpdatesResultMessagePhoto[];
    sticker?: BotGetUpdatesResultMessageSticker;
    caption?: string;
}

export interface BotGetUpdatesResultChannelPostChat {
    id: number;
    title: string;
    username: string;
    type: string;
}

export interface GetLastMsg {
    msg: MessageObject.default;
    update_id: number;
}

export interface BotGetMe {
    ok: boolean;
    result: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username: string;
    };
}

export interface BotGetUpdatesResultReplyToMessage {
    message_id: number;
    from: BotGetUpdatesResultMessageFrom;
    chat: BotGetUpdatesResultMessageChat;
    text: string;
}