import {SimpleRenderComponent} from "GL/render";
import * as ImGui from "ImGui/imgui";
import {ImGuiCol, ImGuiStyleVar, ImGuiTreeNodeFlags, ImGuiWindowFlags, ImVec2, ImVec4} from "ImGui/imgui";
import {KeyCodes, MouseCodes} from "IO/codes";
import * as IOEvent from "IO/event";

export class IOStateUIComponent extends SimpleRenderComponent {
  // Colors
  private readonly KeyRestingColor: ImVec4 = new ImVec4(211 / 255, 211 / 255, 211 / 255, 1.0);
  private readonly KeyDownColor: ImVec4 = new ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly KeyTextColor: ImVec4 = new ImVec4(0, 0, 0, 1);
  private readonly TextActiveColor: ImVec4 = this.KeyDownColor;
  private readonly TextInactiveColor: ImVec4 = new ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  // Stats
  private readonly KeyWidth = 30.0;
  private readonly KeyHeight = 20.0;
  private readonly KeyMargin = 1.0;
  private readonly KeysPerLine = 15;
  private readonly EffectiveKeySpacing = this.KeyMargin * 2;
  private readonly FullKeyWidth = this.KeyWidth + this.KeyMargin * 2;
  private readonly FullKeyboardWidth = this.KeysPerLine * this.FullKeyWidth;
  private readonly FunctionKeySpacing = (this.FullKeyboardWidth - 13 * this.FullKeyWidth + 6 * this.KeyMargin) / 3.0;
  private readonly SideKeysSpacing = 15;
  private readonly UpArrowKeySpacing = this.SideKeysSpacing + this.FullKeyWidth;

  // Key sizes
  private readonly KeySize: ImVec2 = new ImVec2(this.KeyWidth, this.KeyHeight);
  private readonly KeySize2: ImVec2 = new ImVec2(this.KeyWidth * 2.0 + this.KeyMargin * 2.0, this.KeyHeight);
  private readonly KeySize15: ImVec2 = new ImVec2(this.KeyWidth * 1.5 + this.KeyMargin, this.KeyHeight);
  private readonly KeySize25: ImVec2 = new ImVec2(this.KeyWidth * 2.5 + this.KeyMargin * 3, this.KeyHeight);
  private readonly KeySizeAll: ImVec2 = new ImVec2(this.FullKeyboardWidth - 2 * this.KeyMargin, this.KeyHeight);
  private readonly KeySizeSpaceBar: ImVec2 = new ImVec2(this.FullKeyboardWidth - 8 * this.FullKeyWidth - 2 * this.KeyMargin, this.KeyHeight);

  // Mouse sizes
  private readonly PointerKeySize: ImVec2 = new ImVec2(30, 40);

  // Buffer for keys
  private charBuffer = "";

  init(): void {
    const self = this;
    this.dispatcher.addHandler(IOEvent.EventType.KeyPress, new class implements IOEvent.EventHandler<IOEvent.KeyPressEvent> {
      public process(event: IOEvent.KeyPressEvent): boolean {
        self.charBuffer += event.key;
        return false; // Always propagate
      }
    });
  }

