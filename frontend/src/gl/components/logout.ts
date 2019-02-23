import { SimpleRenderComponent } from "GL/render";
import * as ImGui from "ImGui/imgui";
import { ImGuiWindowFlags, ImVec4 } from "ImGui/imgui";
import Axios, { AxiosError, AxiosResponse } from "axios";

export class LogoutComponent extends SimpleRenderComponent {
  private readonly TextSuccessColor: ImVec4 = new ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly TextErrorColor: ImVec4 = new ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private errorString = "";
  private successString = "";

  render(): void {
    if (!ImGui.Begin("Sess", null, ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.Button("Logout")) {
      // Reset messages
      this.errorString = "";
      this.successString = "";

      // Perform api call
      Axios.post('/logout/')
        .then((response: AxiosResponse) => {
          this.successString = response.data.message;
          location.replace('/login/'); // On logout, redirect to login page
        })
        .catch((error: AxiosError) => {
          if (error.response) {
            this.errorString = error.response.data.message || error.response.statusText || "An unknown error has occurred";
          }
        });
    }

    if (this.successString.length > 0) {
      ImGui.TextColored(this.TextSuccessColor, this.successString);
    }

    if (this.errorString.length > 0) {
      ImGui.TextColored(this.TextErrorColor, this.errorString);
    }

    ImGui.End();
  }
}
