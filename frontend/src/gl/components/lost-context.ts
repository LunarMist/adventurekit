import { SimpleRenderComponent } from 'GL/render';
import * as ImGui from 'ImGui/imgui';
import * as IOEvent from 'IO/event';
import { KeyCodes } from 'IO/codes';
import { WindowId } from 'GL/components/menu';

export class LostContextComponent extends SimpleRenderComponent {
  private ext!: WEBGL_lose_context;
  public isVisible: boolean = false;

  init(): void {
    this.dispatcher.addHandler(IOEvent.EventType.KeyUp, event => {
      if (event.keyCode === KeyCodes.Space) {
        if (this.gl.isContextLost()) {
          console.log('Initiating restore context');
          this.ext.restoreContext();
          return true;
        }
      }
      return false;
    });
  }

  render(): void {
    if (!this.isVisible) {
      return;
    }

    ImGui.SetNextWindowPos(new ImGui.ImVec2(100, 500), ImGui.Cond.FirstUseEver);
    if (!ImGui.Begin('GL Context', this.savedOpen(), ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    if (ImGui.Button('Lose context')) {
      if (!this.gl.isContextLost()) {
        const ext = this.gl.getExtension('WEBGL_lose_context');
        if (ext !== null) {
          console.log('Initiating lost context');
          console.log('Press [Space] to regain context');
          this.ext = ext;
          this.ext.loseContext();
        } else {
          console.log('Ext is null; unable to force lose context');
        }
      }
    }

    ImGui.Text('Press [Space] to regain context');

    ImGui.End();
  }

  savedOpen(): ImGui.ImAccess<boolean> {
    return (value: boolean = this.isVisible) => {
      if (value !== this.isVisible) {
        this.isVisible = value;
        this.store.p.setWindowDefaultVisibility(WindowId.GLContext, this.isVisible)
          .catch(console.error);
      }
      return this.isVisible;
    };
  }
}
