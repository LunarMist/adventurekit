import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';
import * as ImGui from 'ImGui/imgui';

export class ManageTokensComponent extends WindowRenderComponent {
  protected readonly windowId: WindowId = WindowId.ManageTokens;

  render() {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('Manage Tokens', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.Button('Create Token')) {
      const req = this.es.buildTokenCreationRequest('Test Label', 'Test url', 11, 22, 33, 44, 55);
      this.net.sendEvent(req);
    }

    ImGui.End();
  }
}
