import { EventAggCategories, EventAggResponse, EventCategories, ServerSentEvent } from 'rpgcore-common/es';

import { GameNetClient } from 'Net/game-net-client';

type ServerSentEventHandler = (serverEvent: ServerSentEvent) => boolean;
type EventAggResponseHandler = (eventAgg: EventAggResponse) => boolean;

class Processor {
  private eventHandlers: { [key: string]: ServerSentEventHandler[] } = {};
  private aggHandlers: { [key: string]: EventAggResponseHandler[] } = {};

  constructor(readonly messageIdPrefix: string) {

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

  addAggHandler(type: EventAggCategories, handler: EventAggResponseHandler): void {
    this.aggHandlers[type] = this.aggHandlers[type] || [];
    this.aggHandlers[type].push(handler);
  }

  removeAggHandler(type: EventAggCategories, handler: EventAggResponseHandler): void {
    this.aggHandlers[type] = this.aggHandlers[type] || [];
    const loc = this.aggHandlers[type].findIndex(v => v === handler);
    if (loc !== -1) {
      this.aggHandlers[type].splice(loc, 1);
    }
  }

  // TODO: Event buffering and re-ordering
  processEvent(serverEvent: ServerSentEvent): void {
    console.log(serverEvent);

    if (serverEvent.clientMessageId.startsWith(this.messageIdPrefix)) {
      console.log('Got self-sent event; Skipping handling');
      return;
    }

    if (!(serverEvent.category in this.eventHandlers)) {
      console.warn(`No handlers for event category ${serverEvent.category}`);
      return;
    }

    const chain = this.eventHandlers[serverEvent.category];
    for (const handler of chain) {
      if (handler(serverEvent)) {
        break;
      }
    }
  }

  processAgg(eventAgg: EventAggResponse): void {
    console.log(eventAgg);

    if (!eventAgg.status) {
      throw new Error('Unable to process aggregate');
    }

    if (eventAgg.data === null) {
      console.warn('Agg payload is NULL');
      return;
    }

    if (!(eventAgg.data.category in this.aggHandlers)) {
      console.warn(`No handlers for agg category ${eventAgg.data.category}`);
      return;
    }

    const chain = this.aggHandlers[eventAgg.data.category];
    for (const handler of chain) {
      if (handler(eventAgg)) {
        break;
      }
    }
  }
}

export class ESClient {
  private readonly messageIdPrefix: string;
  private prevSequenceId: number;

  public p: Processor;

  constructor(protected readonly netClient: GameNetClient) {
    this.messageIdPrefix = Math.random().toString(36);
    this.prevSequenceId = 0;
    this.p = new Processor(this.messageIdPrefix);
    this.netClient.listenEvent(this.p.processEvent.bind(this.p));
  }

  protected nextMessageId(): string {
    this.prevSequenceId += 1;
    return `${this.messageIdPrefix}-${this.prevSequenceId}`;
  }
}
