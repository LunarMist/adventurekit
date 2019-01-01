import {AckCallback, ListenCallback, NetClient} from "Net/net_client";

/**
 * Enum representing 'events' for network messages
 */
enum EventType {
  ChatMessage = "ChatMessage"
}

/**
 * Used for sending all game-relevant messages between the client <--> server.
 * Uses an underlying {@link NetClient} for message transport.
 */
export class GameNetClient {
  constructor(readonly client: NetClient) {

  }

  sendChatMessage(message: string, ack: AckCallback = null): boolean {
    return this.client.sendMessage(EventType.ChatMessage, message, ack);
  }

  listenChatMessage(cb: ListenCallback): boolean {
    return this.client.listen(EventType.ChatMessage, cb);
  }
}
