import { InitState } from 'rpgcore-common/types';

import GameRoom from '../entities/GameRoom';
import User from '../entities/User';
import { ESGameServer } from '../event/es-game-server';
import { GameNetSocket } from './game-net-socket';
import { SessionizedSocket } from './sess-socket';

export type SessionStoredUser = { id: number; username: string; email: string };

/**
 * Game room socket handler.
 */
export class GameRoomSocketHandler {
  private readonly esServer: ESGameServer;

  constructor(private readonly net: GameNetSocket, private readonly sess: SessionizedSocket<SessionStoredUser>) {
    this.esServer = new ESGameServer(net, sess);
  }

  async onConnection(): Promise<void> {
    console.log(`User connected: ${this.net.socketId}`);

    // First thing: Register error handler
    this.net.listenError(error => {
      console.error(error);
    });

    let clientIsReady = false;
    // Let the client flag asap if it is ready
    this.net.listenClientReady(() => {
      clientIsReady = true;
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

    // Setup event sourcing
    this.esServer.setup();

    // TODO: This is ugly af
    // Last thing: Send over init state data
    // Wait one second for the client to possibly get ready
    setTimeout(() => {
      // If the client has been flagged as ready, then send the init state immediately
      // Otherwise, wait 2 seconds (arbitrarily), and then send it
      if (clientIsReady) {
        console.log('Sending init state: Client is ready');
        this.net.sendInitState(this.getInitState());
      } else {
        console.log('Sending init state: Delayed');
        setTimeout(() => {
          if (clientIsReady) {
            console.log('Client signaled ready in past 2 seconds');
          } else {
            console.log('Client not signaled ready. Sending anyways');
          }
          this.net.sendInitState(this.getInitState());
        }, 2000);
      }
    }, 1000);
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
    // TODO: Does user still have permissions to join the room? Some sort of auth
    // Join the room
    this.net.joinRoom(GameRoomSocketHandler.formatRoomName(user.defaultRoom.id));
    // Update current room
    this.esServer.currentGameRoomId = user.defaultRoom.id;
  }
}
