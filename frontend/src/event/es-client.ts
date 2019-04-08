import { ClientSentEvent, DataPack, EventAggCategories, EventCategories, NumericSid, ServerSentEvent } from 'rpgcore-common/es';
import shortid from 'shortid';

type EventListener = (dataPack: DataPack) => void;
type ResyncListener = () => void;

export abstract class ESClient<AGG> {
  private messageIdPrefix: string;
  private lastSentClientSequenceId: number = 0;

  private eventQueue: (ServerSentEvent | ClientSentEvent)[] = [];
  private clientSidToPrevServerSidMap = new Map<number, string>();
  private lastSeenServerSequenceId: string = 'BLAH';
  private pauseEventDispatching: boolean = true;

  private readonly eventListeners: { [key: string]: EventListener[] } = {};
  private readonly resyncListeners: { [key: string]: ResyncListener[] } = {};

  protected constructor(public readonly aggs: AGG) {
    this.messageIdPrefix = shortid.generate();
  }

  // Must be called before any events can be processed
  init(lastSeenServerSequenceId: string) {
    this.messageIdPrefix = shortid.generate();
    this.lastSentClientSequenceId = 0;

    this.eventQueue = [];
    this.clientSidToPrevServerSidMap.clear();
    this.lastSeenServerSequenceId = lastSeenServerSequenceId;
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
    console.log('Pushed event:', event);
    this.eventQueue.push(event);
  }

  notifyResyncListeners(category: EventAggCategories) {
    // Dispatch
    const chain = this.resyncListeners[category] || [];
    for (const handler of chain) {
      try {
        handler();
      } catch (e) {
        console.error(e);
      }
    }
  }

  dispatchEvents(): void {
    if (this.pauseEventDispatching) {
      return;
    }

    for (const event of this.eventQueue) {
      console.log('Dispatching', event);

      if (event instanceof ClientSentEvent) {
        // Save what we project this client sequence number should be
        const { seqId } = this.breakdownMessageId(event.messageId);
        this.clientSidToPrevServerSidMap.set(seqId, this.lastSeenServerSequenceId);
        console.log(`\tProcessing client-event. Mapping ${seqId} (local) to ${this.lastSeenServerSequenceId + 1} (server, expected)`);
      } else {
        console.log('\tProcessing server-event');

        // If we see something old, ignore it
        // TODO: Define a sid ordering type/function
        if (new NumericSid(this.lastSeenServerSequenceId).comesAfter(new NumericSid(event.sequenceNumber))) {
          console.log(`\tIgnoring older message. Last server sid is ${this.lastSeenServerSequenceId} while event has ${event.sequenceNumber}`);
          continue;
        }

        // If the sequence numbers are not...sequential, then reset
        if (event.prevSequenceNumber !== this.lastSeenServerSequenceId) {
          console.warn(`\tExpected server id ${this.lastSeenServerSequenceId + 1} but got ${event.sequenceNumber} -- resync`);
          this.resync();
          return;
        }

        const { prefix, seqId } = this.breakdownMessageId(event.clientMessageId);

        // Do not dispatch client-sent messages
        if (prefix === this.messageIdPrefix) {
          console.log('\tProcessing server-event that was sent by this client (self-sent)');
          const prevServerSid = this.clientSidToPrevServerSidMap.get(seqId);
          if (prevServerSid === undefined) {
            console.warn(`\tCould not find server projected prev sequence id for client sequence id: ${seqId}`);
          } else {
            if (prevServerSid !== event.prevSequenceNumber) {
              console.warn(`\tExpected client prev projected id ${prevServerSid} but got ${event.sequenceNumber} -- resync`);
              this.resync();
              return;
            }
          }
          this.clientSidToPrevServerSidMap.delete(seqId);
          this.lastSeenServerSequenceId = event.sequenceNumber;
          console.log('\tLast server sid', this.lastSeenServerSequenceId);
          continue;
        }

        this.lastSeenServerSequenceId = event.sequenceNumber;
      }

      console.log('\tLast server sid', this.lastSeenServerSequenceId);

      // Yay, we can agg the data now
      this.aggEventData(event);

      // Dispatch
      const chain = this.eventListeners[event.category] || [];
      for (const handler of chain) {
        try {
          handler(event);
        } catch (e) {
          console.error(e);
        }
      }
    }

    this.eventQueue = [];
  }

  protected abstract aggEventData(data: DataPack): void;

  protected abstract syncAggs(): void;

  // Must be called after sync to re-enable dispatching
  protected finishSyncAggs(lastSeenServerSequenceId: string): void {
    this.messageIdPrefix = shortid.generate();
    this.lastSentClientSequenceId = 0;

    this.eventQueue = this.eventQueue.filter(e => e instanceof ServerSentEvent); // Only keep Server-sent events
    this.clientSidToPrevServerSidMap.clear();
    this.lastSeenServerSequenceId = lastSeenServerSequenceId;
    this.pauseEventDispatching = false;
  }

  protected nextMessageId(): string {
    this.lastSentClientSequenceId += 1;
    return `${this.messageIdPrefix}-${this.lastSentClientSequenceId}`;
  }

  private resync(): void {
    this.pauseEventDispatching = true;
    this.syncAggs();
  }

  private breakdownMessageId(messageId: string) {
    const sep = messageId.lastIndexOf('-');
    const prefix = messageId.substring(0, sep);
    const seqId = Number(messageId.substring(sep + 1));
    return { prefix, seqId };
  }
}
