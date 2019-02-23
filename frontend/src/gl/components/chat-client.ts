import { SimpleRenderComponent } from 'GL/render';
import * as ImGui from 'ImGui/imgui';

export class ChatWindowComponent extends SimpleRenderComponent {
  private inputBuffer = new ImGui.ImStringBuffer(1000);
  private chatLogs: string[] = [];

  init(): void {
    this.net.listenChatMessage((speaker, message) => this.chatLogs.push(`${speaker}: ${message}`));
  }

  render(): void {
    ImGui.Begin('Chat', null, ImGui.ImGuiWindowFlags.AlwaysAutoResize);

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
