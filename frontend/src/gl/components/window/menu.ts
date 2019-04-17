import { AboutComponent } from 'GL/components/window/about';
import { IOStateUIComponent } from 'GL/components/window/iostate';
import { LostContextComponent } from 'GL/components/window/lost-context';
import { SessionComponent } from 'GL/components/window/session';
import { DemoUIComponent } from 'GL/components/window/demo';
import { RoomComponent } from 'GL/components/window/room';
import { ChatWindowComponent } from 'GL/components/window/chat-client';
import { FontSelectorComponent } from 'GL/components/window/font-selector';
import { ManageTokensComponent } from 'GL/components/window/manage-tokens';
import * as ImGui from 'ImGui/imgui';
import { RenderComponent } from 'GL/render/renderable';

export class MenuComponent extends RenderComponent {
  private readonly aboutComponent: AboutComponent;
  private readonly ioStateComponent: IOStateUIComponent;
  private readonly lostContextComponent: LostContextComponent;
  private readonly sessionComponent: SessionComponent;
  private readonly demoUIComponent: DemoUIComponent;
  private readonly roomComponent: RoomComponent;
  private readonly chatComponent: ChatWindowComponent;
  private readonly fontSelectorComponent: FontSelectorComponent;
  private readonly manageTokensComponent: ManageTokensComponent;

  private printDebugLogs: boolean = false;

  constructor() {
    super();
    this.aboutComponent = new AboutComponent();
    this.children.push(this.aboutComponent);

    this.ioStateComponent = new IOStateUIComponent();
    this.children.push(this.ioStateComponent);

    this.lostContextComponent = new LostContextComponent();
    this.children.push(this.lostContextComponent);

    this.sessionComponent = new SessionComponent();
    this.children.push(this.sessionComponent);

    this.demoUIComponent = new DemoUIComponent();
    this.children.push(this.demoUIComponent);

    this.roomComponent = new RoomComponent();
    this.children.push(this.roomComponent);

    this.chatComponent = new ChatWindowComponent();
    this.children.push(this.chatComponent);

    this.fontSelectorComponent = new FontSelectorComponent();
    this.children.push(this.fontSelectorComponent);

    this.manageTokensComponent = new ManageTokensComponent();
    this.children.push(this.manageTokensComponent);
  }

  init(): void {
    this.aboutComponent.loadWindowVisibility();
    this.ioStateComponent.loadWindowVisibility();
    this.lostContextComponent.loadWindowVisibility();
    this.sessionComponent.loadWindowVisibility();
    this.demoUIComponent.loadWindowVisibility();
    this.roomComponent.loadWindowVisibility();
    this.chatComponent.loadWindowVisibility(true);
    this.fontSelectorComponent.loadWindowVisibility();
    this.manageTokensComponent.loadWindowVisibility();

    if (localStorage.debug) {
      this.printDebugLogs = true;
    }

    super.init();
  }

  render(): void {
    if (ImGui.BeginMainMenuBar()) {
      // Window menu selection
      if (ImGui.BeginMenu('Windows')) {
        if (ImGui.MenuItem('Manage Room')) {
          this.roomComponent.setWindowVisibility(true);
        }
        if (ImGui.MenuItem('Chat')) {
          this.chatComponent.setWindowVisibility(true);
        }
        if (ImGui.MenuItem('Manage Tokens')) {
          this.manageTokensComponent.setWindowVisibility(true);
        }
        ImGui.EndMenu();
      }

      // Debug menu section
      if (ImGui.BeginMenu('Debug')) {
        if (ImGui.MenuItem('IO State')) {
          this.ioStateComponent.setWindowVisibility(true);
        }
        if (ImGui.MenuItem('GL Context')) {
          this.lostContextComponent.setWindowVisibility(true);
        }
        if (ImGui.MenuItem('Session')) {
          this.sessionComponent.setWindowVisibility(true);
        }
        ImGui.EndMenu();
      }

      // Help menu section
      if (ImGui.BeginMenu('Help')) {
        if (ImGui.MenuItem('About')) {
          this.aboutComponent.setWindowVisibility(true);
        }
        if (ImGui.MenuItem('ImGui Demo')) {
          this.demoUIComponent.setWindowVisibility(true);
        }
        if (ImGui.MenuItem('Fonts')) {
          this.fontSelectorComponent.setWindowVisibility(true);
        }

        if (ImGui.Checkbox('Enable debug logs', (v: boolean = this.printDebugLogs) => this.printDebugLogs = v)) {
          if (this.printDebugLogs) {
            localStorage.debug = 'rpgcore:*';
          } else {
            localStorage.debug = '';
          }
        }

        ImGui.EndMenu();
      }

      ImGui.EndMainMenuBar();
    }
    super.render();
  }
}
