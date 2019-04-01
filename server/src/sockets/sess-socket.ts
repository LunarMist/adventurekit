/**
 * Socket sessionization interface
 */
export interface SessionizedSocket<S> {
  readonly authenticated: boolean;
  readonly sessionUser: S;
}
