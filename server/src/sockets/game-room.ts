import { InitState } from 'rpgcore-common/types';

import GameRoom from '../entities/GameRoom';
import User from '../entities/User';
import { ESGameServer } from '../event/es-server';
import { GameNetSocket } from './game-net-socket';
import { SessionizedSocket } from './sess-socket';

export type SessionStoredUser = { id: number; username: string; email: string };

/**
 * Game room socket.io handler.
 */
export class GameRoomSocketHandler {
  private esServer: ESGameServer;

  constructor(private readonly net: GameNetSocket, private readonly sess: SessionizedSocket<SessionStoredUser>) {
    this.esServer = new ESGameServer(net, sess);
  }

  async onConnection(): Promise<void> {
    console.log(`User connected: ${this.net.socketId}`);

    // First thing: Register error handler
    this.net.listenError(error => {
      console.error(error);
    });

    // Important: Ensure we are authenticated!
    if (!this.sess.authenticated) {
      // TODO: Relay back some type of message/alert?
      console.log(`User not authenticated: ${this.net.socketId}. Disconnecting...`);
      this.net.disconnect();
      return;
    }

    // Join the default room
    // This should be one of the first things done
    await this.joinDefaultRoom();

    this.net.listenChatMessage((message: string) => {
      if (this.esServer.currentGameRoomId !== undefined) {
        const roomName = GameRoomSocketHandler.formatRoomName(this.esServer.currentGameRoomId);
        this.net.sendChatMessage(roomName, this.sess.sessionUser.username, message);
      }
    });

    this.net.listenJoinRoomRequest(async (roomId, password, ack) => {
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
        await room.addMember(this.sess.sessionUser.id);

        // Leave old rooms
        const promises = Object.keys(this.net.rooms)
          .filter(r => r !== this.net.socketId)
          .map(r => this.net.leaveRoom(r));

        // Wait to leave all the rooms
        // TODO: Do I really need/want to wait?
        await Promise.all(promises);

        // Join new room
        this.net.joinRoom(GameRoomSocketHandler.formatRoomName(room.id));
        // Update
        this.esServer.currentGameRoomId = room.id;
        ack(true);
      } catch (e) {
        console.error(e);
        ack(false);
      }
    });

    this.net.listenCreateRoomRequest(async (password, ack) => {
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

    this.esServer.registerEventHandlers();

    this.net.listenEvent(this.esServer.p.processEvent.bind(this.esServer.p));

    this.net.listenEventAggRequest(async (category, ack) => {
      try {
        ack(await this.esServer.processEventAggRequest(category));
      } catch (e) {
        console.error(e);
        ack({ status: false, data: null });
      }
    });

    // TODO: Better way
    setTimeout(() => {
      // Last thing: Send over init state data
      this.net.sendInitState(this.getInitState());
    }, 500);
  }

  /*** Helper functions ***/

  static formatRoomName(roomId: number): string {
    return `gr-${roomId}`;
  }

  async getCurrentUser(): Promise<User | undefined> {
    return User.getById(this.sess.sessionUser.id);
  }

  getInitState(): InitState {
    return {
      userProfile: {
        username: this.sess.sessionUser.username,
      },
      roomId: this.esServer.currentGameRoomId || -1,
    };
  }

  async joinDefaultRoom(): Promise<void> {
    const user = await this.getCurrentUser();
    if (user === undefined) {
      return;
    }
    // No default room is specified
    if (!user.defaultRoom) {
      return;
    }
    // Join the room
    this.net.joinRoom(GameRoomSocketHandler.formatRoomName(user.defaultRoom.id));
    // Update current room
    this.esServer.currentGameRoomId = user.defaultRoom.id;
  }
}
