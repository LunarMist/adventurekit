import {SimpleRenderComponent} from "GL/render";
import * as ImGui from "ImGui/imgui";
import {ImGuiWindowFlags, ImStringBuffer, ImVec4} from "ImGui/imgui";

export class RoomComponent extends SimpleRenderComponent {
  private readonly roomIdBuffer = new ImStringBuffer(15, "");
  private readonly passwordBuffer = new ImStringBuffer(32, "");

  private readonly TextSuccessColor: ImVec4 = new ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly TextErrorColor: ImVec4 = new ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private errorString = "";
  private successString = "";

  render(): void {
    if (!ImGui.Begin("Manage rooms", null, ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    ImGui.InputText("RoomID", this.roomIdBuffer, this.roomIdBuffer.size);
    ImGui.InputText("Room Password", this.passwordBuffer, this.passwordBuffer.size);

    if (ImGui.Button("Join room")) {
      // Reset messages
      this.errorString = "";
      this.successString = "";

      const isNumber = /^\d+$/.test(this.roomIdBuffer.buffer);

      if (!isNumber) {
        this.errorString = "Room Id must be a number";
      } else {
        this.context.net.sendJoinRoomRequest(Number(this.roomIdBuffer.buffer), this.passwordBuffer.buffer)
          .then((status: boolean) => {
            if (status) {
              this.successString = "Successfully joined the room";
            } else {
              this.errorString = "Please check roomId/password combination";
            }
          });
      }
    }

    ImGui.SameLine();

    if (ImGui.Button("Create room")) {
      // Reset messages
      this.errorString = "";
      this.successString = "";

      this.context.net.sendCreateRoomRequest(this.passwordBuffer.buffer)
        .then((roomId: number) => {
          if (roomId != -1) {
            this.successString = "Successfully created the room";
            this.roomIdBuffer.buffer = roomId.toString();
          } else {
            this.errorString = "Unable to create room";
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
