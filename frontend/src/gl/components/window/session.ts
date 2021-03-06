import * as ImGui from 'ImGui/imgui';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';

export class SessionComponent extends WindowRenderComponent {
  private readonly TEXT_SUCCESS_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly TEXT_ERROR_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private errorString = '';
  private successString = '';

  protected readonly windowId: WindowId = WindowId.Session;

  render(): void {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('Session', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.Button('Disconnect')) {
      this.net.disconnect();
    }

    ImGui.SameLine();

    if (ImGui.Button('Attempt reconnect')) {
      this.net.connect();
    }

    if (ImGui.Button('Login')) {
      window.location.href = '/login/';
    }

    ImGui.SameLine();

    if (ImGui.Button('Logout')) {
      // Reset messages
      this.errorString = '';
      this.successString = '';

      // Perform api call
      axios.post('/logout/')
        .then((response: AxiosResponse) => {
          this.successString = response.data.message;
          this.net.disconnect();
        })
        .catch((error: AxiosError) => {
          if (error.response) {
            this.errorString = error.response.data.message || error.response.statusText || 'An unknown error has occurred';
          }
        });
    }

    if (this.successString.length > 0) {
      ImGui.TextColored(this.TEXT_SUCCESS_COLOR, this.successString);
    }

    if (this.errorString.length > 0) {
      ImGui.TextColored(this.TEXT_ERROR_COLOR, this.errorString);
    }

    ImGui.End();
  }
}
