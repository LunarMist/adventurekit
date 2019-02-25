import { SimpleRenderComponent } from 'GL/render';
import * as ImGui from 'ImGui/imgui';
import { ShowDemoWindow, ShowStyleEditor } from 'ImGui/imgui_demo';

export class DemoUIComponent extends SimpleRenderComponent {
  public enableDemoUI: boolean = false;

  render(): void {
    if (this.enableDemoUI) {
      ImGui.SetNextWindowPos(new ImGui.ImVec2(650, 20), ImGui.Cond.FirstUseEver);
      ShowDemoWindow((value = this.enableDemoUI) => this.enableDemoUI = value);
      ShowStyleEditor();
    }
  }
}
