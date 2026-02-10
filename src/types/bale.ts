// Bale Bot API Types
// Based on Bale Bot API documentation (identical to Telegram Bot API structure)

export interface BaleUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface BaleChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface BaleMessage {
  message_id: number;
  date: number;
  chat: BaleChat;
  from?: BaleUser;
  text?: string;
  reply_to_message?: BaleMessage;
  forward_from?: BaleUser;
  forward_date?: number;
}

export interface BaleUpdate {
  update_id: number;
  message?: BaleMessage;
  edited_message?: BaleMessage;
  channel_post?: BaleMessage;
  edited_channel_post?: BaleMessage;
}

export interface BaleSendMessageResponse {
  ok: boolean;
  result?: BaleMessage;
  error_code?: number;
  description?: string;
}

export interface BaleGetWebhookInfoResponse {
  ok: boolean;
  result?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
    allowed_updates?: string[];
  };
}
