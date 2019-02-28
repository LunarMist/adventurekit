import { RenderComponent } from 'GL/render/renderable';
import * as ImGui from 'ImGui/imgui';

export enum WindowId {
  About = 'About',
  IOState = 'IOState',
  GLContext = 'GLContext',
  Session = 'Session',
  DemoUI = 'DemoUI',
  Room = 'Room',
  Chat = 'Chat',
  Font = 'Font',
}

export abstract class WindowRenderComponent extends RenderComponent {
  protected isVisible: boolean = false;

  protected abstract windowId: WindowId;

  savedOpen(): ImGui.ImAccess<boolean> {
    return (value: boolean = this.isVisible) => {
      if (value !== this.isVisible) {
        this.setWindowVisibility(value);
      }
      return this.isVisible;
    };
  }

  loadWindowVisibility(defaultState: boolean = false) {
    this.store.p.getWindowDefaultVisibility(this.windowId, defaultState)
      .then(v => this.isVisible = v)
      .catch(console.error);
  }

  setWindowVisibility(state: boolean) {
    this.isVisible = state;
    this.store.p.setWindowDefaultVisibility(this.windowId, this.isVisible)
      .catch(console.error);
  }
}
