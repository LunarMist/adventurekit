import { GameContext, RenderComponent, SimpleRenderComponent } from 'GL/render';
import { AboutComponent } from 'GL/components/about';
import { IOStateUIComponent } from 'GL/components/iostate';
import { LostContextComponent } from 'GL/components/lost-context';
import { SessionComponent } from 'GL/components/session';
import { DemoUIComponent } from 'GL/components/demo';
import { RoomComponent } from 'GL/components/room';
import { ChatWindowComponent } from 'GL/components/chat-client';
import * as ImGui from 'ImGui/imgui';

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

  bindGameContext(context: GameContext): void {
    super.bindGameContext(context);
    this.childComponents.forEach(c => c.bindGameContext(context));
  }

  init(): void {
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
      // Room menu selection
      if (ImGui.BeginMenu('Room')) {
        if (ImGui.MenuItem('Manage')) {
          this.roomComponent.isVisible = true;
        }
        ImGui.EndMenu();
      }

      // Window menu selection
      if (ImGui.BeginMenu('Windows')) {
        if (ImGui.MenuItem('Chat')) {
          this.chatComponent.isVisible = true;
        }
        ImGui.EndMenu();
      }

      // Debug menu section
      if (ImGui.BeginMenu('Debug')) {
        if (ImGui.MenuItem('IO State')) {
          this.ioStateComponent.isVisible = true;
        }
        if (ImGui.MenuItem('GL Context')) {
          this.lostContextComponent.isVisible = true;
        }
        if (ImGui.MenuItem('Session')) {
          this.sessionComponent.isVisible = true;
        }
        ImGui.EndMenu();
      }

      // Help menu section
      if (ImGui.BeginMenu('Help')) {
        if (ImGui.MenuItem('About')) {
          this.aboutComponent.isVisible = true;
        }
        if (ImGui.MenuItem('ImGui Demo')) {
          this.demoUIComponent.enableDemoUI = true;
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
