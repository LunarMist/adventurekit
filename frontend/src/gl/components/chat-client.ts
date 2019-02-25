import { SimpleRenderComponent } from 'GL/render';
import * as ImGui from 'ImGui/imgui';
import { WindowId } from 'GL/components/menu';

export class ChatWindowComponent extends SimpleRenderComponent {
  private inputBuffer = new ImGui.ImStringBuffer(1000);
  private chatLogs: string[] = [];

  public isVisible: boolean = false;

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

  savedOpen(): ImGui.ImAccess<boolean> {
    return (value: boolean = this.isVisible) => {
      if (value !== this.isVisible) {
        this.isVisible = value;
        this.store.p.setWindowDefaultVisibility(WindowId.Chat, this.isVisible)
          .catch(console.error);
      }
      return this.isVisible;
    };
  }
}
