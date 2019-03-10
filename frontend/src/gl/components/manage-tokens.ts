import { EventCategories } from 'rpgcore-common/es';
import { TokenProto } from 'rpgcore-common/es-proto';

import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';
import * as ImGui from 'ImGui/imgui';

export class ManageTokensComponent extends WindowRenderComponent {
  protected readonly windowId: WindowId = WindowId.ManageTokens;

  init() {
    this.es.addHandler(EventCategories.TokenChangeEvent, serverEvent => {
      const event = TokenProto.TokenChangeEvent.decode(serverEvent.dataUi8);
      console.log(event);
      return true;
    });
  }

  render() {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('Manage Tokens', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.Button('Create Token')) {
      const req = this.es.buildTokenCreationRequest('Test Label', 'Test url', ['Luney'], 11, 22, 33, 44, 55);
      this.net.sendEvent(req);
    }

    ImGui.End();
  }
}
