import {SimpleRenderComponent} from "GL/render";
import {EMAIL_MAX_LEN, PASSWORD_MAX_LEN} from "GL/components/register";
import * as ImGui from "ImGui/imgui";
import {ImGuiInputTextFlags, ImGuiWindowFlags, ImStringBuffer, ImVec4} from "ImGui/imgui";
import Axios, {AxiosError, AxiosResponse} from "axios";


// Since email is longer, we use that
const USERNAME_OR_EMAIL_MAX_LEN = EMAIL_MAX_LEN;


// TODO: Client-sided validation
// TODO: Better error messages
export class LoginComponent extends SimpleRenderComponent {
  private readonly usernameOrEmailBuffer = new ImStringBuffer(USERNAME_OR_EMAIL_MAX_LEN, "");
  private readonly passwordBuffer = new ImStringBuffer(PASSWORD_MAX_LEN, "");

  private readonly TextSuccessColor: ImVec4 = new ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly TextErrorColor: ImVec4 = new ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private errorString = "";
  private successString = "";

  render(): void {
    if (!ImGui.Begin("Login", null, ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    ImGui.InputText("Username/Email", this.usernameOrEmailBuffer, USERNAME_OR_EMAIL_MAX_LEN);
    ImGui.InputText("Password", this.passwordBuffer, PASSWORD_MAX_LEN, ImGuiInputTextFlags.Password);

    if (ImGui.Button("Login")) {
      // Reset messages
      this.errorString = "";
      this.successString = "";

      const formData = new FormData();
      formData.set('username_or_email', this.usernameOrEmailBuffer.buffer);
      formData.set('password', this.passwordBuffer.buffer);

      // Perform api call
      Axios.post('/api/login/', formData)
        .then((response: AxiosResponse) => {
          this.successString = response.data.message;
        })
        .catch((error: AxiosError) => {
          if (error.response) {
            this.errorString = error.response.data.message || error.response.statusText || "An unknown error has occurred";
          }
        });
    }

    ImGui.SameLine();

    if (ImGui.Button("Logout")) {
      // Reset messages
      this.errorString = "";
      this.successString = "";

      // Perform api call
      Axios.post('/api/logout/')
        .then((response: AxiosResponse) => {
          this.successString = response.data.message;
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
