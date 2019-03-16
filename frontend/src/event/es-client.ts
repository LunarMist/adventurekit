import { ClientSentEvent, EventAggCategories, EventAggResponse, EventCategories, ServerSentEvent } from 'rpgcore-common/es';
import { TokenProto } from 'rpgcore-common/es-proto';

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

    if (serverEvent.messageId.startsWith(this.messageIdPrefix)) {
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

class ESClient {
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

type EventAggData = {
  tokens?: TokenProto.TokenSet;
};

export class ESGameClient extends ESClient {
  public agg: EventAggData; // TODO: Agg on this data struct

  constructor(netClient: GameNetClient) {
    super(netClient);
    this.agg = {};
  }

  sendTokenCreationRequest(label: string, url: string, editOwners: string[], x: number, y: number, z: number, width: number, height: number): void {
    const obj = { label, url, editOwners, x, y, z, width, height, changeType: TokenProto.TokenChangeType.CREATE };
    const err = TokenProto.TokenChangeEvent.verify(obj);
    if (err) {
      throw Error(`Invalid message: ${err}`);
    }
    const bytes = TokenProto.TokenChangeEvent.encode(obj).finish();
    const event = new ClientSentEvent(this.nextMessageId(), EventCategories.TokenChangeEvent, 0, bytes);
    this.netClient.sendEvent(event);
    // TODO: Propagate/process client-sent event
  }

  async requestTokenSetAgg() {
    const aggResponse = await this.netClient.sendEventAggRequest(EventAggCategories.TokenSet);
    this.p.processAgg(aggResponse);
  }

  async requestEventAggData() {
    await Promise.all([
      this.requestTokenSetAgg(),
    ]);
  }
}
