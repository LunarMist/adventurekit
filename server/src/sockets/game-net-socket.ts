import { NetEventType } from 'rpgcore-common/enums';
import { InitState } from 'rpgcore-common/types';
import { ClientSentEvent, EventAggCategories, EventAggResponse, MultiEventAggResponse, ServerSentEvent } from 'rpgcore-common/es';

import { AuthenticatedNetServerSocket } from './net-server';

/**
 * Used for sending all game-relevant messages between the client <--> server.
 * Uses an underlying {@link AuthenticatedNetServerSocket} for message transport.
 */
export class GameNetSocket {
  constructor(private readonly net: AuthenticatedNetServerSocket) {

  }

  listenChatMessage(cb: (message: string) => void) {
    this.net.listenAuthenticated(NetEventType.ChatMessage, cb);
  }

  sendChatMessage(room: string, speaker: string, message: string) {
    this.net.sendGroupMessage(NetEventType.ChatMessage, room, speaker, message);
  }

  listenJoinRoomRequest(cb: (roomId: number, password: string, ack: (status: boolean) => void) => void) {
    this.net.listenAuthenticated(NetEventType.JoinRoom, cb);
  }

  listenCreateRoomRequest(cb: (password: string, ack: (roomId: number) => void) => void) {
    this.net.listenAuthenticated(NetEventType.CreateRoom, cb);
  }

  sendInitState(initState: InitState) {
    this.net.sendSimpleMessage(NetEventType.InitState, initState);
  }

  listenClientSentEvent(cb: (clientEvent: ClientSentEvent) => void) {
    // We must explicitly create the instance, because socket.io only creates an object of the same 'shape' as ClientSentEvent
    // TODO: Better way than this?
    this.net.listenAuthenticated(NetEventType.ESEvent, (c: ClientSentEvent) => {
      cb(new ClientSentEvent(c.messageId, c.category, c.version, c.data));
    });
  }

  sendServerSentEvent(room: string, serverEvent: ServerSentEvent) {
    this.net.sendGroupMessage(NetEventType.ESEvent, room, serverEvent);
  }

  listenEventAggRequest(cb: (category: EventAggCategories, ack: (response: EventAggResponse) => void) => void) {
    this.net.listenAuthenticated(NetEventType.EventAggRequest, cb);
  }

  listenWorldStateRequest(cb: (ack: (response: MultiEventAggResponse) => void) => void) {
    this.net.listenAuthenticated(NetEventType.WorldState, cb);
  }

  listenClientReady(cb: () => void) {
    this.net.listenAuthenticated(NetEventType.ClientReady, cb);
  }

  /** Some basic pass-through **/

  get socketId(): string {
    return this.net.socketId;
  }

  joinRoom(room: string) {
    this.net.joinGroup(room);
  }

  leaveRoom(room: string) {
    this.net.leaveGroup(room);
  }

  get rooms(): string[] {
    return this.net.groups;
  }

  listenError(cb: (error: string) => void) {
    this.net.listen('error', cb);
  }

  disconnect() {
    this.net.disconnect();
  }
}
