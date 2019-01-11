import {ListenCallback, NetClient} from 'Net/net_client';

/**
 * Enum representing 'events' for network messages
 */
enum EventType {
  ChatMessage = 'ChatMessage'
}

/**
 * Used for sending all game-relevant messages between the client <--> server.
 * Uses an underlying {@link NetClient} for message transport.
 */
export class GameNetClient {
  constructor(readonly client: NetClient) {

  }

  sendChatMessage(message: string): void {
    this.client.sendMessage(EventType.ChatMessage, message);
  }

  listenChatMessage(cb: ListenCallback): void {
    this.client.listen(EventType.ChatMessage, cb);
  }
}
