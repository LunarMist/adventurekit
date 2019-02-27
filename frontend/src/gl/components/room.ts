import * as ImGui from 'ImGui/imgui';
import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';

export class RoomComponent extends WindowRenderComponent {
  private readonly roomIdBuffer = new ImGui.ImStringBuffer(15, '');
  private readonly passwordBuffer = new ImGui.ImStringBuffer(32, '');

  private readonly TEXT_SUCCESS_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(34 / 255, 139 / 255, 34 / 255, 1.0);
  private readonly TEXT_ERROR_COLOR: ImGui.ImVec4 = new ImGui.ImVec4(178 / 255, 34 / 255, 34 / 255, 1.0);

  private errorString = '';
  private successString = '';

  protected readonly windowId: WindowId = WindowId.Room;

  render(): void {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('Manage rooms', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    ImGui.InputText('RoomID', this.roomIdBuffer, this.roomIdBuffer.size);
    ImGui.InputText('Room Password', this.passwordBuffer, this.passwordBuffer.size);

    if (ImGui.Button('Join room')) {
      // Reset messages
      this.errorString = '';
      this.successString = '';

      const isNumber = /^\d+$/.test(this.roomIdBuffer.buffer);

      if (!isNumber) {
        this.errorString = 'Room Id must be a number';
      } else {
        const roomIdNum = Number(this.roomIdBuffer.buffer);
        this.net.sendJoinRoomRequest(roomIdNum, this.passwordBuffer.buffer)
          .then((status: boolean) => {
            if (status) {
              this.successString = 'Successfully joined the room';
              this.store.mem.roomId = roomIdNum;
            } else {
              this.errorString = 'Please check roomId/password combination';
            }
          });
      }
    }

    ImGui.SameLine();

    if (ImGui.Button('Create room')) {
      // Reset messages
      this.errorString = '';
      this.successString = '';

      this.net.sendCreateRoomRequest(this.passwordBuffer.buffer)
        .then((roomId: number) => {
          if (roomId !== -1) {
            this.successString = 'Successfully created the room';
            this.roomIdBuffer.buffer = roomId.toString();
          } else {
            this.errorString = 'Unable to create room';
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
