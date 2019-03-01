import { IOEventDispatcher } from 'IO/event';
import { IOState } from 'IO/state';
import { GameNetClient } from 'Net/game-net-client';
import PersistentGameSettings from 'Store/Persistent-game-settings';
import InMemoryGameSettings from 'Store/In-memory-game-settings';
import { GameMessagesBroker } from 'Message/game-messages';

export interface RenderLifecycle {
  init(): void;

  initFromLostContext(): void;

  startFrame(): void;

  render(): void;

  endFrame(): void;

  destroy(): void;
}

export interface GameContext {
  gl: WebGLRenderingContext;
  readonly io: {
    readonly dispatcher: IOEventDispatcher;
    readonly state: IOState;
  };
  readonly net: GameNetClient;
  readonly broker: GameMessagesBroker;
  readonly store: {
    readonly p: PersistentGameSettings;
    readonly mem: InMemoryGameSettings;
  };
}

export class RenderComponent implements RenderLifecycle, GameContext {
  private context!: GameContext;

  protected readonly children: RenderComponent[] = [];

  bindContext(context: GameContext) {
    this.context = context;
    this.children.forEach(c => c.bindContext(this.context));
  }

  init(): void {
    this.children.forEach(c => c.init());
  }

  initFromLostContext(): void {
    this.children.forEach(c => c.initFromLostContext());
  }

  startFrame(): void {
    this.children.forEach(c => c.startFrame());
  }

  render(): void {
    this.children.forEach(c => c.render());
  }

  endFrame(): void {
    this.children.forEach(c => c.endFrame());
  }

  destroy(): void {
    this.children.forEach(c => c.destroy());
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

  get broker() {
    return this.context.broker;
  }

  get store() {
    return this.context.store;
  }
}
