import { SimpleRenderComponent } from 'GL/render';
import * as ImGui from 'ImGui/imgui';
import { KeyCodes, MouseCodes } from 'IO/codes';
import * as IOEvent from 'IO/event';

export class IOStateUIComponent extends SimpleRenderComponent {
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

  init(): void {
    this.dispatcher.addHandler(IOEvent.EventType.KeyPress, event => {
      this.charBuffer += event.key;
      return false; // Always propagate
    });
  }

  render(): void {
    if (!ImGui.Begin('IO State', null, ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.CollapsingHeader('Keyboard', ImGui.ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.BeginGroup();
      ImGui.PushStyleVar(ImGui.ImGuiStyleVar.FrameRounding, 3.0);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Escape], 'Esc', false);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F1], 'F1', true, this.FUNCTION_KEY_SPACING);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F2], 'F2');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F3], 'F3');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F4], 'F4');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F5], 'F5', true, this.FUNCTION_KEY_SPACING);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F6], 'F6');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F7], 'F7');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F8], 'F8');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F9], 'F9', true, this.FUNCTION_KEY_SPACING);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F10], 'F10');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F11], 'F11');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F12], 'F12');

      this.showKeyStatus(this.io.keysDown[KeyCodes.Tilde], '~', false);
      this.showKeyStatus(this.io.keysDown[KeyCodes.One], '1');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Two], '2');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Three], '3');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Four], '4');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Five], '5');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Six], '6');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Seven], '7');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Eight], '8');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Nine], '9');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Zero], '0');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Dash], '-');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Equals], '=');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Backspace], '<-', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE2);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Insert], 'Ins', true, this.SIDE_KEY_SPACING, this.KEY_SIZE);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Home], 'Hm');
      this.showKeyStatus(this.io.keysDown[KeyCodes.PageUp], 'PgU');

      this.showKeyStatus(this.io.keysDown[KeyCodes.Tab], 'Tab', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Q], 'Q');
      this.showKeyStatus(this.io.keysDown[KeyCodes.W], 'W');
      this.showKeyStatus(this.io.keysDown[KeyCodes.E], 'E');
      this.showKeyStatus(this.io.keysDown[KeyCodes.R], 'R');
      this.showKeyStatus(this.io.keysDown[KeyCodes.T], 'T');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Y], 'Y');
      this.showKeyStatus(this.io.keysDown[KeyCodes.U], 'U');
      this.showKeyStatus(this.io.keysDown[KeyCodes.I], 'I');
      this.showKeyStatus(this.io.keysDown[KeyCodes.O], 'O');
      this.showKeyStatus(this.io.keysDown[KeyCodes.P], 'P');
      this.showKeyStatus(this.io.keysDown[KeyCodes.OpenBracket], '[');
      this.showKeyStatus(this.io.keysDown[KeyCodes.ClosedBracket], ']');
      this.showKeyStatus(this.io.keysDown[KeyCodes.BackSlash], '\\', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Delete], 'Del', true, this.SIDE_KEY_SPACING, this.KEY_SIZE);
      this.showKeyStatus(this.io.keysDown[KeyCodes.End], 'End');
      this.showKeyStatus(this.io.keysDown[KeyCodes.PageDown], 'PgD');

      this.showKeyStatus(this.io.keysDown[KeyCodes.CapsLock], 'Caps', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.A], 'A');
      this.showKeyStatus(this.io.keysDown[KeyCodes.S], 'S');
      this.showKeyStatus(this.io.keysDown[KeyCodes.D], 'D');
      this.showKeyStatus(this.io.keysDown[KeyCodes.F], 'F');
      this.showKeyStatus(this.io.keysDown[KeyCodes.G], 'G');
      this.showKeyStatus(this.io.keysDown[KeyCodes.H], 'H');
      this.showKeyStatus(this.io.keysDown[KeyCodes.J], 'J');
      this.showKeyStatus(this.io.keysDown[KeyCodes.K], 'K');
      this.showKeyStatus(this.io.keysDown[KeyCodes.L], 'L');
      this.showKeyStatus(this.io.keysDown[KeyCodes.SemiColon], ';');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Quote], "'");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Enter], 'Ret', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_25);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Shift], 'Shift', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_25);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Z], 'Z');
      this.showKeyStatus(this.io.keysDown[KeyCodes.X], 'X');
      this.showKeyStatus(this.io.keysDown[KeyCodes.C], 'C');
      this.showKeyStatus(this.io.keysDown[KeyCodes.V], 'V');
      this.showKeyStatus(this.io.keysDown[KeyCodes.B], 'B');
      this.showKeyStatus(this.io.keysDown[KeyCodes.N], 'N');
      this.showKeyStatus(this.io.keysDown[KeyCodes.M], 'M');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Comma], ',');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Period], '.');
      this.showKeyStatus(this.io.keysDown[KeyCodes.ForwardSlash], '/');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Shift], 'Shift', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_25);

      this.showKeyStatus(this.io.keysDown[KeyCodes.UpArrow], '^', true, this.UP_ARROW_KEY_SPACING, this.KEY_SIZE);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Ctrl], 'Ctrl', false, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.LeftWindowKey], 'Win');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Alt], 'Alt', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Space], 'Space', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_SPACE_BAR);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Alt], 'Alt', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.RightWindowKey], 'Win');
      this.showKeyStatus(this.io.keysDown[KeyCodes.Ctrl], 'Ctrl', true, this.EFFECTIVE_KEY_SPACING, this.KEY_SIZE_15);

      this.showKeyStatus(this.io.keysDown[KeyCodes.LeftArrow], '<', true, this.SIDE_KEY_SPACING, this.KEY_SIZE);
      this.showKeyStatus(this.io.keysDown[KeyCodes.DownArrow], 'v');
      this.showKeyStatus(this.io.keysDown[KeyCodes.RightArrow], '>');

      ImGui.PopStyleVar();
      ImGui.EndGroup();
    }

    if (ImGui.CollapsingHeader('Pointer', ImGui.ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.BeginGroup();
      this.showKeyStatus(this.io.pointerDown[MouseCodes.LeftButton], 'L', false, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.MiddleButton], 'M', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.RightButton], 'R', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.BackButton], '<', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.ForwardButton], '>', true, this.EFFECTIVE_KEY_SPACING, this.POINTER_KEY_SIZE);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`X: ${this.io.pointerX}`);
      ImGui.Text(`Y: ${this.io.pointerY}`);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`tiltX: ${this.io.pointerTiltX}`);
      ImGui.Text(`tiltY: ${this.io.pointerTiltY}`);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`width: ${this.io.pointerWidth}`);
      ImGui.Text(`height: ${this.io.pointerHeight}`);
      ImGui.EndGroup();

      ImGui.SameLine(0, 20);
      ImGui.BeginGroup();
      ImGui.Text(`pressure: ${this.io.pointerPressure}`);
      ImGui.EndGroup();
    }

    if (ImGui.CollapsingHeader('Other', ImGui.ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.TextColored(this.io.hasFocus ? this.TEXT_ACTIVE_COLOR : this.TEXT_INACTIVE_COLOR, 'Focused?');
      ImGui.TextWrapped(`Clipboard: ${this.io.clipboardText}`);
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
