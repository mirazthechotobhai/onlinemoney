export type RemoteActionType =
  | 'pointer_move'
  | 'pointer_click'
  | 'direction_press'
  | 'ok_press'
  | 'back_press'
  | 'home_press'
  | 'power_toggle'
  | 'volume_change'
  | 'text_input'
  | 'text_backspace'
  | 'text_clear'
  | 'text_set'
  | 'ping'
  | 'pong'
  | 'logout';

export type DirectionKey = 'up' | 'down' | 'left' | 'right';

export interface PointerPayload {
  x: number; // percentage (0 to 100) or delta
  y: number; // percentage (0 to 100) or delta
  dx?: number;
  dy?: number;
}

export interface RemoteMessage {
  id: string;
  type: RemoteActionType;
  payload?: {
    direction?: DirectionKey;
    pointer?: PointerPayload;
    text?: string;
    char?: string;
    volumeDelta?: number;
    timestamp: number;
  };
  sender: 'remote' | 'main';
}

export interface ActivityItem {
  id: string;
  text: string;
  timestamp: number;
  type: 'pointer' | 'key' | 'action' | 'system';
}

export interface RemoteSession {
  code: string; // e.g. 6-character code
  userId: string;
  userEmail?: string;
  userDisplayName?: string;
  userPhoto?: string;
  status: 'waiting' | 'active' | 'disconnected' | 'logged_out';
  createdAt: number;
  lastActive: number;
  lastMessage?: RemoteMessage;
}

