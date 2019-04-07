import { ClientSentEvent, DataPack, EventCategories, ServerSentEvent } from 'rpgcore-common/es';
import shortid from 'shortid';
import { EventAggCategories } from 'rpgcore-common/src/es/categories';

type EventListener = (dataPack: DataPack) => void;
type ResyncListener = () => void;

export abstract class ESClient<AGG> {
  private readonly messageIdPrefix: string;
  private lastSentClientSequenceId: number;

  private eventQueue: (ServerSentEvent | ClientSentEvent)[] = [];
  private clientSequenceIdProjectedMapping = new Map<number, number>();
  private lastSeenServerSequenceId: number = -1;
  private pauseEventDispatching: boolean = true;

  private readonly eventListeners: { [key: string]: EventListener[] } = {};
  private readonly resyncListeners: { [key: string]: ResyncListener[] } = {};

  protected constructor(public readonly aggs: AGG) {
    this.messageIdPrefix = shortid.generate();
    this.lastSentClientSequenceId = 0;
  }

  init(newLastSeenServerSequenceId: number) {
    this.lastSeenServerSequenceId = newLastSeenServerSequenceId;
    this.pauseEventDispatching = false;
  }

  addEventListener(category: EventCategories, cb: EventListener): void {
    this.eventListeners[category] = this.eventListeners[category] || [];
    this.eventListeners[category].push(cb);
  }

  removeEventListener(category: EventCategories, cb: EventListener): void {
    this.eventListeners[category] = this.eventListeners[category] || [];
    const loc = this.eventListeners[category].findIndex(v => v === cb);
    if (loc !== -1) {
      this.eventListeners[category].splice(loc, 1);
    }
  }

  addResyncListener(category: EventAggCategories, cb: ResyncListener): void {
    this.resyncListeners[category] = this.resyncListeners[category] || [];
    this.resyncListeners[category].push(cb);
  }

  removeResyncListener(category: EventAggCategories, cb: ResyncListener): void {
    this.resyncListeners[category] = this.resyncListeners[category] || [];
    const loc = this.resyncListeners[category].findIndex(v => v === cb);
    if (loc !== -1) {
      this.resyncListeners[category].splice(loc, 1);
    }
  }

  pushEvent(event: ServerSentEvent | ClientSentEvent): void {
    this.eventQueue.push(event);
  }

  notifyResyncListeners(category: EventAggCategories) {
    // Dispatch
    const chain = this.resyncListeners[category] || [];
    for (const handler of chain) {
      handler();
    }
  }

  dispatchEvents(): void {
    if (this.pauseEventDispatching) {
      return;
    }

    for (const event of this.eventQueue) {
      if (event instanceof ClientSentEvent) {
        // Save what we project this client sequence number should be
        const { seqId } = this.breakdownMessageId(event.messageId);
        this.clientSequenceIdProjectedMapping.set(seqId, this.lastSeenServerSequenceId + 1);
      } else {
        // If we see something old, ignore it
        if (Number(event.sequenceNumber) <= this.lastSeenServerSequenceId) {
          continue;
        }

        // If the sequence numbers are not...sequential, then reset
        if (Number(event.sequenceNumber) !== this.lastSeenServerSequenceId + 1) {
          console.warn(`Expected server id ${this.lastSeenServerSequenceId + 1} but got ${Number(event.sequenceNumber)} -- resync`);
          this.resync();
          return;
        }

        const { prefix, seqId } = this.breakdownMessageId(event.clientMessageId);

        // Do not dispatch client-sent messages
        if (prefix === this.messageIdPrefix) {
          const projectedId = this.clientSequenceIdProjectedMapping.get(seqId);
          if (projectedId === undefined) {
            console.warn(`Could not find server projected sequence id for client sequence id: ${seqId}`);
          } else {
            if (Number(event.sequenceNumber) !== projectedId) {
              console.warn(`Expected client projected id ${projectedId} but got ${Number(event.sequenceNumber)} -- resync`);
              this.resync();
              return;
            }
          }
          this.clientSequenceIdProjectedMapping.delete(seqId);
          continue;
        }
      }

      // Yay, we can agg the data now
      this.aggData(event);

      // Dispatch
      const chain = this.eventListeners[event.category] || [];
      for (const handler of chain) {
        handler(event);
      }
    }
  }

  protected abstract aggData(data: DataPack): void;

  protected abstract syncAggs(): void;

  protected finishSyncAggs(newLastSeenServerSequenceId: number): void {
    this.pauseEventDispatching = false;
    this.lastSeenServerSequenceId = newLastSeenServerSequenceId;
  }

  protected nextMessageId(): string {
    this.lastSentClientSequenceId += 1;
    return `${this.messageIdPrefix}-${this.lastSentClientSequenceId}`;
  }

  private resync(): void {
    this.pauseEventDispatching = true;
    this.eventQueue = [];
    this.clientSequenceIdProjectedMapping.clear();
    this.syncAggs();
  }

  private breakdownMessageId(messageId: string) {
    const sep = messageId.lastIndexOf('-');
    const prefix = messageId.substring(0, sep);
    const seqId = Number(messageId.substring(sep + 1));
    return { prefix, seqId };
  }
}
