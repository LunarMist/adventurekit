import { ClientSentEvent, EventAggCategories, EventCategories } from 'rpgcore-common/es';
import { TokenProto } from 'rpgcore-common/es-proto';

import { GameNetClient } from 'Net/game-net-client';
import { ESClient } from 'Event/es-client';

type EventAggData = {
  tokens?: TokenProto.TokenSet;
};

export class ESGameClient extends ESClient {
  public aggs: EventAggData; // TODO: Agg on this data struct

  constructor(netClient: GameNetClient) {
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
    // TODO: Propagate/process client-sent event
  }

  sendTokenUpdateRequest(id: number,
                         opts: { label?: string; url?: string; editOwners?: string[]; x?: number; y?: number; z?: number; width?: number; height?: number }
  ): void {
    if (!this.aggs.tokens || !this.aggs.tokens.tokens || !(id in this.aggs.tokens.tokens)) {
      console.warn(`Token with id ${id} does not exist. Unable to update`);
      return;
    }

    const obj = { ...this.aggs.tokens.tokens[id], ...opts, changeType: TokenProto.TokenChangeType.UPDATE };
    const err = TokenProto.TokenChangeEvent.verify(obj);
    if (err) {
      throw Error(`Invalid message: ${err}`);
    }
    const bytes = TokenProto.TokenChangeEvent.encode(obj).finish();
    const event = new ClientSentEvent(this.nextMessageId(), EventCategories.TokenChangeEvent, 0, bytes);
    this.netClient.sendEvent(event);
    // TODO: Propagate/process client-sent event
  }

  sendTokenDeleteRequest(id: number) {
    if (!this.aggs.tokens || !this.aggs.tokens.tokens || !(id in this.aggs.tokens.tokens)) {
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
