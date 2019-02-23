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
    const self = this;

    // Focus lost handler
    dispatcher.addHandler(IOEvent.EventType.FocusLost, new class implements IOEvent.EventHandler<IOEvent.FocusLostEvent> {
      public process(event: IOEvent.FocusLostEvent): boolean {
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
      }
    });

    // Keydown handler
    dispatcher.addHandler(IOEvent.EventType.KeyDown, new class implements IOEvent.EventHandler<IOEvent.KeyDownEvent> {
      public process(event: IOEvent.KeyDownEvent): boolean {
        const io = ImGui.GetIO();
        io.KeyCtrl = event.ctrlKey;
        io.KeyShift = event.shiftKey;
        io.KeyAlt = event.altKey;
        io.KeySuper = event.metaKey;
        ImGui.IM_ASSERT(event.keyCode >= 0 && event.keyCode < ImGui.IM_ARRAYSIZE(io.KeysDown));
        io.KeysDown[event.keyCode] = true;
        return io.WantCaptureKeyboard;
      }
    });

    // keypress handler
    dispatcher.addHandler(IOEvent.EventType.KeyPress, new class implements IOEvent.EventHandler<IOEvent.KeyPressEvent> {
      public process(event: IOEvent.KeyPressEvent): boolean {
        const io = ImGui.GetIO();
        io.AddInputCharacter(event.charCode);
        return io.WantCaptureKeyboard;
      }
    });

    // keyup handler
    dispatcher.addHandler(IOEvent.EventType.KeyUp, new class implements IOEvent.EventHandler<IOEvent.KeyUpEvent> {
      public process(event: IOEvent.KeyUpEvent): boolean {
        const io = ImGui.GetIO();
        io.KeyCtrl = event.ctrlKey;
        io.KeyShift = event.shiftKey;
        io.KeyAlt = event.altKey;
        io.KeySuper = event.metaKey;
        ImGui.IM_ASSERT(event.keyCode >= 0 && event.keyCode < ImGui.IM_ARRAYSIZE(io.KeysDown));
        io.KeysDown[event.keyCode] = false;
        return io.WantCaptureKeyboard;
      }
    });

    // pointermove handler
    dispatcher.addHandler(IOEvent.EventType.PointerMove, new class implements IOEvent.EventHandler<IOEvent.PointerMoveEvent> {
      public process(event: IOEvent.PointerMoveEvent): boolean {
        const io = ImGui.GetIO();
        io.MousePos.x = event.offsetX;
        io.MousePos.y = event.offsetY;
        return io.WantCaptureMouse;
      }
    });

    // pointerdown handler
    dispatcher.addHandler(IOEvent.EventType.PointerDown, new class implements IOEvent.EventHandler<IOEvent.PointerDownEvent> {
      public process(event: IOEvent.PointerDownEvent): boolean {
        const io = ImGui.GetIO();
        io.MousePos.x = event.offsetX;
        io.MousePos.y = event.offsetY;
        io.MouseDown[self.MOUSE_BUTTON_MAP[event.button]] = true;
        return io.WantCaptureMouse;
      }
    });

    // pointerup handler
    dispatcher.addHandler(IOEvent.EventType.PointerUp, new class implements IOEvent.EventHandler<IOEvent.PointerUpEvent> {
      public process(event: IOEvent.PointerUpEvent): boolean {
        const io = ImGui.GetIO();
        io.MouseDown[self.MOUSE_BUTTON_MAP[event.button]] = false;
        return io.WantCaptureMouse;
      }
    });

    // wheel
    dispatcher.addHandler(IOEvent.EventType.Wheel, new class implements IOEvent.EventHandler<IOEvent.WheelEvent> {
      public process(event: IOEvent.WheelEvent): boolean {
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
      }
    });
  }
}
