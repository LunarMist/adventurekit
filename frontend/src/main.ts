import { LoginUtils } from 'rpgcore-common/utils';

import { GridPatternComponent } from 'GL/components/layers/grid';
import { TokenLayerComponent } from 'GL/components/layers/token';
import { ServerStatusComponent } from 'GL/components/server-status';
import { MenuComponent } from 'GL/components/window/menu';
import { RenderLoop } from 'GL/render-loop';

import * as ImGui from 'ImGui/imgui';
import * as LoginApi from 'Api/login';

export default function main(canvas: HTMLCanvasElement) {
  const components = [
    new MenuComponent(),
    new GridPatternComponent(),
    new TokenLayerComponent(),
    new ServerStatusComponent(), // Keep as last one so it's on top of everything
  ];

  new RenderLoop(components, canvas).run();
}

export { ImGui };
export { LoginUtils, LoginApi };
