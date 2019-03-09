export interface Aggregator<E, T> {
  accumulator: T;

  agg(data: E): void;

  zero(): T;
}
