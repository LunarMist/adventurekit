export interface Aggregator<E, T> {
  readonly accumulator: T;
  readonly dataBuffer: Buffer;
  readonly dataUi8: Uint8Array;

  agg(data: E): void;

  zero(): T;
}
