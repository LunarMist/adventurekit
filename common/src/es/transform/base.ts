/**
 * An {@link Aggregator} merges events of type E into event aggregate type T
 */
export interface Aggregator<E, T> {
  readonly accumulator: T;
  readonly dataUi8: Uint8Array;

  /**
   * Aggregate E into T
   * @param data The data to agg
   */
  agg(data: E): Aggregator<E, T>;

  /**
   * Fetch the zero value for T
   */
  zero(): T;
}
