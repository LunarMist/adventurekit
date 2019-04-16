import { ClientSentEvent, DataPack, EventAggCategories, EventCategories, NumericSid, ServerSentEvent, SID_FIRST } from 'rpgcore-common/es';
import shortid from 'shortid';

type EventListener = (dataPack: DataPack) => void;
type ResyncListener = () => void;

type EventListenerPair = { pre: EventListener; post: EventListener };

// tslint:disable-next-line
export const EventListenerNoop = (dataPack: DataPack) => {
  // Nothing
};

export abstract class ESClient {
  private messageIdPrefix: string;
  private lastSentClientSequenceId: number = 0;

  private eventQueue: (ServerSentEvent | ClientSentEvent)[] = [];
  private clientSidToPrevServerSidMap = new Map<number, string>();
  private lastSeenServerSequenceId: string = SID_FIRST;
  private pauseEventDispatching: boolean = true;

  private readonly eventListeners: { [key: string]: EventListenerPair[] } = {};
  private readonly resyncListeners: { [key: string]: ResyncListener[] } = {};

  protected constructor() {
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

  addEventListener(category: EventCategories, pre: EventListener, post: EventListener): void {
    this.eventListeners[category] = this.eventListeners[category] || [];
    this.eventListeners[category].push({ pre, post });
  }

  removeEventListener(category: EventCategories, pre: EventListener, post: EventListener): void {
    this.eventListeners[category] = this.eventListeners[category] || [];
    const loc = this.eventListeners[category].findIndex(v => v.pre === pre && v.post === post);
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

  notifyAllResyncListeners() {
    for (const category in this.resyncListeners) {
      this.notifyResyncListeners(category as EventAggCategories);
    }
  }

  dispatchEvents(): void {
    if (this.pauseEventDispatching) {
      return;
    }

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event === undefined) {
        continue;
      }
      console.log('Dispatching', event);

      if (event instanceof ClientSentEvent) {
        // Save what the 'prev' sequence id of the relevant server sequence id should be (when we eventually get it)
        // Assume that this event is the immediate next event that is processed by the server
        // This should be good enough in a slow-moving event stream and where latency is low-ish
        // TODO: Make this more intelligent; Perform event playback/rewinding, or check agg hashes instead of expected seq ids
        const { seqId } = this.breakdownMessageId(event.messageId);
        this.clientSidToPrevServerSidMap.set(seqId, this.lastSeenServerSequenceId);
        console.log(`\tProcessing client-event. Mapping ${seqId} (local) to ${this.lastSeenServerSequenceId} (server, prev, expected)`);
      } else {
        console.log('\tProcessing server-event');

        // If we see something old, ignore it
        if (new NumericSid(this.lastSeenServerSequenceId).comesAfter(new NumericSid(event.sequenceNumber))) {
          console.log(`\tIgnoring older message. Last server sid is ${this.lastSeenServerSequenceId} while event has ${event.sequenceNumber}`);
          continue;
        }

        // If the sequence numbers are not...sequential, then reset
        // TODO: Make this more intelligent; Try to request only the missing events
        if (event.prevSequenceNumber !== this.lastSeenServerSequenceId) {
          console.warn(`\tExpected prev server id ${this.lastSeenServerSequenceId} but got prev id ${event.sequenceNumber} -- resync`);
          this.resync();
          return;
        }

        const { prefix, seqId } = this.breakdownMessageId(event.clientMessageId);

        // Do not dispatch client-sent messages
        if (prefix === this.messageIdPrefix) {
          console.log('\tProcessing server-event that was sent by this client (self-sent)');
          const expectedPrevSid = this.clientSidToPrevServerSidMap.get(seqId);
          if (expectedPrevSid === undefined) {
            console.warn(`\tCould not find server prev sequence id for client sequence id: ${seqId}`);
          } else {
            if (expectedPrevSid !== event.prevSequenceNumber) {
              console.warn(`\tExpected client prev id ${expectedPrevSid} but got ${event.prevSequenceNumber} -- resync`);
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

      const chain = this.eventListeners[event.category] || [];

      // Dispatch pre handlers
      for (const handlers of chain) {
        try {
          handlers.pre(event);
        } catch (e) {
          console.error(e);
        }
      }

      // Yay, we can agg the data now
      this.aggEventData(event);

      // Dispatch post handlers
      for (const handlers of chain) {
        try {
          handlers.post(event);
        } catch (e) {
          console.error(e);
        }
      }
    }
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
