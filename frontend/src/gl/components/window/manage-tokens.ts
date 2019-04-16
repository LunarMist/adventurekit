import { LoginUtils } from 'rpgcore-common/utils';
import { MAX_LABEL_LENGTH, MAX_TOKEN_EDIT_OWNERS, MAX_URL_LENGTH } from 'rpgcore-common/es-transform';

import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';
import * as ImGui from 'ImGui/imgui';

export class ManageTokensComponent extends WindowRenderComponent {
  protected readonly windowId: WindowId = WindowId.ManageTokens;

  private readonly labelBuffer = new ImGui.ImStringBuffer(MAX_LABEL_LENGTH, 'Twilight');
  private readonly urlBuffer = new ImGui.ImStringBuffer(MAX_URL_LENGTH, '/static/bundle/glob/images/twilight.jpg');
  private readonly editOwnersBuffer = new ImGui.ImStringBuffer((LoginUtils.MAX_USERNAME_LENGTH + 1) * MAX_TOKEN_EDIT_OWNERS, '*');

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
      const randX = Math.random() * (this.gl.canvas.width - 100) + 100;
      const randY = Math.random() * (this.gl.canvas.height - 100) + 100;
      const randWH = Math.random() * (256 - 50) + 50;
      this.es.sendTokenCreationRequest(this.labelBuffer.buffer, this.urlBuffer.buffer, this.editOwnersBuffer.buffer.split(','), randX, randY, 0, randWH, randWH);
    }

    ImGui.End();
  }
}
