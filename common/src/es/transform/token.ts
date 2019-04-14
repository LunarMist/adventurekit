import { Aggregator } from './base';
import { Token, TokenChangeEvent, TokenChangeType, TokenSet } from '../proto/token';

export const MAX_LABEL_LENGTH = 50;
export const MAX_URL_LENGTH = 200;
export const MAX_TOKEN_EDIT_OWNERS = 10;

/**
 * Aggregate {@link TokenChangeEvent} into {@link TokenSet}
 */
export class TokenAggregator implements Aggregator<TokenChangeEvent, TokenSet> {
  readonly accumulator: TokenSet;

  constructor(readonly authUser: string, accumulator?: TokenSet) {
    this.accumulator = accumulator ? accumulator : this.zero();
  }

  agg(data: TokenChangeEvent): TokenAggregator {
    if (data.changeType === TokenChangeType.CREATE) {
      this.processCreate(data);
    } else if (data.changeType === TokenChangeType.UPDATE) {
      this.processUpdate(data);
    } else if (data.changeType === TokenChangeType.DELETE) {
      this.processDelete(data);
    } else {
      throw Error(`Unknown changeType: ${data.changeType}`);
    }
    return this;
  }

  zero(): TokenSet {
    const obj = { tokens: {}, nextTokenId: 1 };
    const err = TokenSet.verify(obj);
    if (err) {
      throw Error('Unable to create zero() object for TokenAggregator; Invalid message.');
    }
    return TokenSet.create(obj) as TokenSet;
  }

  get dataUi8(): Uint8Array {
    return TokenSet.encode(this.accumulator).finish();
  }

  protected processCreate(data: TokenChangeEvent) {
    const newId = this.accumulator.nextTokenId;
    if (newId in this.accumulator.tokens) {
      throw Error(`Id ${newId} already exists in TokenSet. NextTokenID out of sync.`);
    }
    if (!data.id) {
      throw Error('Id needs to be set');
    }
    if (data.id !== newId) {
      throw Error(`Id in data (${data.id}) does not match expected id ${newId}`);
    }
    if (data.label && data.label.length > MAX_LABEL_LENGTH) {
      throw Error('Label length too long');
    }
    if (data.url && data.url.length > MAX_URL_LENGTH) {
      throw Error('Url length too long');
    }
    // Always add self as un-deletable edit owner
    if (data.editOwners) {
      if (data.editOwners.findIndex(value => value === this.authUser) === -1) {
        data.editOwners.push(this.authUser);
      }
    }
    if (data.editOwners && data.editOwners.length > MAX_TOKEN_EDIT_OWNERS) {
      throw Error(`Too many edit owners: ${data.editOwners.length}`);
    }
    if (data.editOwners && data.editOwners.length === 0) {
      throw Error('Must have at least one edit owner');
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
      const obj = { ...token };
      if (!this.isAuthorized(token)) {
        throw Error(`User not authorized for editing token: ${this.authUser}`);
      }
      if (data.label && data.label.length > MAX_LABEL_LENGTH) {
        throw Error('Label length too long');
      }
      if (data.url && data.url.length > MAX_URL_LENGTH) {
        throw Error('Url length too long');
      }
      if (data.editOwners && data.editOwners.length > MAX_TOKEN_EDIT_OWNERS) {
        throw Error(`Too many edit owners: ${data.editOwners.length}`);
      }
      obj.label = data.label || obj.label;
      obj.url = data.url || obj.url;
      if (data.editOwners && data.editOwners.length > 0) {
        // Always add self as un-deletable edit owner
        if (data.editOwners.findIndex(value => value === this.authUser) === -1) {
          data.editOwners.push(this.authUser);
        }
        obj.editOwners = data.editOwners;
      }
      obj.x = data.x || obj.x;
      obj.y = data.y || obj.y;
      obj.z = data.z || obj.z;
      obj.width = data.width || obj.width;
      obj.height = data.height || obj.height;
      const err = Token.verify(obj);
      if (err) {
        throw Error(`Invalid message: ${err}`);
      }
      this.accumulator.tokens[targetId] = Token.create(obj) as Token;
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
