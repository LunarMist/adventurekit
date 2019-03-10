import * as util from 'util';
import { getConnection } from 'typeorm';
import { ClientSentEvent, EventAggCategories, EventAggResponse, EventCategories, ServerSentEvent } from 'rpgcore-common/es';
import { TokenProto } from 'rpgcore-common/es-proto';
import { NetEventType } from 'rpgcore-common/enums';
import { InitState } from 'rpgcore-common/types';
import { TokenAggregator } from 'rpgcore-common/es-transform';

import { SocketHandler, SocketHandlerFactory } from './sockets';
import GameRoom from '../entities/GameRoom';
import User from '../entities/User';
import { ESServer } from '../event/es-server';
import Event from '../entities/Event';
import EventAggregate from '../entities/EventAggregate';

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
        this.sendChatMessage(this.sessionUser.username, message, GameRoomSocketHandler.formatRoomName(this.currentGameRoomId));
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
        await room.addMember(this.sessionUser.id);

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

    const esServer = new ESServer();

    this.listenEvent(esServer.processEvent.bind(esServer));

    // TODO: Make this logic more generic/re-usable
    // TODO: Write to redis first, then to db async?
    esServer.addHandler(EventCategories.TokenChangeEvent, clientEvent => {
      const changeEvent = TokenProto.TokenChangeEvent.decode(clientEvent.dataUi8);
      console.log(changeEvent);

      getConnection().transaction(async entityManager => {
        const newEvent = await Event.create(entityManager, this.currentGameRoomId, clientEvent.category, -1, clientEvent.dataUi8);
        const currentAgg = await EventAggregate.getForUpdate(entityManager, this.currentGameRoomId, EventAggCategories.TokenSet);
        if (currentAgg === undefined) {
          const aggregator = new TokenAggregator(this.sessionUser.username);
          aggregator.agg(changeEvent);
          await EventAggregate.create(entityManager, this.currentGameRoomId, EventAggCategories.TokenSet, newEvent.sequenceNumber, aggregator.dataUi8);
        } else {
          if (currentAgg.eventWatermark !== newEvent.sequenceNumber - 1) {
            throw Error(`Event aggregate ${currentAgg.id} is out of sync: Invalid watermark for create event: ${newEvent.id}`);
          }
          const aggregator = new TokenAggregator(this.sessionUser.username, TokenProto.TokenSet.decode(currentAgg.getDataUi8()) as TokenProto.TokenSet);
          aggregator.agg(changeEvent);
          await currentAgg.update(entityManager, newEvent.sequenceNumber, aggregator.dataUi8);
        }

        return new ServerSentEvent(newEvent.sequenceNumber, clientEvent.messageId, newEvent.category, newEvent.getDataUi8());
      }).then(response => {
        const roomName = GameRoomSocketHandler.formatRoomName(this.currentGameRoomId);
        console.log(response);
        this.sendEvent(response, roomName);
      }).catch(console.error);

      return true;
    });

    this.listenEventAggRequest(async (category, ack) => {
      try {
        // TODO: add white/blacklist for requested categories?
        // TODO: Add a caching layer
        const agg = await EventAggregate.get(this.currentGameRoomId, category);
        if (agg === undefined) {
          ack({ status: true, data: null });
          return;
        }
        ack({ status: true, data: agg.getDataUi8() });
      } catch (e) {
        console.error(e);
        ack({ status: false, data: null });
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

  listenEvent(cb: (clientEvent: ClientSentEvent) => void) {
    // We must explicitly create the instance, because socketio only creates an object of the same 'shape' as ClientSentEvent
    this.listenAuthenticated(NetEventType.ESEvent, (c: ClientSentEvent) => {
      cb(new ClientSentEvent(c.messageId, c.category, c.data));
    });
  }

  sendEvent(serverEvent: ServerSentEvent, room: string) {
    this.io.to(room).emit(NetEventType.ESEvent, serverEvent);
  }

  listenEventAggRequest(cb: (category: EventAggCategories, ack: (response: EventAggResponse) => void) => void) {
    this.listenAuthenticated(NetEventType.EventAggRequest, cb);
  }

  /*** Helper functions ***/

  leaveRoom: (roomName: string) => Promise<void> = util.promisify<any>(this.socket.leave.bind(this.socket));

  joinRoom: (roomName: string | string[]) => Promise<void> = util.promisify<any>(this.socket.join.bind(this.socket));

  static formatRoomName(roomId: number): string {
    return `gr-${roomId}`;
  }

  async getCurrentUser(): Promise<User | undefined> {
    return User.getById(this.sessionUser.id);
  }

  getInitState(): InitState {
    return {
      userProfile: {
        username: this.sessionUser.username,
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
    if (!user.defaultRoom) {
      return;
    }
    // Join the room
    await this.joinRoom(GameRoomSocketHandler.formatRoomName(user.defaultRoom.id));
    // Update current room
    this.currentGameRoomId = user.defaultRoom.id;
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
