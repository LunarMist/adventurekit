import * as ImGui from 'ImGui/imgui';
import { KeyCodes, MouseCodes } from 'IO/codes';
import * as IOEvent from 'IO/event';
import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';

export class IOStateUIComponent extends WindowRenderComponent {
  // Colors
  private readonly KEY_RESTING_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(211 / 255, 211 / 255, 211 / 255, 1.0);
  private readonly KEY_DOWN_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly KEY_TEXT_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(0, 0, 0, 1);
  private readonly TEXT_ACTIVE_COLOR: ImGui.ImVec4 = this.KEY_DOWN_COLOR;
  private readonly TEXT_INACTIVE_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  // Stats
  private readonly KEY_WIDTH = 30.0;
  private readonly KEY_HEIGHT = 20.0;
  private readonly KEY_MARGIN = 1.0;
  private readonly KEYS_PER_LINE = 15;
  private readonly EFFECTIVE_KEY_SPACING = this.KEY_MARGIN * 2;
  private readonly FULL_KEY_WIDTH = this.KEY_WIDTH + this.KEY_MARGIN * 2;
  private readonly FULL_KEYBOARD_WITH = this.KEYS_PER_LINE * this.FULL_KEY_WIDTH;
  private readonly FUNCTION_KEY_SPACING = (this.FULL_KEYBOARD_WITH - 13 * this.FULL_KEY_WIDTH + 6 * this.KEY_MARGIN) / 3.0;
  private readonly SIDE_KEY_SPACING = 15;
  private readonly UP_ARROW_KEY_SPACING = this.SIDE_KEY_SPACING + this.FULL_KEY_WIDTH;

  // Key sizes
  private readonly KEY_SIZE: ImGui.ImVec2 = new ImGui.ImVec2(this.KEY_WIDTH, this.KEY_HEIGHT);
  private readonly KEY_SIZE2: ImGui.ImVec2 = new ImGui.ImVec2(this.KEY_WIDTH * 2.0 + this.KEY_MARGIN * 2.0, this.KEY_HEIGHT);
  private readonly KEY_SIZE_15: ImGui.ImVec2 = new ImGui.ImVec2(this.KEY_WIDTH * 1.5 + this.KEY_MARGIN, this.KEY_HEIGHT);
  private readonly KEY_SIZE_25: ImGui.ImVec2 = new ImGui.ImVec2(this.KEY_WIDTH * 2.5 + this.KEY_MARGIN * 3, this.KEY_HEIGHT);
  private readonly KEY_SIZE_ALL: ImGui.ImVec2 = new ImGui.ImVec2(this.FULL_KEYBOARD_WITH - 2 * this.KEY_MARGIN, this.KEY_HEIGHT);
  private readonly KEY_SIZE_SPACE_BAR: ImGui.ImVec2 = new ImGui.ImVec2(this.FULL_KEYBOARD_WITH - 8 * this.FULL_KEY_WIDTH - 2 * this.KEY_MARGIN, this.KEY_HEIGHT);

  // Mouse sizes
  private readonly POINTER_KEY_SIZE: ImGui.ImVec2 = new ImGui.ImVec2(30, 40);

  // Buffer for keys
  private charBuffer = '';

  protected readonly windowId: WindowId = WindowId.IOState;

  init(): void {
    this.io.dispatcher.addHandler(IOEvent.EventType.KeyPress, event => {
      this.charBuffer += event.key;
      return false; // Always propagate
    });
  }

