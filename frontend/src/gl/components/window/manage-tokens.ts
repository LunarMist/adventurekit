import { LoginUtils } from 'rpgcore-common/utils';
import { MAX_LABEL_LENGTH, MAX_TOKEN_EDIT_OWNERS, MAX_URL_LENGTH } from 'rpgcore-common/es-transform';

import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';
import * as ImGui from 'ImGui/imgui';

export class ManageTokensComponent extends WindowRenderComponent {
  protected readonly windowId: WindowId = WindowId.ManageTokens;

  private readonly labelBuffer = new ImGui.ImStringBuffer(MAX_LABEL_LENGTH, 'Test Label');
  private readonly urlBuffer = new ImGui.ImStringBuffer(MAX_URL_LENGTH, 'Test url');
  private readonly editOwnersBuffer = new ImGui.ImStringBuffer((LoginUtils.MAX_USERNAME_LENGTH + 1) * MAX_TOKEN_EDIT_OWNERS, 'Luney');

  render() {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('Manage Tokens', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    ImGui.InputText('Label', this.labelBuffer, this.labelBuffer.size);
    ImGui.InputText('Url', this.urlBuffer, this.urlBuffer.size);
    ImGui.InputText('Edit Owners (comma delim.)', this.editOwnersBuffer, this.editOwnersBuffer.size);

    if (ImGui.Button('Create Token')) {
      this.es.sendTokenCreationRequest(this.labelBuffer.buffer, this.urlBuffer.buffer, this.editOwnersBuffer.buffer.split(','), 0, 0, 0, 50, 50);
    }

    ImGui.End();
  }
}
