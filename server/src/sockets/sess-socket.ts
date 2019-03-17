/**
 * Socket seesionization interface
 */
export interface SessionizedSocket<S> {
  readonly authenticated: boolean;
  readonly sessionUser: S;
}
