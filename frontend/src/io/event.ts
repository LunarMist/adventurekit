/*! *****************************************************************************
* Steps to add a new event type:
* 1) Add a new entry to EventType at the end, but before LENGTH (event.ts)
* 2) Create the new Event object implementation (event.ts)
* 3) Add to State interface, as needed (state.ts)
* 4) Implement in IOState, as needed (state.ts)
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
export interface Event {
  readonly type: EventType;
}

export class FocusedEvent implements Event {
  readonly type = EventType.Focused;
}

export class FocusLostEvent implements Event {
  readonly type = EventType.FocusLost;
}

export class ResizedEvent implements Event {
  readonly type = EventType.Resized;
}

abstract class ClipboardTypeEvent implements Event {
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

abstract class KeyboardTypeEvent implements Event {
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

abstract class PointerTypeEvent implements Event {
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

export class WheelEvent implements Event {
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
export interface EventHandler<T extends Event> {
  process(event: T): boolean;
}

/**
 * Handles the work of dispatching IO events
 */
export interface EventDispatcher {
  addHandler(type: EventType, handler: EventHandler<Event>): void;

  removeHandler(type: EventType, handler: EventHandler<Event>): void;

  dispatchEvents(): void;

  queueEvent(event: Event): void;
}

/**
 * Simple array-based implementation for {@link EventDispatcher}
 */
export class SimpleEventDispatcher implements EventDispatcher {
  private handlers: EventHandler<Event>[][] = [];
  private eventQueue: Event[] = [];

  constructor(readonly suppressHandlerExceptions: boolean) {
    for (let i = 0; i < EventType.LENGTH; i++) {
      this.handlers.push([]);
    }
  }

  addHandler(type: EventType, handler: EventHandler<Event>): void {
    this.handlers[type].push(handler);
  }

  removeHandler(type: EventType, handler: EventHandler<Event>): void {
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
          if (handler.process(nextEvent)) {
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

  queueEvent(event: Event): void {
    this.eventQueue.push(event);
  }
}
