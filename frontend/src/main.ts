import { GridPatternComponent } from 'GL/components/grid';
import { RenderLoop } from 'GL/render';
import { ServerStatusComponent } from 'GL/components/server-status';
import { MenuComponent } from 'GL/components/menu';
import * as ImGui from 'ImGui/imgui';
import { LoginUtils } from 'rpgcore-common';
import * as LoginApi from 'Api/login';

export default function main(canvas: HTMLCanvasElement) {
  const components = [
    new MenuComponent(),
    new GridPatternComponent(),
    new ServerStatusComponent(), // Keep as last one so it's on top of everything
  ];

  new RenderLoop(components, canvas).run();
}

export { ImGui };
export { LoginUtils, LoginApi };
