import * as IOEvent from 'IO/event';
import { KeyCodes } from 'IO/codes';

/**
 * A {@link IOState} implementation tracks the current IO state; clipboard, keys, pointer(s), etc...
 */
export interface IOState {
  readonly hasFocus: boolean; // True if target element has focus
  readonly clipboardText: string; // The clipboard data as text

  readonly keysDown: boolean[]; // Array of virtual keycodes representing keydowns

  readonly pointerX: number; // Pointer x
  readonly pointerY: number; // Pointer y
  readonly pointerPressure: number; // Pointer pressure value [0, 1]
  readonly pointerTiltX: number; // Pointer x tilt
  readonly pointerTiltY: number; // Pointer y tilt
  readonly pointerWidth: number; // Pointer width (fatness)
  readonly pointerHeight: number; // Pointer height (fatness)
  readonly pointerDown: boolean[]; // Array of pointer button values representing pointerdowns.
}

/**
 * Implementation of {@link IOState} that depends on an {@link IOEventDispatcher}
 */
export class EventDispatchedIOState implements IOState {
  /*** State ***/
  hasFocus: boolean = false;
  clipboardText: string = '';

  keysDown: boolean[] = [];

  pointerX: number = 0;
  pointerY: number = 0;
  pointerPressure: number = 0;
  pointerTiltX: number = 0;
  pointerTiltY: number = 0;
  pointerWidth: number = 0;
  pointerHeight: number = 0;
  pointerDown: boolean[] = [];

  keyDownEvents: (IOEvent.KeyDownEvent | null) [] = [];

  private static readonly KEY_UP_META_RESET_KEYS = [
    KeyCodes.A, KeyCodes.C, KeyCodes.V, KeyCodes.X, KeyCodes.Y, KeyCodes.Z,
  ];

  constructor() {
    for (let i = 0; i < 512; i++) {
      this.keysDown.push(false);
      this.keyDownEvents.push(null);
    }
    for (let i = 0; i < 5; i++) {
      this.pointerDown.push(false);
    }
  }

  private dispatchFakeKeyUpEvent(dispatcher: IOEvent.IOEventDispatcher, keyCode: number) {
    const prevKeyDown = this.keyDownEvents[keyCode];
    let fakeEvent: IOEvent.KeyUpEvent;
    if (prevKeyDown !== null) {
      fakeEvent = new IOEvent.KeyUpEvent(
        prevKeyDown.char, prevKeyDown.key, prevKeyDown.code, prevKeyDown.charCode, keyCode, keyCode, false,
        prevKeyDown.location, false, false, false, false
      );
    } else {
      fakeEvent = new IOEvent.KeyUpEvent(
        '', '', '', 0, keyCode, keyCode, false, 0, false, false, false, false
      );
    }
    // console.log("Dispatching fake event:");
    // console.log(fakeEvent);
    dispatcher.queueEvent(fakeEvent);
  }

  private dispatchFakePointerUpEvent(dispatcher: IOEvent.IOEventDispatcher, mouseCode: number) {
    const fakeEvent = new IOEvent.PointerUpEvent(
      false, mouseCode, 0, this.pointerX, this.pointerY, false, false, 0, 0, false, 0,
      this.pointerHeight, true, 1, 'mouse', this.pointerPressure, 0, this.pointerTiltX, this.pointerTiltY,
      0, this.pointerWidth
    );
    // console.log("Dispatching fake event:");
    // console.log(fakeEvent);
    dispatcher.queueEvent(fakeEvent);
  }

  /*** Handlers ***/

  init(dispatcher: IOEvent.IOEventDispatcher, hasFocus: boolean) {
    // Init state
    this.hasFocus = hasFocus;

    // Focus gained handler
    dispatcher.addHandler(IOEvent.EventType.Focused, event => {
      this.hasFocus = true;
      return false; // Always propagate
    });

    // Focus lost handler
    dispatcher.addHandler(IOEvent.EventType.FocusLost, event => {
      this.hasFocus = false;
      // Unset stuff
      for (let i = 0; i < this.keysDown.length; i++) {
        if (this.keysDown[i]) {
          this.dispatchFakeKeyUpEvent(dispatcher, i);
        }
      }
      for (let i = 0; i < this.pointerDown.length; i++) {
        if (this.pointerDown[i]) {
          this.dispatchFakePointerUpEvent(dispatcher, i);
        }
      }
      return false; // Always propagate
    });

    // ! Clipboard events not handled here !

    // Keydown handler
    dispatcher.addHandler(IOEvent.EventType.KeyDown, event => {
      this.keysDown[event.keyCode] = true;
      this.keyDownEvents[event.keyCode] = event; // Save a copy of the down event
      return false; // Always propagate
    });

    // keyup handler
    dispatcher.addHandler(IOEvent.EventType.KeyUp, event => {
      this.keysDown[event.keyCode] = false;
      // Because of osx metakey weirdness,
      // unset the states for some of the keys
      if (event.keyCode === KeyCodes.LeftWindowKey || event.keyCode === KeyCodes.RightWindowKey) {
        EventDispatchedIOState.KEY_UP_META_RESET_KEYS.map(k => {
          this.dispatchFakeKeyUpEvent(dispatcher, k);
        });
      }
      return false; // Always propagate
    });

    // pointermove handler
    dispatcher.addHandler(IOEvent.EventType.PointerMove, event => {
      this.pointerX = event.offsetX;
      this.pointerY = event.offsetY;
      this.pointerPressure = event.pressure;
      this.pointerTiltX = event.tiltX;
      this.pointerTiltY = event.tiltY;
      this.pointerWidth = event.width;
      this.pointerHeight = event.height;
      return false; // Always propagate
    });

    // pointerdown handler
    dispatcher.addHandler(IOEvent.EventType.PointerDown, event => {
      this.pointerX = event.offsetX;
      this.pointerY = event.offsetY;
      this.pointerPressure = event.pressure;
      this.pointerTiltX = event.tiltX;
      this.pointerTiltY = event.tiltY;
      this.pointerWidth = event.width;
      this.pointerHeight = event.height;
      this.pointerDown[event.button] = true;
      return false; // Always propagate
    });

    // pointerup handler
    dispatcher.addHandler(IOEvent.EventType.PointerUp, event => {
      this.pointerX = event.offsetX;
      this.pointerY = event.offsetY;
      this.pointerPressure = event.pressure;
      this.pointerTiltX = event.tiltX;
      this.pointerTiltY = event.tiltY;
      this.pointerWidth = event.width;
      this.pointerHeight = event.height;
      this.pointerDown[event.button] = false;
      return false; // Always propagate
    });
  }
}
