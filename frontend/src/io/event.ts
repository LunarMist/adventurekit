/*! *****************************************************************************
* Steps to add a new event type:
* 1) Add a new entry to EventType at the end, but before LENGTH (event.ts)
* 2) Create the new Event object implementation (event.ts)
* 3) Add to IOState interface, as needed (state.ts)
* 4) Implement in EventDispatchedIOState, as needed (state.ts)
* 5) Add event queuing in IOLifeCycle (lifecycle.ts)
***************************************************************************** */

/**
 * IO Event type enum
 */
export enum EventType {
  Focused = 0,
  FocusLost,
  Resized,
  ClipboardCut,
  ClipboardCopy,
  ClipboardPaste,
  KeyDown,
  KeyPress,
  KeyUp,
  PointerMove,
  PointerDown,
  PointerUp,
  Wheel,
  LENGTH,
}

/**
 * Base event
 */
interface IOEvent {
  readonly type: EventType;
}

export class FocusedEvent implements IOEvent {
  readonly type = EventType.Focused;
}

export class FocusLostEvent implements IOEvent {
  readonly type = EventType.FocusLost;
}

export class ResizedEvent implements IOEvent {
  readonly type = EventType.Resized;
}

abstract class ClipboardTypeEvent implements IOEvent {
  readonly abstract type: EventType;

  constructor(
    readonly clipboardText: string
  ) {

  }
}

export class ClipboardCutEvent extends ClipboardTypeEvent {
  readonly type = EventType.ClipboardCut;
}

export class ClipboardCopyEvent extends ClipboardTypeEvent {
  readonly type = EventType.ClipboardCopy;
}

export class ClipboardPasteEvent extends ClipboardTypeEvent {
  readonly type = EventType.ClipboardPaste;
}

abstract class KeyboardTypeEvent implements IOEvent {
  readonly abstract type: EventType;

  constructor(
    /** Keyboard Event **/
    readonly char: string,
    readonly key: string,
    readonly code: string,
    readonly charCode: number,
    readonly keyCode: number,
    readonly which: number,
    readonly repeat: boolean,
    readonly location: number,
    readonly ctrlKey: boolean,
    readonly shiftKey: boolean,
    readonly altKey: boolean,
    readonly metaKey: boolean
  ) {

  }
}

export class KeyDownEvent extends KeyboardTypeEvent {
  readonly type = EventType.KeyDown;
}

export class KeyUpEvent extends KeyboardTypeEvent {
  readonly type = EventType.KeyUp;
}

export class KeyPressEvent extends KeyboardTypeEvent {
  readonly type = EventType.KeyPress;
}

abstract class PointerTypeEvent implements IOEvent {
  readonly abstract type: EventType;

  constructor(
    /** Mouse Event **/
    readonly altKey: boolean,
    readonly button: number,
    readonly buttons: number,
    readonly offsetX: number,
    readonly offsetY: number,
    readonly ctrlKey: boolean,
    readonly metaKey: boolean,
    readonly movementX: number,
    readonly movementY: number,
    readonly shiftKey: boolean,
    readonly which: number,
    /** Pointer Event **/
    readonly height: number,
    readonly isPrimary: boolean,
    readonly pointerId: number,
    readonly pointerType: string,
    readonly pressure: number,
    readonly tangentialPressure: number,
    readonly tiltX: number,
    readonly tiltY: number,
    readonly twist: number,
    readonly width: number
  ) {

  }
}

export class PointerMoveEvent extends PointerTypeEvent {
  readonly type: EventType = EventType.PointerMove;
}

export class PointerDownEvent extends PointerTypeEvent {
  readonly type: EventType = EventType.PointerDown;
}

export class PointerUpEvent extends PointerTypeEvent {
  readonly type: EventType = EventType.PointerUp;
}

export class WheelEvent implements IOEvent {
  readonly type: EventType = EventType.Wheel;

  constructor(
    /** Mouse Event **/
    readonly altKey: boolean,
    readonly button: number,
    readonly buttons: number,
    readonly offsetX: number,
    readonly offsetY: number,
    readonly ctrlKey: boolean,
    readonly metaKey: boolean,
    readonly movementX: number,
    readonly movementY: number,
    readonly shiftKey: boolean,
    readonly which: number,
    /** Wheel Event **/
    readonly deltaMode: number,
    readonly deltaX: number,
    readonly deltaY: number,
    readonly deltaZ: number
  ) {

  }
}

/**
 * Event handlers for IO should all extend {@link EventHandler<T>}
 */
