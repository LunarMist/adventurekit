import { ClientSentEvent, ServerSentEvent } from 'rpgcore-common/es';
import { NetEventType } from 'rpgcore-common/enums';
import { InitState } from 'rpgcore-common/types';

import { NetClient } from 'Net/net-client';

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

  isConnected(): boolean {
    return this.client.isConnected();
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

  listenDisconnect(cb: () => void) {
    this.client.listen('disconnect', cb);
  }

  sendEvent(clientEvent: ClientSentEvent) {
    this.client.sendSimpleMessage(NetEventType.ESEvent, clientEvent);
  }

  listenEvent(cb: (serverEvent: ServerSentEvent) => void) {
    this.client.listen(NetEventType.ESEvent, (s: ServerSentEvent) => {
      // We must explicitly create the instance, because socketio only creates an object of the same 'shape' as ServerSentEvent
      cb(new ServerSentEvent(s.sequenceNumber, s.messageId, s.category, s.data));
    });
  }
}
