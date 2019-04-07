import { ClientSentEvent, EventAggCategories, EventCategories, ServerSentAgg, ServerSentEvent, SID_CLIENT_SENT } from 'rpgcore-common/es';
import { TokenProto } from 'rpgcore-common/es-proto';
import { TokenAggregator } from 'rpgcore-common/es-transform';

import { GameNetClient } from 'Net/game-net-client';
import { ESClient } from 'Event/es-client';
import InMemorySharedStore from 'Store/In-memory-shared-store';

type EventAggData = {
  tokenSet?: TokenProto.TokenSet;
};

export class ESGameClient extends ESClient {
  public aggs: EventAggData; // TODO: Agg on this data struct

  constructor(netClient: GameNetClient, readonly mem: InMemorySharedStore) {
    super(netClient);
    this.aggs = {};
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
    this.propagateClientSentEvent(event);
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
    this.netClient.sendEvent(event);
    this.propagateClientSentEvent(event);
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
    this.netClient.sendEvent(event);
    this.propagateClientSentEvent(event);
  }

  async requestWorldState() {
    const ws = await this.netClient.sendWorldStateRequest();
    console.log(ws);

    if (!ws.status || ws.data === null) {
      throw new Error('Unable to process world state response');
    }

    for (const d of ws.data) {
      this.processAgg2(d);
    }

    for (const d of ws.data) {
      this.processAgg(d);
    }
  }

  private propagateClientSentEvent(clientEvent: ClientSentEvent) {
    const serverEvent = new ServerSentEvent(SID_CLIENT_SENT, SID_CLIENT_SENT, clientEvent.messageId, clientEvent.category, clientEvent.version, clientEvent.data);
    this.processEvent(serverEvent);
  }

  reset(): void {
    this.requestWorldState()
      .catch(console.error);
  }

  processAgg2(serverAgg: ServerSentAgg): void {
    switch (serverAgg.category) {
      case EventAggCategories.TokenSet:
        this.aggs.tokenSet = TokenProto.TokenSet.decode(serverAgg.dataUi8);
        break;
      default:
        throw Error(`Unknown agg category: ${serverAgg.category}`);
    }

    // TODO: Does this go here?
    this.maxServerSequenceId = Math.max(Number(this.maxServerSequenceId), Number(serverAgg.watermark)).toString();
  }

  processEvent2(serverEvent: ServerSentEvent): void {
    switch (serverEvent.category) {
      case EventCategories.TokenChangeEvent:
        const changeEvent = TokenProto.TokenChangeEvent.decode(serverEvent.dataUi8);
        new TokenAggregator(this.mem.userProfile.username, this.aggs.tokenSet)
          .agg(changeEvent);
        break;
      default:
        throw Error(`Unknown event category: ${serverEvent.category}`);
    }
  }
}