  render(): void {
    if (!ImGui.Begin("IO State", null, ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.CollapsingHeader("Keyboard", ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.BeginGroup();
      ImGui.PushStyleVar(ImGuiStyleVar.FrameRounding, 3.0);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Escape], "Esc", false);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F1], "F1", true, this.FunctionKeySpacing);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F2], "F2");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F3], "F3");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F4], "F4");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F5], "F5", true, this.FunctionKeySpacing);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F6], "F6");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F7], "F7");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F8], "F8");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F9], "F9", true, this.FunctionKeySpacing);
      this.showKeyStatus(this.io.keysDown[KeyCodes.F10], "F10");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F11], "F11");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F12], "F12");

      this.showKeyStatus(this.io.keysDown[KeyCodes.Tilde], "~", false);
      this.showKeyStatus(this.io.keysDown[KeyCodes.One], "1");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Two], "2");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Three], "3");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Four], "4");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Five], "5");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Six], "6");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Seven], "7");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Eight], "8");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Nine], "9");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Zero], "0");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Dash], "-");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Equals], "=");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Backspace], "<-", true, this.EffectiveKeySpacing, this.KeySize2);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Insert], "Ins", true, this.SideKeysSpacing, this.KeySize);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Home], "Hm");
      this.showKeyStatus(this.io.keysDown[KeyCodes.PageUp], "PgU");

      this.showKeyStatus(this.io.keysDown[KeyCodes.Tab], "Tab", false, this.EffectiveKeySpacing, this.KeySize15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Q], "Q");
      this.showKeyStatus(this.io.keysDown[KeyCodes.W], "W");
      this.showKeyStatus(this.io.keysDown[KeyCodes.E], "E");
      this.showKeyStatus(this.io.keysDown[KeyCodes.R], "R");
      this.showKeyStatus(this.io.keysDown[KeyCodes.T], "T");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Y], "Y");
      this.showKeyStatus(this.io.keysDown[KeyCodes.U], "U");
      this.showKeyStatus(this.io.keysDown[KeyCodes.I], "I");
      this.showKeyStatus(this.io.keysDown[KeyCodes.O], "O");
      this.showKeyStatus(this.io.keysDown[KeyCodes.P], "P");
      this.showKeyStatus(this.io.keysDown[KeyCodes.OpenBracket], "[");
      this.showKeyStatus(this.io.keysDown[KeyCodes.ClosedBracket], "]");
      this.showKeyStatus(this.io.keysDown[KeyCodes.BackSlash], "\\", true, this.EffectiveKeySpacing, this.KeySize15);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Delete], "Del", true, this.SideKeysSpacing, this.KeySize);
      this.showKeyStatus(this.io.keysDown[KeyCodes.End], "End");
      this.showKeyStatus(this.io.keysDown[KeyCodes.PageDown], "PgD");

      this.showKeyStatus(this.io.keysDown[KeyCodes.CapsLock], "Caps", false, this.EffectiveKeySpacing, this.KeySize15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.A], "A");
      this.showKeyStatus(this.io.keysDown[KeyCodes.S], "S");
      this.showKeyStatus(this.io.keysDown[KeyCodes.D], "D");
      this.showKeyStatus(this.io.keysDown[KeyCodes.F], "F");
      this.showKeyStatus(this.io.keysDown[KeyCodes.G], "G");
      this.showKeyStatus(this.io.keysDown[KeyCodes.H], "H");
      this.showKeyStatus(this.io.keysDown[KeyCodes.J], "J");
      this.showKeyStatus(this.io.keysDown[KeyCodes.K], "K");
      this.showKeyStatus(this.io.keysDown[KeyCodes.L], "L");
      this.showKeyStatus(this.io.keysDown[KeyCodes.SemiColon], ";");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Quote], "'");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Enter], "Ret", true, this.EffectiveKeySpacing, this.KeySize25);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Shift], "Shift", false, this.EffectiveKeySpacing, this.KeySize25);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Z], "Z");
      this.showKeyStatus(this.io.keysDown[KeyCodes.X], "X");
      this.showKeyStatus(this.io.keysDown[KeyCodes.C], "C");
      this.showKeyStatus(this.io.keysDown[KeyCodes.V], "V");
      this.showKeyStatus(this.io.keysDown[KeyCodes.B], "B");
      this.showKeyStatus(this.io.keysDown[KeyCodes.N], "N");
      this.showKeyStatus(this.io.keysDown[KeyCodes.M], "M");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Comma], ",");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Period], ".");
      this.showKeyStatus(this.io.keysDown[KeyCodes.ForwardSlash], "/");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Shift], "Shift", true, this.EffectiveKeySpacing, this.KeySize25);

      this.showKeyStatus(this.io.keysDown[KeyCodes.UpArrow], "^", true, this.UpArrowKeySpacing, this.KeySize);

      this.showKeyStatus(this.io.keysDown[KeyCodes.Ctrl], "Ctrl", false, this.EffectiveKeySpacing, this.KeySize15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.LeftWindowKey], "Win");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Alt], "Alt", true, this.EffectiveKeySpacing, this.KeySize15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Space], "Space", true, this.EffectiveKeySpacing, this.KeySizeSpaceBar);
      this.showKeyStatus(this.io.keysDown[KeyCodes.Alt], "Alt", true, this.EffectiveKeySpacing, this.KeySize15);
      this.showKeyStatus(this.io.keysDown[KeyCodes.RightWindowKey], "Win");
      this.showKeyStatus(this.io.keysDown[KeyCodes.Ctrl], "Ctrl", true, this.EffectiveKeySpacing, this.KeySize15);

      this.showKeyStatus(this.io.keysDown[KeyCodes.LeftArrow], "<", true, this.SideKeysSpacing, this.KeySize);
      this.showKeyStatus(this.io.keysDown[KeyCodes.DownArrow], "v");
      this.showKeyStatus(this.io.keysDown[KeyCodes.RightArrow], ">");

      ImGui.PopStyleVar();
      ImGui.EndGroup();
    }

    if (ImGui.CollapsingHeader("Pointer", ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.BeginGroup();
      this.showKeyStatus(this.io.pointerDown[MouseCodes.LeftButton], "L", false, this.EffectiveKeySpacing, this.PointerKeySize);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.MiddleButton], "M", true, this.EffectiveKeySpacing, this.PointerKeySize);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.RightButton], "R", true, this.EffectiveKeySpacing, this.PointerKeySize);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.BackButton], "<", true, this.EffectiveKeySpacing, this.PointerKeySize);
      this.showKeyStatus(this.io.pointerDown[MouseCodes.ForwardButton], ">", true, this.EffectiveKeySpacing, this.PointerKeySize);
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

    if (ImGui.CollapsingHeader("Other", ImGuiTreeNodeFlags.DefaultOpen)) {
      ImGui.TextColored(this.io.hasFocus ? this.TextActiveColor : this.TextInactiveColor, "Focused?");
      ImGui.TextWrapped(`Clipboard: ${this.io.clipboardText}`);
      ImGui.TextWrapped(`Keypresses: ${this.charBuffer}`);
    }

    ImGui.End();
  }

  showKeyStatus(status: boolean, text: string, sameLine: boolean = true,
                spacing: number = this.EffectiveKeySpacing, size: ImVec2 = this.KeySize) {
    if (sameLine) {
      ImGui.SameLine(0, spacing);
    }
    ImGui.PushStyleColor(ImGuiCol.Button, status ? this.KeyDownColor : this.KeyRestingColor);
    ImGui.PushStyleColor(ImGuiCol.ButtonHovered, status ? this.KeyDownColor : this.KeyRestingColor);
    ImGui.PushStyleColor(ImGuiCol.ButtonActive, status ? this.KeyDownColor : this.KeyRestingColor);
    ImGui.PushStyleColor(ImGuiCol.Text, this.KeyTextColor);
    ImGui.Button(text, size);
    ImGui.PopStyleColor(4);
  }
}
