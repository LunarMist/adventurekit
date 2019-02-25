import { SimpleRenderComponent } from 'GL/render';
import * as ImGui from 'ImGui/imgui';
import { ShowDemoWindow, ShowStyleEditor } from 'ImGui/imgui_demo';
import { WindowId } from 'GL/components/menu';

export class DemoUIComponent extends SimpleRenderComponent {
  public isVisible: boolean = false;

  render(): void {
    if (this.isVisible) {
      ImGui.SetNextWindowPos(new ImGui.ImVec2(650, 20), ImGui.Cond.FirstUseEver);
      ShowDemoWindow(this.savedOpen());
      ShowStyleEditor();
    }
  }

  savedOpen(): ImGui.ImAccess<boolean> {
    return (value: boolean = this.isVisible) => {
      if (value !== this.isVisible) {
        this.isVisible = value;
        this.store.p.setWindowDefaultVisibility(WindowId.DemoUI, this.isVisible)
          .catch(console.error);
      }
      return this.isVisible;
    };
  }
}
