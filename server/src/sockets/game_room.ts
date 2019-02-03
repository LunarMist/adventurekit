import {NetEventType, UserProfile} from 'rpgcore-common';

import {SocketHandler, SocketHandlerFactory} from './sockets';
import GameRoom from '../entities/room';
import User from '../entities/user';

/**
 * Game room socket.io handler.
 */
export class GameRoomSocketHandler extends SocketHandler {
  private currentGameRoom: string | null = null;

  onConnection(): void {
    console.log(`User connected: ${this.socket.id}`);

    if (!this.isAuthenticated()) {
      // TODO: Relay back some type of message/alert?
      console.log(`User not authenticated: ${this.socket.id}. Disconnecting...`);
      this.disconnect();
      return;
    }

    this.listenChatMessage((message: string) => {
      if (this.currentGameRoom !== null) {
        this.sendChatMessage(this.passport.user.username, message, this.currentGameRoom);
      }
    });

    this.listenUserProfileRequest(ack => {
      ack({username: this.passport.user.username});
    });

    this.listenJoinRoomRequest(async (roomId, password, ack) => {
      try {
        const room: GameRoom | undefined = await GameRoom.validate(roomId, password);
        if (room === undefined) {
          ack(false);
          return;
        }
        // Leave old rooms
        Object.keys(this.socket.rooms)
          .filter(r => r !== this.socket.id)
          .forEach(r => this.socket.leave(r));

        // Join new room
        const roomName = this.formatRoomName(room.id);
        this.socket.join(roomName, () => {
          this.currentGameRoom = roomName;
        });

        // Add to db
        await room.addMember(this.passport.user.id);

        ack(true);
      } catch (e) {
        console.error(e);
        ack(false);
      }
    });

    this.listenCreateRoomRequest(async (password, ack) => {
      try {
        const user = await User.getById(this.passport.user.id);
        if (user === undefined) {
          ack(-1);
          return;
        }
        const newRoom: GameRoom = await GameRoom.create(user, password);
        ack(newRoom.id);
      } catch (e) {
        console.error(e);
        ack(-1);
      }
    })
  }

  listenChatMessage(cb: (message: string) => void) {
    this.listenAuthenticated(NetEventType.ChatMessage, cb);
  }

  sendChatMessage(speaker: string, message: string, room: string) {
    this.io.to(room).emit(NetEventType.ChatMessage, speaker, message);
  }

  listenUserProfileRequest(cb: (ack: (profile: UserProfile) => void) => void) {
    this.listenAuthenticated(NetEventType.UserProfile, cb);
  }

  listenJoinRoomRequest(cb: (roomId: number, password: string, ack: (status: boolean) => void) => void) {
    this.listenAuthenticated(NetEventType.JoinRoom, cb);
  }

  listenCreateRoomRequest(cb: (password: string, ack: (roomId: number) => void) => void) {
    this.listenAuthenticated(NetEventType.CreateRoom, cb);
  }

  formatRoomName(roomId: number): string {
    return `gr-${roomId}`;
  }
}

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
