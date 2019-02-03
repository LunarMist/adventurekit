import {NetClient} from 'Net/net_client';
import {InitState, NetEventType} from 'rpgcore-common';

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
    this.client.sendSimpleMessage(NetEventType.ChatMessage, message);
  }

  listenChatMessage(cb: (speaker: string, message: string) => void): void {
    this.client.listen(NetEventType.ChatMessage, cb);
  }

  listenInitState(cb: (initState: InitState) => void): void {
    this.client.listen(NetEventType.InitState, cb);
  }

  async sendJoinRoomRequest(roomId: number, password: string): Promise<boolean> {
    return this.client.sendMessage<boolean>(NetEventType.JoinRoom, roomId, password);
  }

  async sendCreateRoomRequest(password: string): Promise<number> {
    return this.client.sendMessage<number>(NetEventType.CreateRoom, password);
  }
}
