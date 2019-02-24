import * as IOEvent from 'IO/event';
import * as ImGui from 'ImGui/imgui';

/**
 * This connector class passes through data between iostate <---> ImGui's own representation of the io state.
 * Depends on {@link EventDispatcher} for IO events
 */
export class ImGuiIOConnector {
  // Array index: The MouseCode as given by javascript event handler
  //        value: The mapped ImGuiIO.MouseDown value
  //              Mouse buttons: 0=left, 1=right, 2=middle + extras.
  private readonly MOUSE_BUTTON_MAP: number[] = [
    0, // Left Button
    2, // Middle Button
    1, // Right Button
    3, // Back Button
    4, // Forward Button
  ];

  init(dispatcher: IOEvent.EventDispatcher) {
    // Focus lost handler
    dispatcher.addHandler(IOEvent.EventType.FocusLost, event => {
      const io = ImGui.GetIO();
      io.KeyCtrl = false;
      io.KeyShift = false;
      io.KeyAlt = false;
      io.KeySuper = false;
      for (let i = 0; i < io.KeysDown.length; ++i) {
        io.KeysDown[i] = false;
      }
      for (let i = 0; i < io.MouseDown.length; ++i) {
        io.MouseDown[i] = false;
      }
      return false;
    });

    // Keydown handler
    dispatcher.addHandler(IOEvent.EventType.KeyDown, event => {
      const io = ImGui.GetIO();
      io.KeyCtrl = event.ctrlKey;
      io.KeyShift = event.shiftKey;
      io.KeyAlt = event.altKey;
      io.KeySuper = event.metaKey;
      ImGui.IM_ASSERT(event.keyCode >= 0 && event.keyCode < ImGui.IM_ARRAYSIZE(io.KeysDown));
      io.KeysDown[event.keyCode] = true;
      return io.WantCaptureKeyboard;
    });

    // keypress handler
    dispatcher.addHandler(IOEvent.EventType.KeyPress, event => {
      const io = ImGui.GetIO();
      io.AddInputCharacter(event.charCode);
      return io.WantCaptureKeyboard;
    });

    // keyup handler
    dispatcher.addHandler(IOEvent.EventType.KeyUp, event => {
      const io = ImGui.GetIO();
      io.KeyCtrl = event.ctrlKey;
      io.KeyShift = event.shiftKey;
      io.KeyAlt = event.altKey;
      io.KeySuper = event.metaKey;
      ImGui.IM_ASSERT(event.keyCode >= 0 && event.keyCode < ImGui.IM_ARRAYSIZE(io.KeysDown));
      io.KeysDown[event.keyCode] = false;
      return io.WantCaptureKeyboard;
    });

    // pointermove handler
    dispatcher.addHandler(IOEvent.EventType.PointerMove, event => {
      const io = ImGui.GetIO();
      io.MousePos.x = event.offsetX;
      io.MousePos.y = event.offsetY;
      return io.WantCaptureMouse;
    });

    // pointerdown handler
    dispatcher.addHandler(IOEvent.EventType.PointerDown, event => {
      const io = ImGui.GetIO();
      io.MousePos.x = event.offsetX;
      io.MousePos.y = event.offsetY;
      io.MouseDown[this.MOUSE_BUTTON_MAP[event.button]] = true;
      return io.WantCaptureMouse;
    });

    // pointerup handler
    dispatcher.addHandler(IOEvent.EventType.PointerUp, event => {
      const io = ImGui.GetIO();
      io.MouseDown[this.MOUSE_BUTTON_MAP[event.button]] = false;
      return io.WantCaptureMouse;
    });

    // wheel
    dispatcher.addHandler(IOEvent.EventType.Wheel, event => {
      const io = ImGui.GetIO();
      let scale: number = 1.0;
      switch (event.deltaMode) {
        case WheelEvent.DOM_DELTA_PIXEL:
          scale = 0.01;
          break;
        case WheelEvent.DOM_DELTA_LINE:
          scale = 0.2;
          break;
        case WheelEvent.DOM_DELTA_PAGE:
          scale = 1.0;
          break;
      }
      io.MouseWheelH = event.deltaX * scale;
      io.MouseWheel = -event.deltaY * scale; // Mouse wheel: 1 unit scrolls about 5 lines text.
      return io.WantCaptureMouse;
    });
  }
}
