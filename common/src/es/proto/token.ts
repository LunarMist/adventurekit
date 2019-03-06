import { Field, MapField, Message, Type } from 'protobufjs/light';

@Type.d()
export class Token extends Message<Token> {
  @Field.d(1, 'uint64', 'required')
  public id!: number;

  @Field.d(2, 'string', 'required')
  public label!: string;

  @Field.d(3, 'string', 'required')
  public url!: string;

  @Field.d(4, 'double', 'required')
  public x!: number;

  @Field.d(5, 'double', 'required')
  public y!: number;

  @Field.d(6, 'double', 'required')
  public z!: number;

  @Field.d(7, 'double', 'required')
  public width!: number;

  @Field.d(8, 'double', 'required')
  public height!: number;
}

@Type.d()
export class TokenSet extends Message<TokenSet> {
  @MapField.d(1, 'uint64', Token)
  public tokens!: { [id: number]: Token };
}

export enum TokenChangeType {
  CREATE = 0,
  UPDATE,
  DELETE,
}

@Type.d()
export class TokenChangeEvent extends Message<TokenChangeEvent> {
  @Field.d(1, 'uint64', 'optional')
  public id?: number;

  @Field.d(2, TokenChangeType, 'required', TokenChangeType.CREATE)
  public changeType!: TokenChangeType;

  @Field.d(3, 'string', 'optional')
  public label?: string;

  @Field.d(4, 'string', 'optional')
  public url?: string;

  @Field.d(5, 'double', 'optional')
  public x?: number;

  @Field.d(6, 'double', 'optional')
  public y?: number;

  @Field.d(7, 'double', 'optional')
  public z?: number;

  @Field.d(8, 'double', 'optional')
  public width?: number;

  @Field.d(9, 'double', 'optional')
  public height?: number;
}

@Type.d()
export class TokenChangeEventList extends Message<TokenChangeEventList> {
  @Field.d(1, TokenChangeEvent, 'repeated')
  public changes!: TokenChangeEvent[];
}
