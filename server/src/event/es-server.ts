import { ClientSentEvent, DataPack, EventAggCategories, EventAggResponse, EventCategories, ServerSentEvent } from 'rpgcore-common/es';
import { TokenProto } from 'rpgcore-common/es-proto';
import { TokenAggregator } from 'rpgcore-common/es-transform';
import { getConnection } from 'typeorm';

import EventAggregate from '../entities/EventAggregate';
import { GameNetSocket } from '../sockets/game-net-socket';
import { GameRoomSocketHandler, SessionStoredUser } from '../sockets/game-room';
import { SessionizedSocket } from '../sockets/sess-socket';
import Event from '../entities/Event';

type ClientSentEventHandler = (clientEvent: ClientSentEvent) => boolean;

class Processor {
  private handlers: { [key: string]: ClientSentEventHandler[] } = {};

  addHandler(type: EventCategories, handler: ClientSentEventHandler): void {
    this.handlers[type] = this.handlers[type] || [];
    this.handlers[type].push(handler);
  }

  removeHandler(type: EventCategories, handler: ClientSentEventHandler): void {
    this.handlers[type] = this.handlers[type] || [];
    const loc = this.handlers[type].findIndex(v => v === handler);
    if (loc !== -1) {
      this.handlers[type].splice(loc, 1);
    }
  }

  processEvent(clientEvent: ClientSentEvent): void {
    console.log(clientEvent);

    if (!(clientEvent.category in this.handlers)) {
      console.warn(`No handlers for event category ${clientEvent.category}`);
      return;
    }

    const chain = this.handlers[clientEvent.category];
    for (const handler of chain) {
      if (handler(clientEvent)) {
        break;
      }
    }
  }
}

class ESServer<S> {
  public p: Processor;

  constructor(
    protected readonly net: GameNetSocket,
    protected readonly sess: SessionizedSocket<S>
  ) {
    this.p = new Processor();
  }
}

export class ESGameServer extends ESServer<SessionStoredUser> {
  // TODO: Do not have this live inside ESGameServer
  currentGameRoomId: number | undefined = undefined;

  registerEventHandlers() {
    // TODO: Make this logic more generic/re-usable
    // TODO: Use kafka/kenisis/redis event streams or something
    // TODO: ack event?
    this.p.addHandler(EventCategories.TokenChangeEvent, clientEvent => {
      if (this.currentGameRoomId === undefined) {
        return false;
      }

      const currentRoomId: number = this.currentGameRoomId;

      const changeEvent = TokenProto.TokenChangeEvent.decode(clientEvent.dataUi8);
      console.log(changeEvent);

      getConnection().transaction(async entityManager => {
        const newEvent = await Event.create(entityManager, currentRoomId, clientEvent.category, -1, 0, clientEvent.dataUi8);
        const currentAgg = await EventAggregate.getForUpdate(entityManager, currentRoomId, EventAggCategories.TokenSet);
        if (currentAgg === undefined) {
          const aggregator = new TokenAggregator(this.sess.sessionUser.username)
            .agg(changeEvent);
          await EventAggregate.create(entityManager, currentRoomId, EventAggCategories.TokenSet, newEvent.sequenceNumber, 0, aggregator.dataUi8);
        } else {
          if (currentAgg.eventWatermark !== newEvent.sequenceNumber - 1) {
            throw Error(`Event aggregate ${currentAgg.id} is out of sync: Invalid watermark for create event: ${newEvent.id}`);
          }
          const aggregator = new TokenAggregator(this.sess.sessionUser.username, TokenProto.TokenSet.decode(currentAgg.getDataUi8()) as TokenProto.TokenSet);
          aggregator.agg(changeEvent);
          await currentAgg.update(entityManager, newEvent.sequenceNumber, aggregator.dataUi8);
        }

        return new ServerSentEvent(newEvent.sequenceNumber.toString(), clientEvent.messageId, newEvent.category, newEvent.dataVersion, newEvent.getDataUi8());
      }).then(response => {
        const roomName = GameRoomSocketHandler.formatRoomName(currentRoomId);
        console.log(response);
        this.net.sendEvent(roomName, response);
      }).catch(console.error);

      return true;
    });
  }

  async processEventAggRequest(category: string): Promise<EventAggResponse> {
    if (this.currentGameRoomId === undefined) {
      return { status: false, data: null };
    }

    // TODO: Add a caching layer
    switch (category) {
      case EventAggCategories.TokenSet:
        const agg = await EventAggregate.get(this.currentGameRoomId, category);
        if (agg === undefined) {
          return { status: true, data: null };
        }
        return { status: true, data: new DataPack(category, agg.dataVersion, agg.getDataUi8()) };
      default:
        return { status: false, data: null };
    }
  }
}
