import { IOStateUIComponent } from 'GL/components/iostate';
import { DemoUIComponent } from 'GL/components/demo';
import { GridPatternComponent } from 'GL/components/grid';
import { LostContextComponent } from 'GL/components/lost-context';
import { ChatWindowComponent } from 'GL/components/chat-client';
import { AboutComponent } from 'GL/components/about';
import { SessionComponent } from 'GL/components/session';
import { RenderLoop } from 'GL/render';
import { RoomComponent } from 'GL/components/room';
import { ServerStatusComponent } from 'GL/components/server-status';
import * as ImGui from 'ImGui/imgui';
import { LoginUtils } from 'rpgcore-common';
import * as LoginApi from 'Api/login';

export default function main(canvas: HTMLCanvasElement) {
  const components = [
    new RoomComponent(),
    new DemoUIComponent(),
    new IOStateUIComponent(),
    new LostContextComponent(),
    new AboutComponent(),
    new ChatWindowComponent(),
    new SessionComponent(),
    new GridPatternComponent(),
    new ServerStatusComponent(), // Keep as last one so it's on top of everything
  ];

  new RenderLoop(components, canvas).run();
}

export { ImGui };
export { LoginUtils, LoginApi };