export interface EventHandler<T extends IOEvent> {
  (event: T): boolean;
}

/**
 * Handles the work of dispatching IO events
 */
export interface IOEventDispatcher {
  addHandler(type: EventType.Focused, handler: EventHandler<FocusedEvent>): void;

  addHandler(type: EventType.FocusLost, handler: EventHandler<FocusLostEvent>): void;

  addHandler(type: EventType.Resized, handler: EventHandler<ResizedEvent>): void;

  addHandler(type: EventType.ClipboardCut, handler: EventHandler<ClipboardCutEvent>): void;

  addHandler(type: EventType.ClipboardCopy, handler: EventHandler<ClipboardCopyEvent>): void;

  addHandler(type: EventType.ClipboardPaste, handler: EventHandler<ClipboardPasteEvent>): void;

  addHandler(type: EventType.KeyDown, handler: EventHandler<KeyDownEvent>): void;

  addHandler(type: EventType.KeyPress, handler: EventHandler<KeyPressEvent>): void;

  addHandler(type: EventType.KeyUp, handler: EventHandler<KeyUpEvent>): void;

  addHandler(type: EventType.PointerMove, handler: EventHandler<PointerMoveEvent>): void;

  addHandler(type: EventType.PointerDown, handler: EventHandler<PointerDownEvent>): void;

  addHandler(type: EventType.PointerUp, handler: EventHandler<PointerUpEvent>): void;

  addHandler(type: EventType.Wheel, handler: EventHandler<WheelEvent>): void;

  removeHandler(type: EventType.Focused, handler: EventHandler<FocusedEvent>): void;

  removeHandler(type: EventType.FocusLost, handler: EventHandler<FocusLostEvent>): void;

  removeHandler(type: EventType.Resized, handler: EventHandler<ResizedEvent>): void;

  removeHandler(type: EventType.ClipboardCut, handler: EventHandler<ClipboardCutEvent>): void;

  removeHandler(type: EventType.ClipboardCopy, handler: EventHandler<ClipboardCopyEvent>): void;

  removeHandler(type: EventType.ClipboardPaste, handler: EventHandler<ClipboardPasteEvent>): void;

  removeHandler(type: EventType.KeyDown, handler: EventHandler<KeyDownEvent>): void;

  removeHandler(type: EventType.KeyPress, handler: EventHandler<KeyPressEvent>): void;

  removeHandler(type: EventType.KeyUp, handler: EventHandler<KeyUpEvent>): void;

  removeHandler(type: EventType.PointerMove, handler: EventHandler<PointerMoveEvent>): void;

  removeHandler(type: EventType.PointerDown, handler: EventHandler<PointerDownEvent>): void;

  removeHandler(type: EventType.PointerUp, handler: EventHandler<PointerUpEvent>): void;

  removeHandler(type: EventType.Wheel, handler: EventHandler<WheelEvent>): void;

  dispatchEvents(): void;

  queueEvent(event: IOEvent): void;
}

/**
 * Simple array-based implementation for {@link IOEventDispatcher}
 */
export class SimpleIOEventDispatcher implements IOEventDispatcher {
  private handlers: EventHandler<IOEvent>[][] = [];
  private eventQueue: IOEvent[] = [];

  constructor(readonly suppressHandlerExceptions: boolean) {
    for (let i = 0; i < EventType.LENGTH; i++) {
      this.handlers.push([]);
    }
  }

  addHandler<T extends IOEvent>(type: EventType, handler: EventHandler<T>): void {
    this.handlers[type].push(handler as EventHandler<IOEvent>);
  }

  removeHandler<T extends IOEvent>(type: EventType, handler: EventHandler<T>): void {
    const loc = this.handlers[type].findIndex(v => v === handler);
    if (loc !== -1) {
      this.handlers[type].splice(loc, 1);
    }
  }

  dispatchEvents(): void {
    let processed = 0;
    try {
      for (; processed < this.eventQueue.length; processed++) {
        const nextEvent = this.eventQueue[processed];
        const chain = this.handlers[nextEvent.type];
        // Propagate each event down the chain until one returns true
        for (const handler of chain) {
          if (handler(nextEvent)) {
            break;
          }
        }
      }

      this.eventQueue = []; // Clear all
    } catch (e) {
      // Splice processed events from the front
      if (processed > 0) {
        this.eventQueue.splice(0, processed);
      }
      if (!this.suppressHandlerExceptions) {
        throw e;
      }
    }
  }

  queueEvent(event: IOEvent): void {
    this.eventQueue.push(event);
  }
}
