import { InitState, NetEventType } from 'rpgcore-common';
import * as util from 'util';

import { SocketHandler, SocketHandlerFactory } from './sockets';
import GameRoom from '../entities/game-room';
import User from '../entities/user';

/**
 * Game room socket.io handler.
 */
export class GameRoomSocketHandler extends SocketHandler {
  private currentGameRoomId: number = -1;

  async onConnection(): Promise<void> {
    console.log(`User connected: ${this.socket.id}`);

    // First thing: Register error handler
    this.socket.on('error', error => {
      console.error(error);
    });

    // Important: Ensure we are authenticated!
    if (!this.isAuthenticated()) {
      // TODO: Relay back some type of message/alert?
      console.log(`User not authenticated: ${this.socket.id}. Disconnecting...`);
      this.disconnect();
      return;
    }

    // Join the default room
    // This should be one of the first things done
    await this.joinDefaultRoom();

    this.listenChatMessage((message: string) => {
      if (this.currentGameRoomId !== -1) {
        this.sendChatMessage(this.passport.user.username, message, GameRoomSocketHandler.formatRoomName(this.currentGameRoomId));
      }
    });

    this.listenJoinRoomRequest(async (roomId, password, ack) => {
      try {
        const room = await GameRoom.validate(roomId, password);
        if (room === undefined) {
          ack(false);
          return;
        }
        const user = await this.getCurrentUser();
        if (user === undefined) {
          ack(false);
          return;
        }

        // Modify db
        await user.setDefaultRoom(room);
        await room.addMember(this.passport.user.id);

        // Leave old rooms
        const promises = Object.keys(this.socket.rooms)
          .filter(r => r !== this.socket.id)
          .map(r => this.leaveRoom(r));

        // Wait to leave all the rooms
        // TODO: Do I really need/want to wait?
        await Promise.all(promises);

        // Join new room
        await this.joinRoom(GameRoomSocketHandler.formatRoomName(room.id));
        // Update
        this.currentGameRoomId = room.id;
        ack(true);
      } catch (e) {
        console.error(e);
        ack(false);
      }
    });

    this.listenCreateRoomRequest(async (password, ack) => {
      try {
        const user: User | undefined = await this.getCurrentUser();
        if (user === undefined) {
          ack(-1);
          return;
        }
        const newRoom: GameRoom = await GameRoom.create(user, password || '');
        ack(newRoom.id);
      } catch (e) {
        console.error(e);
        ack(-1);
      }
    });

    // Last thing: Send over init state data
    this.sendInitState(this.getInitState());
  }

  /*** Socket functions ***/

  listenChatMessage(cb: (message: string) => void) {
    this.listenAuthenticated(NetEventType.ChatMessage, cb);
  }

  sendChatMessage(speaker: string, message: string, room: string) {
    this.io.to(room).emit(NetEventType.ChatMessage, speaker, message);
  }

  listenJoinRoomRequest(cb: (roomId: number, password: string, ack: (status: boolean) => void) => void) {
    this.listenAuthenticated(NetEventType.JoinRoom, cb);
  }

  listenCreateRoomRequest(cb: (password: string, ack: (roomId: number) => void) => void) {
    this.listenAuthenticated(NetEventType.CreateRoom, cb);
  }

  sendInitState(initState: InitState) {
    this.socket.emit(NetEventType.InitState, initState);
  }

  /*** Helper functions ***/

  leaveRoom: (roomName: string) => Promise<void> = util.promisify<any>(this.socket.leave.bind(this.socket));

  joinRoom: (roomName: string | string[]) => Promise<void> = util.promisify<any>(this.socket.join.bind(this.socket));

  static formatRoomName(roomId: number): string {
    return `gr-${roomId}`;
  }

  async getCurrentUser(): Promise<User | undefined> {
    return User.getById(this.passport.user.id);
  }

  getInitState(): InitState {
    return {
      userProfile: {
        username: this.passport.user.username,
      },
      roomId: this.currentGameRoomId,
    };
  }

  async joinDefaultRoom(): Promise<void> {
    const user = await this.getCurrentUser();
    if (user === undefined) {
      return;
    }
    // No default room is specified
    if (!user.default_room) {
      return;
    }
    // Join the room
    await this.joinRoom(GameRoomSocketHandler.formatRoomName(user.default_room.id));
    // Update current room
    this.currentGameRoomId = user.default_room.id;
  }
}

/**
 * {@link GameRoomSocketHandler} factory class
 */
export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
