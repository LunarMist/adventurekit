import { DataPack, EventAggCategories, EventAggResponse, EventCategories, ServerSentEvent, SID_FIRST } from 'rpgcore-common/es';
import { TokenProto } from 'rpgcore-common/es-proto';
import { TokenAggregator } from 'rpgcore-common/es-transform';
import { getConnection } from 'typeorm';

import { GameRoomSocketHandler, SessionStoredUser } from '../sockets/game-room';
import EventAggregate from '../entities/EventAggregate';
import Event from '../entities/Event';
import { ESServer } from './es-server';
import { GameNetSocket } from '../sockets/game-net-socket';
import { SessionizedSocket } from '../sockets/sess-socket';

/**
 * Game server implementation for {@link ESServer}
 */
export class ESGameServer extends ESServer {
  constructor(
    protected readonly net: GameNetSocket,
    protected readonly sess: SessionizedSocket<SessionStoredUser>
  ) {
    super();
  }

  // TODO: Do not have this live inside ESGameServer?
  currentGameRoomId: number | undefined = undefined;

  setup(): void {
    this.registerEventHandlers();
    this.net.listenClientSentEvent(c => this.processEvent(c));
    this.net.listenEventAggRequest(async (category, ack) => {
      try {
        ack(await this.processEventAggRequest(category));
      } catch (e) {
        console.error(e);
        ack({ status: false, data: null });
      }
    });
  }

  registerEventHandlers() {
    // TODO: Make this logic more generic/re-usable
    // TODO: Use kafka/kenisis/redis event streams or something
    // TODO: ack event?
    this.addHandler(EventCategories.TokenChangeEvent, clientEvent => {
      if (this.currentGameRoomId === undefined) {
        return false;
      }

      // Save copy so we are consistent
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
          // For now, sequence numbers are numeric. In the future, they may have some other ordering type
          if (Number(newEvent.sequenceNumber) <= Number(currentAgg.eventWatermark)) {
            throw Error(`Event aggregate ${currentAgg.id} is out of sync: Invalid watermark for create event: ${newEvent.id}`);
          }
          const aggregator = new TokenAggregator(this.sess.sessionUser.username, TokenProto.TokenSet.decode(currentAgg.getDataUi8()) as TokenProto.TokenSet);
          aggregator.agg(changeEvent);
          await currentAgg.update(entityManager, newEvent.sequenceNumber, aggregator.dataUi8);
        }

        // TODO: Won't always be this if we move to redis/whatever
        const prevSequenceNumber: string = Number(newEvent.sequenceNumber) === 1 ? SID_FIRST : (Number(newEvent.sequenceNumber) - 1).toString();
        return new ServerSentEvent(newEvent.sequenceNumber, prevSequenceNumber, clientEvent.messageId, newEvent.category, newEvent.dataVersion, newEvent.getDataUi8());
      }).then(response => {
        const roomName = GameRoomSocketHandler.formatRoomName(currentRoomId);
        console.log(response);
        this.net.sendServerSentEvent(roomName, response);
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