  render(): void {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('IO State', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.CollapsingHeader('Keyboard', ImGui.ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.BeginGroup();
      ImGui.PushStyleVar(ImGui.ImGuiStyleVar.FrameRounding, 3.0);

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Escape], 'Esc', false);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F1], 'F1', true, this.FUNCTION_KEY_SPACING);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F2], 'F2');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F3], 'F3');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F4], 'F4');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F5], 'F5', true, this.FUNCTION_KEY_SPACING);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F6], 'F6');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F7], 'F7');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F8], 'F8');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F9], 'F9', true, this.FUNCTION_KEY_SPACING);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F10], 'F10');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F11], 'F11');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F12], 'F12');

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Tilde], '~', false);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.One], '1');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Two], '2');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Three], '3');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Four], '4');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Five], '5');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Six], '6');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Seven], '7');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Eight], '8');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Nine], '9');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Zero], '0');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Dash], '-');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Equals], '=');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Backspace], '<-', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE2);

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Insert], 'Ins', true, this.SIDE_KEY_SPACING, this.KEY_SIZE);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Home], 'Hm');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.PageUp], 'PgU');

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Tab], 'Tab', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Q], 'Q');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.W], 'W');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.E], 'E');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.R], 'R');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.T], 'T');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Y], 'Y');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.U], 'U');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.I], 'I');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.O], 'O');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.P], 'P');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.OpenBracket], '[');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.ClosedBracket], ']');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.BackSlash], '\\', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Delete], 'Del', true, this.SIDE_KEY_SPACING, this.KEY_SIZE);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.End], 'End');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.PageDown], 'PgD');

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.CapsLock], 'Caps', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.A], 'A');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.S], 'S');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.D], 'D');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.F], 'F');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.G], 'G');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.H], 'H');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.J], 'J');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.K], 'K');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.L], 'L');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.SemiColon], ';');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Quote], "'");
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Enter], 'Ret', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_25);

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Shift], 'Shift', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_25);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Z], 'Z');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.X], 'X');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.C], 'C');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.V], 'V');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.B], 'B');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.N], 'N');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.M], 'M');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Comma], ',');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Period], '.');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.ForwardSlash], '/');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Shift], 'Shift', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_25);

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.UpArrow], '^', true, this.UP_ARROW_KEY_SPACING, this.KEY_SIZE);

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Ctrl], 'Ctrl', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.LeftWindowKey], 'Win');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Alt], 'Alt', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Space], 'Space', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_SPACE_BAR);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Alt], 'Alt', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.RightWindowKey], 'Win');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.Ctrl], 'Ctrl', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);

      this.showKeyStatus(this.io.state.keysDown[KeyCodes.LeftArrow], '<', true, this.SIDE_KEY_SPACING, this.KEY_SIZE);
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.DownArrow], 'v');
      this.showKeyStatus(this.io.state.keysDown[KeyCodes.RightArrow], '>');

      ImGui.PopStyleVar();
      ImGui.EndGroup();
    }

    if (ImGui.CollapsingHeader('Pointer', ImGui.ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.BeginGroup();
      this.showKeyStatus(this.io.state.pointerDown[MouseCodes.LeftButton], 'L', false, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.state.pointerDown[MouseCodes.MiddleButton], 'M', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.state.pointerDown[MouseCodes.RightButton], 'R', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.state.pointerDown[MouseCodes.BackButton], '<', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.state.pointerDown[MouseCodes.ForwardButton], '>', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`X: ${this.io.state.pointerX}`);
      ImGui.Text(`Y: ${this.io.state.pointerY}`);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`tiltX: ${this.io.state.pointerTiltX}`);
      ImGui.Text(`tiltY: ${this.io.state.pointerTiltY}`);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`width: ${this.io.state.pointerWidth}`);
      ImGui.Text(`height: ${this.io.state.pointerHeight}`);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`pressure: ${this.io.state.pointerPressure}`);
      ImGui.EndGroup();
    }

    if (ImGui.CollapsingHeader('Other', ImGui.ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.TextColored(this.io.state.hasFocus ? this.TEXT_ACTIVE_COLOR : this.TEXT_INACTIVE_COLOR, 'Focused?');
      ImGui.TextWrapped(`Clipboard: ${this.io.state.clipboardText}`);
      ImGui.TextWrapped(`Keypresses: ${this.charBuffer}`);
    }

    ImGui.End();
  }

  showKeyStatus(status: boolean, text: string, sameLine: boolean = true,
                spacing: number = this.EFFECTIVE_KEY_SPACING, size: ImGui.ImVec2 = this.KEY_SIZE) {
    if (sameLine) {
      ImGui.SameLine(0, spacing);
    }
    ImGui.PushStyleColor(ImGui.ImGuiCol.Button, status ? this.KEY_DOWN_COLOR : this.KEY_RESTING_COLOR);
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonHovered, status ? this.KEY_DOWN_COLOR : this.KEY_RESTING_COLOR);
    ImGui.PushStyleColor(ImGui.ImGuiCol.ButtonActive, status ? this.KEY_DOWN_COLOR : this.KEY_RESTING_COLOR);
    ImGui.PushStyleColor(ImGui.ImGuiCol.Text, this.KEY_TEXT_COLOR);
    ImGui.Button(text, size);
    ImGui.PopStyleColor(4);
  }
}
