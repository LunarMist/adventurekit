/**
 * Base sequence id utility class
 */
abstract class Sid<T> {
  constructor(readonly val: T) {

  }

  abstract compareTo(other: Sid<T> | T): number;

  comesBefore(other: Sid<T> | T): boolean {
    return this.compareTo(other) < 0;
  }

  comesAfter(other: Sid<T> | T): boolean {
    return this.compareTo(other) > 0;
  }

  equals(other: Sid<T> | T): boolean {
    return this.compareTo(other) === 0;
  }

  static max<T>(...vals: Sid<T>[]): Sid<T> {
    return vals.reduce((a, b) => a.comesAfter(b) ? a : b);
  }
}

/**
 * Simple numeric-based sid
 */
export class NumericSid extends Sid<number> {
  public constructor(val: number | string) {
    super(Number(val));
  }

  compareTo(other: Sid<number> | number): number {
    if (typeof other === 'number') {
      return this.val - other;
    }
    return this.val - other.val;
  }
}
