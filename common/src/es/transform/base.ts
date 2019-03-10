/**
 * An {@link Aggregator} merges events of type E into event aggregate type T
 */
export interface Aggregator<E, T> {
  readonly accumulator: T;
  readonly dataUi8: Uint8Array;

  agg(data: E): void;

  zero(): T;
}
