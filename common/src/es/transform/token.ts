import { Aggregator } from './base';
import { Token, TokenChangeEvent, TokenChangeType, TokenSet } from '../proto/token';

export const MAX_EDIT_OWNERS = 10;

export class TokenAggregator implements Aggregator<TokenChangeEvent, TokenSet> {
  readonly accumulator: TokenSet;

  constructor(readonly authUser: string, accumulator?: TokenSet) {
    this.accumulator = accumulator ? accumulator : this.zero();
  }

  agg(data: TokenChangeEvent): void {
    if (data.changeType === TokenChangeType.CREATE) {
      this.processCreate(data);
    } else if (data.changeType === TokenChangeType.UPDATE) {
      this.processUpdate(data);
    } else if (data.changeType === TokenChangeType.DELETE) {
      this.processDelete(data);
    } else {
      throw Error(`Unknown changeType: ${data.changeType}`);
    }
  }

  zero(): TokenSet {
    return TokenSet.create({ nextTokenId: 1 }) as TokenSet;
  }

  protected processCreate(data: TokenChangeEvent) {
    const newId = this.accumulator.nextTokenId;
    if (newId in this.accumulator.tokens) {
      throw Error(`Id ${newId} already exists in TokenSet. NextTokenID out of sync.`);
    }
    if (data.editOwners && data.editOwners.length > MAX_EDIT_OWNERS) {
      throw Error(`Too many edit owners: ${data.editOwners.length}`);
    }
    const obj = { id: newId, label: data.label, url: data.url, editOwners: data.editOwners, x: data.x, y: data.y, z: data.z, width: data.width, height: data.height };
    const err = Token.verify(obj);
    if (err) {
      throw Error(`Invalid message: ${err}`);
    }
    this.accumulator.tokens[newId] = Token.create(obj) as Token;
    this.accumulator.nextTokenId += 1;
  }

  protected processUpdate(data: TokenChangeEvent) {
    const targetId = data.id;
    if (targetId !== undefined && targetId in this.accumulator.tokens) {
      const token = this.accumulator.tokens[targetId];
      if (!this.isAuthorized(token)) {
        throw Error(`User not authorized for editing token: ${this.authUser}`);
      }
      if (data.editOwners && data.editOwners.length > MAX_EDIT_OWNERS) {
        throw Error(`Too many edit owners: ${data.editOwners.length}`);
      }
      token.label = data.label || token.label;
      token.url = data.url || token.url;
      token.editOwners = data.editOwners || token.editOwners;
      token.x = data.x || token.x;
      token.y = data.y || token.y;
      token.z = data.z || token.z;
      token.width = data.width || token.width;
      token.height = data.height || token.height;
    }
  }

  protected processDelete(data: TokenChangeEvent) {
    const targetId = data.id;
    if (targetId !== undefined && targetId in this.accumulator.tokens) {
      const token = this.accumulator.tokens[targetId];
      if (!this.isAuthorized(token)) {
        throw Error(`User not authorized for editing token: ${this.authUser}`);
      }
      delete this.accumulator.tokens[targetId];
    }
  }

  private isAuthorized(data: Token) {
    return data.editOwners.includes(this.authUser);
  }
}