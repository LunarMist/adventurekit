import { ClientSentEvent, ESProtoToken, EventCategories, ServerSentEvent } from 'rpgcore-common';

type ServerSentEventHandler = (serverEvent: ServerSentEvent) => boolean;

interface ServerSentEventProcessor {
  addHandler(type: EventCategories, handler: ServerSentEventHandler): void;

  removeHandler(type: EventCategories, handler: ServerSentEventHandler): void;

  processEvent(serverEvent: ServerSentEvent): void;
}

export class ESClient implements ServerSentEventProcessor {
  private readonly messageIdPrefix: string;
  private handlers: { [key: string]: ServerSentEventHandler[] } = {};

  constructor(private prevSequenceId: number = 0) {
    this.messageIdPrefix = Math.random().toString(36);
  }

  private nextMessageId(): string {
    this.prevSequenceId += 1;
    return `${this.messageIdPrefix}-${this.prevSequenceId}`;
  }

  buildTokenCreationRequest(label: string, url: string, x: number, y: number, z: number, width: number, height: number): ClientSentEvent {
    const obj = { label, url, x, y, z, width, height, changeType: ESProtoToken.TokenChangeType.CREATE };
    const err = ESProtoToken.TokenChangeEvent.verify(obj);
    if (err) {
      throw Error(`Invalid message: ${err}`);
    }
    const bytes = ESProtoToken.TokenChangeEvent.encode(obj).finish();
    const arrayBuffer = Uint8Array.from(bytes).buffer;
    return { messageId: this.nextMessageId(), data: arrayBuffer, category: EventCategories.TokenChangeEvent };
  }

  addHandler(type: EventCategories, handler: (serverEvent: ServerSentEvent) => boolean): void {
    this.handlers[type] = this.handlers[type] || [];
    this.handlers[type].push(handler);
  }

  removeHandler(type: EventCategories, handler: (serverEvent: ServerSentEvent) => boolean): void {
    this.handlers[type] = this.handlers[type] || [];
    const loc = this.handlers[type].findIndex(v => v === handler);
    if (loc !== -1) {
      this.handlers[type].splice(loc, 1);
    }
  }

  processEvent(serverEvent: ServerSentEvent): void {
    console.log(serverEvent);

    if (!(serverEvent.category in this.handlers)) {
      console.warn(`No handlers for event category ${serverEvent.category}`);
      return;
    }

    const chain = this.handlers[serverEvent.category];
    for (const handler of chain) {
      if (handler(serverEvent)) {
        break;
      }
    }
  }
}
