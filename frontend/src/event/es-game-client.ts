import { TokenProto } from 'rpgcore-common/es-proto';
import { ClientSentEvent, DataPack, EventAggCategories, EventCategories, NumericSid, SID_FIRST } from 'rpgcore-common/es';
import { TokenAggregator } from 'rpgcore-common/es-transform';

import { ESClient } from 'Event/es-client';
import { GameNetClient } from 'Net/game-net-client';
import InMemorySharedStore from 'Store/In-memory-shared-store';

type AggData = {
  tokenSet: TokenProto.TokenSet;
};

export class ESGameClient extends ESClient {
  public aggs: AggData;

  constructor(readonly netClient: GameNetClient, readonly mem: InMemorySharedStore) {
    super();
    this.aggs = this.getZeroAggs();
    this.netClient.listenEvent(e => this.pushEvent(e));
  }

  sendTokenCreationRequest(label: string, url: string, editOwners: string[], x: number, y: number, z: number, width: number, height: number): void {
    const obj = { label, url, editOwners, x, y, z, width, height, changeType: TokenProto.TokenChangeType.CREATE };
    const err = TokenProto.TokenChangeEvent.verify(obj);
    if (err) {
      throw Error(`Invalid message: ${err}`);
    }
    const bytes = TokenProto.TokenChangeEvent.encode(obj).finish();
    const event = new ClientSentEvent(this.nextMessageId(), EventCategories.TokenChangeEvent, 0, bytes);
    this.pushEvent(event);
    this.netClient.sendEvent(event);
  }

  sendTokenUpdateRequest(id: number,
                         opts: { label?: string; url?: string; editOwners?: string[]; x?: number; y?: number; z?: number; width?: number; height?: number }
  ): void {
    if (!this.aggs.tokenSet || !this.aggs.tokenSet.tokens || !(id in this.aggs.tokenSet.tokens)) {
      console.warn(`Token with id ${id} does not exist. Unable to update`);
      return;
    }

    const obj = { ...this.aggs.tokenSet.tokens[id], ...opts, changeType: TokenProto.TokenChangeType.UPDATE };
    const err = TokenProto.TokenChangeEvent.verify(obj);
    if (err) {
      throw Error(`Invalid message: ${err}`);
    }
    const bytes = TokenProto.TokenChangeEvent.encode(obj).finish();
    const event = new ClientSentEvent(this.nextMessageId(), EventCategories.TokenChangeEvent, 0, bytes);
    this.pushEvent(event);
    this.netClient.sendEvent(event);
  }

  sendTokenDeleteRequest(id: number) {
    if (!this.aggs.tokenSet || !this.aggs.tokenSet.tokens || !(id in this.aggs.tokenSet.tokens)) {
      console.warn(`Token with id ${id} does not exist. Unable to delete`);
      return;
    }

    const obj = { id, changeType: TokenProto.TokenChangeType.DELETE };
    const err = TokenProto.TokenChangeEvent.verify(obj);
    if (err) {
      throw Error(`Invalid message: ${err}`);
    }
    const bytes = TokenProto.TokenChangeEvent.encode(obj).finish();
    const event = new ClientSentEvent(this.nextMessageId(), EventCategories.TokenChangeEvent, 0, bytes);
    this.pushEvent(event);
    this.netClient.sendEvent(event);
  }

  async requestWorldState(): Promise<string> {
    const ws = await this.netClient.sendWorldStateRequest();
    console.log('Requested world state:', ws);

    if (!ws.status || ws.data === null) {
      throw new Error('Unable to process world state response');
    }

    // Reset aggs and update with fetched data
    this.aggs = this.getZeroAggs();
    for (const d of ws.data) {
      this.processAgg(d);
    }

    // Notify everything
    this.notifyAllResyncListeners();

    if (ws.data.length === 0) {
      return SID_FIRST;
    }
    const maxSequenceId = NumericSid.max(...ws.data.map(v => new NumericSid(v.watermark))).val;
    return maxSequenceId.toString();
  }

  private getZeroAggs() {
    return {
      tokenSet: new TokenAggregator(this.mem.userProfile.username).zero(),
    };
  }

  protected aggEventData(data: DataPack): void {
    switch (data.category) {
      case EventCategories.TokenChangeEvent:
        const changeEvent = TokenProto.TokenChangeEvent.decode(data.dataUi8);
        new TokenAggregator(this.mem.userProfile.username, this.aggs.tokenSet)
          .agg(changeEvent);
        break;
      default:
        throw Error(`Unknown event category: ${data.category}`);
    }
  }

  protected processAgg(dataPack: DataPack): void {
    switch (dataPack.category) {
      case EventAggCategories.TokenSet:
        this.aggs.tokenSet = TokenProto.TokenSet.decode(dataPack.dataUi8);
        break;
      default:
        throw Error(`Unknown agg category: ${dataPack.category}`);
    }
  }

  protected syncAggs(): void {
    this.requestWorldState()
      .then(maxSeqId => {
        this.finishSyncAggs(maxSeqId);
      })
      .catch(err => {
        console.error('Unable to sync world state');
        console.error(err);

        // Try again, but only if we are connected still
        if (this.netClient.isConnected()) {
          setTimeout(() => {
            this.syncAggs();
          }, 3000);
        }
      });
  }
}
