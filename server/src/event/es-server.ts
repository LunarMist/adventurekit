import { ClientSentEvent, EventCategories } from 'rpgcore-common/es';

type ClientSentEventHandler = (clientEvent: ClientSentEvent) => boolean;

/**
 * Dispatches client-sent events
 */
export class ESServer {
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
    console.log('ESServer.processEvent:', clientEvent);

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
