import { EventAggCategories, EventCategories, ServerSentAgg, ServerSentEvent, SID_CLIENT_SENT } from 'rpgcore-common/es';
import shortid from 'shortid';

import { GameNetClient } from 'Net/game-net-client';

type ServerSentEventHandler = (serverEvent: ServerSentEvent) => void;
type ServerSentAggHandler = (eventAgg: ServerSentAgg) => void;

export abstract class ESClient {
  private readonly eventHandlers: { [key: string]: ServerSentEventHandler[] } = {};
  private readonly aggHandlers: { [key: string]: ServerSentAggHandler[] } = {};

  private readonly messageIdPrefix: string;
  private lastSentClientSequenceId: number;

  private clientSentEvents = new Map<string, ServerSentEvent>();

  protected maxServerSequenceId: string;

  constructor(protected readonly netClient: GameNetClient) {
    this.messageIdPrefix = shortid.generate();
    this.lastSentClientSequenceId = 0;
    this.maxServerSequenceId = '-1';
    this.netClient.listenEvent(e => this.processEvent(e));
  }

  addEventHandler(type: EventCategories, handler: ServerSentEventHandler): void {
    this.eventHandlers[type] = this.eventHandlers[type] || [];
    this.eventHandlers[type].push(handler);
  }

  removeEventHandler(type: EventCategories, handler: ServerSentEventHandler): void {
    this.eventHandlers[type] = this.eventHandlers[type] || [];
    const loc = this.eventHandlers[type].findIndex(v => v === handler);
    if (loc !== -1) {
      this.eventHandlers[type].splice(loc, 1);
    }
  }

  addAggHandler(type: EventAggCategories, handler: ServerSentAggHandler): void {
    this.aggHandlers[type] = this.aggHandlers[type] || [];
    this.aggHandlers[type].push(handler);
  }

  removeAggHandler(type: EventAggCategories, handler: ServerSentAggHandler): void {
    this.aggHandlers[type] = this.aggHandlers[type] || [];
    const loc = this.aggHandlers[type].findIndex(v => v === handler);
    if (loc !== -1) {
      this.aggHandlers[type].splice(loc, 1);
    }
  }

  abstract reset(): void;

  processEvent(serverEvent: ServerSentEvent): void {
    console.log(serverEvent);

    if (!(serverEvent.category in this.eventHandlers)) {
      console.warn(`No handlers for event category ${serverEvent.category}`);
      return;
    }

    if (serverEvent.sequenceNumber === SID_CLIENT_SENT) {
      this.clientSentEvents.set(serverEvent.clientMessageId, serverEvent);
    } else {
      const sep = serverEvent.clientMessageId.lastIndexOf('-');
      const prefix = serverEvent.clientMessageId.substring(0, sep);
      const seqId = Number(serverEvent.clientMessageId.substring(sep + 1));
      if (prefix === this.messageIdPrefix) {
        this.clientSentEvents.delete(serverEvent.clientMessageId);
      }
      if (this.clientSentEvents.size > 2) {
        console.warn('Data out of sync - More than 2 unacked client messages');
        this.reset();
        return;
      }
      if (Number(serverEvent.prevSequenceNumber) > Number(this.maxServerSequenceId)) {
        console.warn('Data out of sync - Broken sequence number sequence');
        this.reset();
        return;
      }
      this.maxServerSequenceId = serverEvent.sequenceNumber;
      if (prefix === this.messageIdPrefix) {
        return;
      }
    }

    const chain = this.eventHandlers[serverEvent.category];
    for (const handler of chain) {
      handler(serverEvent);
    }
  }

  processAgg(serverAgg: ServerSentAgg): void {
    console.log(serverAgg);

    if (!(serverAgg.category in this.aggHandlers)) {
      console.warn(`No handlers for agg category ${serverAgg.category}`);
      return;
    }

    const chain = this.aggHandlers[serverAgg.category];
    for (const handler of chain) {
      handler(serverAgg);
    }
  }

  protected nextMessageId(): string {
    this.lastSentClientSequenceId += 1;
    return `${this.messageIdPrefix}-${this.lastSentClientSequenceId}`;
  }
}
