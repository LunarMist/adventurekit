import { SimpleRenderComponent } from "GL/render";
import * as ImGui from "ImGui/imgui";
import { ImVec2 } from "ImGui/imgui";
import { ShowDemoWindow, ShowStyleEditor } from "ImGui/imgui_demo";

export class DemoUIComponent extends SimpleRenderComponent {
  private enableDemoUI: boolean = false;

  render(): void {
    if (this.enableDemoUI) {
      ImGui.SetNextWindowPos(new ImVec2(650, 20), ImGui.Cond.FirstUseEver);
      ShowDemoWindow(null);
      ShowStyleEditor();
    }
  }
}
