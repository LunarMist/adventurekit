import * as ImGui from 'ImGui/imgui';
import { ShowDemoWindow, ShowStyleEditor } from 'ImGui/imgui_demo';
import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';

export class DemoUIComponent extends WindowRenderComponent {
  protected readonly windowId: WindowId = WindowId.DemoUI;

  render(): void {
    if (this.isVisible) {
      ImGui.SetNextWindowPos(new ImGui.ImVec2(650, 20), ImGui.Cond.FirstUseEver);
      ShowDemoWindow(this.savedOpen());
      ShowStyleEditor();
    }
  }
}
