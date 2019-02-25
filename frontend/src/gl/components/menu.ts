import { GameContext, RenderComponent, SimpleRenderComponent } from 'GL/render';
import { AboutComponent } from 'GL/components/about';
import { IOStateUIComponent } from 'GL/components/iostate';
import { LostContextComponent } from 'GL/components/lost-context';
import { SessionComponent } from 'GL/components/session';
import { DemoUIComponent } from 'GL/components/demo';
import { RoomComponent } from 'GL/components/room';
import { ChatWindowComponent } from 'GL/components/chat-client';
import * as ImGui from 'ImGui/imgui';

export enum WindowId {
  About = 'About',
  IOState = 'IOState',
  GLContext = 'GLContext',
  Session = 'Session',
  DemoUI = 'DemoUI',
  Room = 'Room',
  Chat = 'Chat',
}

export class MenuComponent extends SimpleRenderComponent {
  private readonly childComponents: RenderComponent[] = [];
  private readonly aboutComponent: AboutComponent;
  private readonly ioStateComponent: IOStateUIComponent;
  private readonly lostContextComponent: LostContextComponent;
  private readonly sessionComponent: SessionComponent;
  private readonly demoUIComponent: DemoUIComponent;
  private readonly roomComponent: RoomComponent;
  private readonly chatComponent: ChatWindowComponent;

  constructor() {
    super();
    this.aboutComponent = new AboutComponent();
    this.childComponents.push(this.aboutComponent);

    this.ioStateComponent = new IOStateUIComponent();
    this.childComponents.push(this.ioStateComponent);

    this.lostContextComponent = new LostContextComponent();
    this.childComponents.push(this.lostContextComponent);

    this.sessionComponent = new SessionComponent();
    this.childComponents.push(this.sessionComponent);

    this.demoUIComponent = new DemoUIComponent();
    this.childComponents.push(this.demoUIComponent);

    this.roomComponent = new RoomComponent();
    this.childComponents.push(this.roomComponent);

    this.chatComponent = new ChatWindowComponent();
    this.childComponents.push(this.chatComponent);
  }

  setComponentVisibility(component: { isVisible: boolean }, windowId: WindowId, defaultState: boolean = false) {
    this.store.p.getWindowDefaultVisibility(windowId, defaultState)
      .then(v => component.isVisible = v)
      .catch(console.error);
  }

  saveComponentVisibility(component: { isVisible: boolean }, windowId: WindowId) {
    this.store.p.setWindowDefaultVisibility(windowId, component.isVisible)
      .catch(console.error);
  }

  bindGameContext(context: GameContext): void {
    super.bindGameContext(context);
    this.childComponents.forEach(c => c.bindGameContext(context));
  }

  init(): void {
    this.setComponentVisibility(this.aboutComponent, WindowId.About);
    this.setComponentVisibility(this.ioStateComponent, WindowId.IOState);
    this.setComponentVisibility(this.lostContextComponent, WindowId.GLContext);
    this.setComponentVisibility(this.sessionComponent, WindowId.Session);
    this.setComponentVisibility(this.demoUIComponent, WindowId.DemoUI);
    this.setComponentVisibility(this.roomComponent, WindowId.Room);
    this.setComponentVisibility(this.chatComponent, WindowId.Chat, true);

    this.childComponents.forEach(c => c.init());
  }

  initFromLostContext(): void {
    this.childComponents.forEach(c => c.initFromLostContext());
  }

  startFrame(): void {
    this.childComponents.forEach(c => c.startFrame());
  }

  render(): void {
    if (ImGui.BeginMainMenuBar()) {
      // Window menu selection
      if (ImGui.BeginMenu('Windows')) {
        if (ImGui.MenuItem('Manage Room')) {
          this.roomComponent.isVisible = true;
          this.saveComponentVisibility(this.roomComponent, WindowId.Room);
        }
        if (ImGui.MenuItem('Chat')) {
          this.chatComponent.isVisible = true;
          this.saveComponentVisibility(this.chatComponent, WindowId.Chat);
        }
        ImGui.EndMenu();
      }

      // Debug menu section
      if (ImGui.BeginMenu('Debug')) {
        if (ImGui.MenuItem('IO State')) {
          this.ioStateComponent.isVisible = true;
          this.saveComponentVisibility(this.ioStateComponent, WindowId.IOState);
        }
        if (ImGui.MenuItem('GL Context')) {
          this.lostContextComponent.isVisible = true;
          this.saveComponentVisibility(this.lostContextComponent, WindowId.GLContext);
        }
        if (ImGui.MenuItem('Session')) {
          this.sessionComponent.isVisible = true;
          this.saveComponentVisibility(this.sessionComponent, WindowId.Session);
        }
        ImGui.EndMenu();
      }

      // Help menu section
      if (ImGui.BeginMenu('Help')) {
        if (ImGui.MenuItem('About')) {
          this.aboutComponent.isVisible = true;
          this.saveComponentVisibility(this.aboutComponent, WindowId.About);
        }
        if (ImGui.MenuItem('ImGui Demo')) {
          this.demoUIComponent.isVisible = true;
          this.saveComponentVisibility(this.demoUIComponent, WindowId.DemoUI);
        }
        ImGui.EndMenu();
      }

      ImGui.EndMainMenuBar();
    }

    this.childComponents.forEach(c => c.render());
  }

  endFrame(): void {
    this.childComponents.forEach(c => c.endFrame());
  }

  destroy(): void {
    this.childComponents.forEach(c => c.destroy());
  }
}
