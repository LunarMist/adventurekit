import {NetClient} from 'Net/net_client';
import {NetEventType} from 'rpgcore-common';


/**
 * Used for sending all game-relevant messages between the client <--> server.
 * Uses an underlying {@link NetClient} for message transport.
 */
export class GameNetClient {
  constructor(private readonly client: NetClient) {

  }

  connect(): void {
    this.client.open();
  }

  disconnect(): void {
    this.client.close();
  }

  sendChatMessage(message: string): void {
    this.client.sendMessage(NetEventType.ChatMessage, message);
  }

  listenChatMessage(cb: (speaker: string, message: string) => void): void {
    this.client.listen(NetEventType.ChatMessage, cb);
  }

  listenUserProfile(cb: (username: string) => void): void {
    this.client.listen(NetEventType.UserProfile, cb);
  }
}
