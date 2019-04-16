import * as ImGui from 'ImGui/imgui';
import { WindowId, WindowRenderComponent } from 'GL/render/window-renderable';

export class ChatWindowComponent extends WindowRenderComponent {
  private inputBuffer = new ImGui.ImStringBuffer(1000);
  private chatLogs: string[] = [];

  protected readonly windowId: WindowId = WindowId.Chat;

  init(): void {
    this.net.listenChatMessage((speaker, message) => this.chatLogs.push(`${speaker}: ${message}`));
  }

  render(): void {
    if (!this.isVisible) {
      return;
    }

    if (!ImGui.Begin('Chat', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    ImGui.BeginChild('a1', new ImGui.ImVec2(700, 300));
    ImGui.Text(this.chatLogs.join('\n'));
    ImGui.EndChild();

    ImGui.PushItemWidth(700);
    if (ImGui.InputText('', this.inputBuffer, this.inputBuffer.size, ImGui.ImGuiInputTextFlags.EnterReturnsTrue)) {
      this.net.sendChatMessage(this.inputBuffer.buffer);
      this.inputBuffer.buffer = '';
      ImGui.SetKeyboardFocusHere(-1);
    }
    ImGui.PopItemWidth();

    ImGui.End();
  }
}
