import { IOEventDispatcher } from 'IO/event';
import { IOState } from 'IO/state';
import { GameNetClient } from 'Net/game-net-client';
import PersistentGameSettings from 'Store/Persistent-game-settings';
import InMemoryGameSettings from 'Store/In-memory-game-settings';

export interface RenderLifecycle {
  init(): void;

  initFromLostContext(): void;

  startFrame(): void;

  render(): void;

  endFrame(): void;

  destroy(): void;
}

export interface GameContext {
  readonly gl: WebGLRenderingContext;
  readonly io: {
    readonly dispatcher: IOEventDispatcher;
    readonly state: IOState;
  };
  readonly net: GameNetClient;
  readonly store: {
    readonly p: PersistentGameSettings;
    readonly mem: InMemoryGameSettings;
  };
}

export class RenderComponent implements RenderLifecycle, GameContext {
  private context!: GameContext;

  readonly children: RenderComponent[] = [];

  bindContext(context: GameContext) {
    this.context = context;
  }

  init(): void {

  }

  initFromLostContext(): void {

  }

  startFrame(): void {

  }

  render(): void {

  }

  endFrame(): void {

  }

  destroy(): void {

  }

  get gl() {
    return this.context.gl;
  }

  get io() {
    return this.context.io;
  }

  get net() {
    return this.context.net;
  }

  get store() {
    return this.context.store;
  }
}
