import {NetClient} from 'Net/net_client';
import {NetEventType, UserProfile} from 'rpgcore-common';

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

  async sendChatMessage(message: string): Promise<void> {
    return this.client.sendMessage<void>(NetEventType.ChatMessage, message);
  }

  listenChatMessage(cb: (speaker: string, message: string) => void): void {
    this.client.listen(NetEventType.ChatMessage, cb);
  }

  async sendUserProfileRequest(): Promise<UserProfile> {
    return this.client.sendMessage<UserProfile>(NetEventType.UserProfile);
  }
}
