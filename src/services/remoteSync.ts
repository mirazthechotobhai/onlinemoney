import { RemoteMessage } from '../types';
import { sendRemoteActionToFirebase } from './sessionService';

const CHANNEL_NAME = 'web_remote_controller_channel';
const STORAGE_KEY = 'web_remote_controller_storage_event';

type MessageHandler = (msg: RemoteMessage) => void;

class RemoteSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private lastMessageId: string = '';
  private activeFirebaseCode: string | null = null;

  constructor() {
    this.initChannel();
    this.initStorageFallback();
  }

  public setActiveFirebaseCode(code: string | null) {
    this.activeFirebaseCode = code ? code.trim().toUpperCase() : null;
  }

  public getActiveFirebaseCode(): string | null {
    return this.activeFirebaseCode;
  }


  private initChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const msg = event.data as RemoteMessage;
          if (msg && msg.id !== this.lastMessageId) {
            this.lastMessageId = msg.id;
            this.notify(msg);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or blocked, falling back to storage:', err);
      }
    }
  }

  private initStorageFallback() {
    if (typeof window !== 'undefined') {
      this.storageListener = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const msg = JSON.parse(e.newValue) as RemoteMessage;
            if (msg && msg.id !== this.lastMessageId) {
              this.lastMessageId = msg.id;
              this.notify(msg);
            }
          } catch {
            // ignore parse errors
          }
        }
      };
      window.addEventListener('storage', this.storageListener);
    }
  }

  public send(msgWithoutId: Omit<RemoteMessage, 'id'>) {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullMsg: RemoteMessage = {
      ...msgWithoutId,
      id,
    };
    this.lastMessageId = id;

    // Send via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(fullMsg);
      } catch (e) {
        console.error('Error posting to BroadcastChannel:', e);
      }
    }

    // Send via localStorage fallback so different windows/tabs also catch it
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullMsg));
      } catch {
        // quota or privacy block
      }
    }

    // If there is an active Firebase paired session code, push message to Firestore
    if (this.activeFirebaseCode && fullMsg.sender === 'remote') {
      sendRemoteActionToFirebase(this.activeFirebaseCode, fullMsg);
    }

    return fullMsg;
  }

  public subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notify(msg: RemoteMessage) {
    this.listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        console.error('Error in message listener:', err);
      }
    });
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
    }
    this.listeners.clear();
  }
}

export const remoteSync = new RemoteSyncService();
