import {InitState, NetEventType} from 'rpgcore-common';

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
          .map(r => new Promise<void>((resolve, reject) => {
            this.socket.leave(r, (err: any) => {
              if (err) {
                reject(err);
                return;
              }
              resolve();
            });
          }));

        // Wait to leave all the rooms
        await Promise.all(promises);

        // Join new room
        const roomName = GameRoomSocketHandler.formatRoomName(room.id);
        this.socket.join(roomName, async err => {
          try {
            if (err) {
              console.error(err);
              ack(false);
              return;
            }
            this.currentGameRoomId = room.id;
            ack(true);
          } catch (e) {
            console.error(e);
            ack(false);
          }
        });
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

  static formatRoomName(roomId: number): string {
    return `gr-${roomId}`;
  }

  async getCurrentUser(): Promise<User | undefined> {
    return User.getById(this.passport.user.id);
  }

  joinDefaultRoom(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const user = await this.getCurrentUser();
        if (user === undefined) {
          reject('Could not fetch current user');
          return;
        }

        if (user.default_room === null) {
          resolve();
        } else {
          const roomName = GameRoomSocketHandler.formatRoomName(user.default_room.id);
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
      } catch (e) {
        reject(e);
      }
    });
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
