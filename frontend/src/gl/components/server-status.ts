import { SimpleRenderComponent } from 'GL/render';
import * as ImGui from 'ImGui/imgui';

export class ServerStatusComponent extends SimpleRenderComponent {
  private readonly WINDOW_PIVOT = new ImGui.ImVec2(0.5, 0.5);
  private readonly WINDOW_POS = new ImGui.ImVec2();
  private readonly FLAGS = ImGui.ImGuiWindowFlags.NoTitleBar | ImGui.ImGuiWindowFlags.NoResize
    | ImGui.ImGuiWindowFlags.AlwaysAutoResize | ImGui.ImGuiWindowFlags.NoSavedSettings;

  private readonly RED_COLOR = new ImGui.ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private readonly STATUS_CHECK_DELAY_MILLIS = 5000;

  private readonly firstFrameTime: number;

  constructor() {
    super();
    this.firstFrameTime = Date.now();
  }

  render(): void {
    // We only care about reporting status if we are disconnected
    if (this.net.isConnected()) {
      return;
    }

    // Only start checking after a delay, to give time for the app to start up and stuff
    // This is to prevent a brief flash when the app is first loaded
    if (Date.now() - this.firstFrameTime <= this.STATUS_CHECK_DELAY_MILLIS) {
      return;
    }

    this.WINDOW_POS.x = ImGui.GetIO().DisplaySize.x / 2;
    this.WINDOW_POS.y = 50;

    ImGui.SetNextWindowPos(this.WINDOW_POS, ImGui.ImGuiCond.Always, this.WINDOW_PIVOT);
    ImGui.Begin('Server status overlay', null, this.FLAGS);
    ImGui.TextColored(this.RED_COLOR, 'Unable to connect to server...please check your connection and ensure you are logged in.');
    ImGui.End();
  }
}
