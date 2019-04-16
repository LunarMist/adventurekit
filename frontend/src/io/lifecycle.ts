import * as IOEvent from 'IO/event';
import { KeyCodes } from 'IO/codes';
import { EventDispatchedIOState } from 'IO/state';

interface LifeCycle {
  init(): void;

  startFrame(): void;

  endFrame(): void;

  destroy(): void;
}

// These keys have the chance to mess up the canvas/page when pressed
// Ensure e.preventDefault() is called for the keydown event
// Since they do not produce keypress events, we can safely do this without affecting functionality
const KEYDOWN_PREVENT_DEFAULTS = new Set([
  KeyCodes.Tab,
  KeyCodes.LeftArrow,
  KeyCodes.RightArrow,
  KeyCodes.UpArrow,
  KeyCodes.DownArrow,
  KeyCodes.PageUp,
  KeyCodes.PageDown,
  KeyCodes.Home,
  KeyCodes.End,
]);

/**
 * {@link LifeCycle implementation for javascript io events}
 */
export class IOLifeCycle implements LifeCycle {
  readonly dispatcher: IOEvent.IOEventDispatcher;
  readonly ioState: EventDispatchedIOState;

  constructor(readonly element: HTMLElement) {
    this.dispatcher = new IOEvent.SimpleIOEventDispatcher(false);
    this.ioState = new EventDispatchedIOState();
  }

  init(): void {
    // For iostate init
    const hasFocus = document.activeElement === this.element;

    // MUST be the first thing called, so the iostate callbacks are the first ones registered
    this.ioState.init(this.dispatcher, hasFocus);

    // https://developer.mozilla.org/en-US/docs/Web/Events/focus
    this.element.addEventListener('focus', e => {
      this.dispatcher.queueEvent(new IOEvent.FocusedEvent());
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/blur
    this.element.addEventListener('blur', e => {
      this.dispatcher.queueEvent(new IOEvent.FocusLostEvent());
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/resize
    window.addEventListener('resize', e => {
      this.dispatcher.queueEvent(new IOEvent.ResizedEvent());
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/cut
    document.body.addEventListener('cut', e => {
      if (e.clipboardData === null) {
        return;
      }
      const text = e.clipboardData.getData('text/plain');
      this.dispatcher.queueEvent(new IOEvent.ClipboardCutEvent(text));
      e.preventDefault();
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/copy
    document.body.addEventListener('copy', e => {
      if (e.clipboardData === null) {
        return;
      }
      const text = e.clipboardData.getData('text/plain');
      this.dispatcher.queueEvent(new IOEvent.ClipboardCopyEvent(text));
      e.preventDefault();
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/paste
    document.body.addEventListener('paste', e => {
      if (e.clipboardData === null) {
        return;
      }
      const text = e.clipboardData.getData('text/plain');
      this.dispatcher.queueEvent(new IOEvent.ClipboardPasteEvent(text));
      this.ioState.clipboardText = text;
      e.preventDefault();
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/keydown
    this.element.addEventListener('keydown', e => {
      this.dispatcher.queueEvent(new IOEvent.KeyDownEvent(
        e.char, e.key, e.code, e.charCode, e.keyCode, e.which, e.repeat, e.location, e.ctrlKey, e.shiftKey, e.altKey, e.metaKey
      ));
      // Ignore certain keys that will mess up the canvas and stuff
      if (KEYDOWN_PREVENT_DEFAULTS.has(e.keyCode)) {
        e.preventDefault();
      }
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/keypress
    this.element.addEventListener('keypress', e => {
      this.dispatcher.queueEvent(new IOEvent.KeyPressEvent(
        e.char, e.key, e.code, e.charCode, e.keyCode, e.which, e.repeat, e.location, e.ctrlKey, e.shiftKey, e.altKey, e.metaKey
      ));
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/keyup
    this.element.addEventListener('keyup', e => {
      this.dispatcher.queueEvent(new IOEvent.KeyUpEvent(
        e.char, e.key, e.code, e.charCode, e.keyCode, e.which, e.repeat, e.location, e.ctrlKey, e.shiftKey, e.altKey, e.metaKey
      ));
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/pointermove
    this.element.addEventListener('pointermove', e => {
      this.dispatcher.queueEvent(new IOEvent.PointerMoveEvent(
        e.altKey, e.button, e.buttons, e.offsetX, e.offsetY, e.ctrlKey, e.metaKey, e.movementX, e.movementY, e.shiftKey, e.which,
        e.height, e.isPrimary, e.pointerId, e.pointerType, e.pressure, e.tangentialPressure, e.tiltX, e.tiltY, e.twist, e.width
      ));
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/pointerdown
    this.element.addEventListener('pointerdown', e => {
      this.dispatcher.queueEvent(new IOEvent.PointerDownEvent(
        e.altKey, e.button, e.buttons, e.offsetX, e.offsetY, e.ctrlKey, e.metaKey, e.movementX, e.movementY, e.shiftKey, e.which,
        e.height, e.isPrimary, e.pointerId, e.pointerType, e.pressure, e.tangentialPressure, e.tiltX, e.tiltY, e.twist, e.width
      ));
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/pointerup
    this.element.addEventListener('pointerup', e => {
      this.dispatcher.queueEvent(new IOEvent.PointerUpEvent(
        e.altKey, e.button, e.buttons, e.offsetX, e.offsetY, e.ctrlKey, e.metaKey, e.movementX, e.movementY, e.shiftKey, e.which,
        e.height, e.isPrimary, e.pointerId, e.pointerType, e.pressure, e.tangentialPressure, e.tiltX, e.tiltY, e.twist, e.width
      ));
    });

    // https://developer.mozilla.org/en-US/docs/Web/Events/wheel
    this.element.addEventListener('wheel', e => {
      this.dispatcher.queueEvent(new IOEvent.WheelEvent(
        e.altKey, e.button, e.buttons, e.offsetX, e.offsetY, e.ctrlKey, e.metaKey, e.movementX, e.movementY, e.shiftKey, e.which,
        e.deltaMode, e.deltaX, e.deltaY, e.deltaZ
      ));
      e.preventDefault();
    });
  }

  startFrame(): void {
    this.dispatcher.dispatchEvents();
  }

  endFrame(): void {

  }

  destroy(): void {
    // TODO: Remove handlers?
  }
}
