import * as IOEvent from "IO/event";
import {KeyCodes} from "IO/codes";

/**
 * A {@link State} implementation tracks the current IO state; clipboard, keys, pointer(s), etc...
 */
export interface State {
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
 * Implementation of {@link State} that depends on an {@link EventDispatcher}
 */
export class IOState implements State {
  /*** State ***/
  hasFocus: boolean = false;
  clipboardText: string = "";

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

  private static readonly KeyUpMetaResetKeys = [
    KeyCodes.A, KeyCodes.C, KeyCodes.V, KeyCodes.X, KeyCodes.Y, KeyCodes.Z
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

  private dispatchFakeKeyUpEvent(dispatcher: IOEvent.EventDispatcher, keyCode: number) {
    const prevKeyDown = this.keyDownEvents[keyCode];
    let fakeEvent: IOEvent.KeyUpEvent;
    if (prevKeyDown !== null) {
      fakeEvent = new IOEvent.KeyUpEvent(
        prevKeyDown.char, prevKeyDown.key, prevKeyDown.code, prevKeyDown.charCode, keyCode, keyCode, false, prevKeyDown.location, false, false, false, false
      );
    } else {
      fakeEvent = new IOEvent.KeyUpEvent(
        "", "", "", 0, keyCode, keyCode, false, 0, false, false, false, false
      );
    }
    // console.log("Dispatching fake event:");
    // console.log(fakeEvent);
    dispatcher.queueEvent(fakeEvent);
  }

  private dispatchFakePointerUpEvent(dispatcher: IOEvent.EventDispatcher, mouseCode: number) {
    const fakeEvent = new IOEvent.PointerUpEvent(
      false, mouseCode, 0, this.pointerX, this.pointerY, false, false, 0, 0, false, 0,
      this.pointerHeight, true, 1, "mouse", this.pointerPressure, 0, this.pointerTiltX, this.pointerTiltY,
      0, this.pointerWidth
    );
    // console.log("Dispatching fake event:");
    // console.log(fakeEvent);
    dispatcher.queueEvent(fakeEvent);
  }

  /*** Handlers ***/

  init(dispatcher: IOEvent.EventDispatcher, hasFocus: boolean) {
    // Init state
    this.hasFocus = hasFocus;

    const self = this;

    // Focus gained handler
    dispatcher.addHandler(IOEvent.EventType.Focused, new class implements IOEvent.EventHandler<IOEvent.FocusedEvent> {
      public process(event: IOEvent.FocusedEvent): boolean {
        self.hasFocus = true;
        return false; // Always propagate
      }
    });

    // Focus lost handler
    dispatcher.addHandler(IOEvent.EventType.FocusLost, new class implements IOEvent.EventHandler<IOEvent.FocusLostEvent> {
      public process(event: IOEvent.FocusLostEvent): boolean {
        self.hasFocus = false;
        // Unset stuff
        for (let i = 0; i < self.keysDown.length; ++i) {
          if (self.keysDown[i]) {
            self.dispatchFakeKeyUpEvent(dispatcher, i);
          }
        }
        for (let i = 0; i < self.pointerDown.length; ++i) {
          if (self.pointerDown[i]) {
            self.dispatchFakePointerUpEvent(dispatcher, i);
          }
        }
        return false; // Always propagate
      }
    });

    // ! Clipboard events not handled here !

    // Keydown handler
    dispatcher.addHandler(IOEvent.EventType.KeyDown, new class implements IOEvent.EventHandler<IOEvent.KeyDownEvent> {
      public process(event: IOEvent.KeyDownEvent): boolean {
        self.keysDown[event.keyCode] = true;
        self.keyDownEvents[event.keyCode] = event; // Save a copy of the down event
        return false; // Always propagate
      }
    });

    // keyup handler
    dispatcher.addHandler(IOEvent.EventType.KeyUp, new class implements IOEvent.EventHandler<IOEvent.KeyUpEvent> {
      public process(event: IOEvent.KeyUpEvent): boolean {
        self.keysDown[event.keyCode] = false;
        // Because of osx metakey weirdness,
        // unset the states for some of the keys
        if (event.keyCode == KeyCodes.LeftWindowKey || event.keyCode == KeyCodes.RightWindowKey) {
          IOState.KeyUpMetaResetKeys.map(k => {
            self.dispatchFakeKeyUpEvent(dispatcher, k);
          });
        }
        return false; // Always propagate
      }
    });

    // pointermove handler
    dispatcher.addHandler(IOEvent.EventType.PointerMove, new class implements IOEvent.EventHandler<IOEvent.PointerMoveEvent> {
      public process(event: IOEvent.PointerMoveEvent): boolean {
        self.pointerX = event.offsetX;
        self.pointerY = event.offsetY;
        self.pointerPressure = event.pressure;
        self.pointerTiltX = event.tiltX;
        self.pointerTiltY = event.tiltY;
        self.pointerWidth = event.width;
        self.pointerHeight = event.height;
        return false; // Always propagate
      }
    });

    // pointerdown handler
    dispatcher.addHandler(IOEvent.EventType.PointerDown, new class implements IOEvent.EventHandler<IOEvent.PointerDownEvent> {
      public process(event: IOEvent.PointerDownEvent): boolean {
        self.pointerX = event.offsetX;
        self.pointerY = event.offsetY;
        self.pointerPressure = event.pressure;
        self.pointerTiltX = event.tiltX;
        self.pointerTiltY = event.tiltY;
        self.pointerWidth = event.width;
        self.pointerHeight = event.height;
        self.pointerDown[event.button] = true;
        return false; // Always propagate
      }
    });

    // pointerup handler
    dispatcher.addHandler(IOEvent.EventType.PointerUp, new class implements IOEvent.EventHandler<IOEvent.PointerUpEvent> {
      public process(event: IOEvent.PointerUpEvent): boolean {
        self.pointerX = event.offsetX;
        self.pointerY = event.offsetY;
        self.pointerPressure = event.pressure;
        self.pointerTiltX = event.tiltX;
        self.pointerTiltY = event.tiltY;
        self.pointerWidth = event.width;
        self.pointerHeight = event.height;
        self.pointerDown[event.button] = false;
        return false; // Always propagate
      }
    });
  }
}
