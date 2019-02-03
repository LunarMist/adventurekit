import {InitState, NetEventType, UserProfile} from 'rpgcore-common';

import {SocketHandler, SocketHandlerFactory} from './sockets';
import GameRoom from '../entities/room';
import User from '../entities/user';

/**
 * Game room socket.io handler.
 */
export class GameRoomSocketHandler extends SocketHandler {
  private currentGameRoomId: number = -1;

  async onConnection(): Promise<void> {
    console.log(`User connected: ${this.socket.id}`);

    this.socket.on('error', error => {
      console.error(error);
    });

    if (!this.isAuthenticated()) {
      // TODO: Relay back some type of message/alert?
      console.log(`User not authenticated: ${this.socket.id}. Disconnecting...`);
      this.disconnect();
      return;
    }

    await this.joinDefaultRoom();

    this.listenChatMessage((message: string) => {
      if (this.currentGameRoomId !== -1) {
        this.sendChatMessage(this.passport.user.username, message, this.formatRoomName(this.currentGameRoomId));
      }
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
        this.socket.join(roomName, async err => {
          if (err) {
            console.log(err);
            ack(false);
            return;
          }
          const user = await this.getCurrentUser();
          if (user === undefined) {
            ack(false);
            return;
          }
          await user.setDefaultRoom(room);
          this.currentGameRoomId = room.id;
          ack(true);
        });

        // Add to db
        await room.addMember(this.passport.user.id);
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
        const newRoom: GameRoom = await GameRoom.create(user, password);
        ack(newRoom.id);
      } catch (e) {
        console.error(e);
        ack(-1);
      }
    });

    this.sendInitState({userProfile: {username: this.passport.user.username}, roomId: this.currentGameRoomId});
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

  formatRoomName(roomId: number): string {
    return `gr-${roomId}`;
  }

  async getCurrentUser(): Promise<User | undefined> {
    return User.getById(this.passport.user.id);
  }

  joinDefaultRoom(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const user = await this.getCurrentUser();
      if (user === undefined) {
        reject("Could not fetch current user");
        return;
      }

      if (user.default_room === null) {
        resolve();
      } else {
        const roomName = this.formatRoomName(user.default_room.id);
        this.socket.join(roomName, err => {
          if (err) {
            reject(err);
            return;
          }
          if (user.default_room !== null) {
            this.currentGameRoomId = user.default_room.id;
          }
          resolve();
        });
      }
    });
  }
}

export class GameRoomSocketHandlerFactory implements SocketHandlerFactory {
  create(io: SocketIO.Server, socket: SocketIO.Socket): SocketHandler {
    return new GameRoomSocketHandler(io, socket);
  }
}
