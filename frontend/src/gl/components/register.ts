import {SimpleRenderComponent} from "GL/render";
import * as ImGui from "ImGui/imgui";
import {ImGuiInputTextFlags, ImGuiWindowFlags, ImStringBuffer, ImVec4} from "ImGui/imgui";
import Axios, {AxiosError, AxiosResponse} from "axios";


// the + 1 is for the null terminator
// Sync with models and utils validation
const USERNAME_MAX_LEN = 15 + 1;
export const EMAIL_MAX_LEN = 120 + 1;
export const PASSWORD_MAX_LEN = 200 + 1;


// TODO: Client-sided validation
// TODO: Better error messages
export class RegisterUserComponent extends SimpleRenderComponent {
  private readonly usernameBuffer = new ImStringBuffer(USERNAME_MAX_LEN, "");
  private readonly emailBuffer = new ImStringBuffer(EMAIL_MAX_LEN, "");
  private readonly passwordBuffer = new ImStringBuffer(PASSWORD_MAX_LEN, "");
  private readonly confirmPasswordBuffer = new ImStringBuffer(PASSWORD_MAX_LEN, "");

  private readonly TextSuccessColor: ImVec4 = new ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly TextErrorColor: ImVec4 = new ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private errorString = "";
  private successString = "";

  render(): void {
    if (!ImGui.Begin("Registration", null, ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    ImGui.InputText("Username", this.usernameBuffer, USERNAME_MAX_LEN);
    ImGui.InputText("Email", this.emailBuffer, EMAIL_MAX_LEN);
    ImGui.InputText("Password", this.passwordBuffer, PASSWORD_MAX_LEN, ImGuiInputTextFlags.Password);
    ImGui.InputText("Confirm Password", this.confirmPasswordBuffer, PASSWORD_MAX_LEN, ImGuiInputTextFlags.Password);

    if (ImGui.Button("Register")) {
      // Reset messages
      this.errorString = "";
      this.successString = "";

      // Ensure the passwords match
      if (this.passwordBuffer.buffer !== this.confirmPasswordBuffer.buffer) {
        this.errorString = "Passwords do not match";
      } else {
        // console.log("Registering new user");
        // console.log(`Username: ${this.usernameBuffer.buffer}`);
        // console.log(`Email: ${this.emailBuffer.buffer}`);
        // console.log(`Password: *****`);

        const formData = new FormData();
        formData.set('username', this.usernameBuffer.buffer);
        formData.set('email', this.emailBuffer.buffer);
        formData.set('password', this.passwordBuffer.buffer);

        // Perform api call
        Axios.post('/api/register/', formData)
          .then((response: AxiosResponse) => {
            // console.log(response);
            this.successString = response.data.message;
          })
          .catch((error: AxiosError) => {
            if (error.response) {
              this.errorString = error.response.data.message || error.response.statusText || "An unknown error has occurred";
            }
          });
      }
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
