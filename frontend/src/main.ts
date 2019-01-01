import {IOStateUIComponent} from "GL/components/iostate";
import {DemoUIComponent} from "GL/components/demo";
import {GridPatternComponent} from "GL/components/grid"
import {LostContextComponent} from "GL/components/lost_context";
import {ChatWindowComponent} from "GL/components/chat_client";
import {AboutComponent} from "GL/components/about";
import {RegisterUserComponent} from "GL/components/register";
import {LoginComponent} from "GL/components/login";
import {RenderLoop} from "GL/render";
import * as ImGuiExport from "ImGui/imgui"

export default function main(canvas: HTMLCanvasElement) {
  const components = [
    new DemoUIComponent(),
    new IOStateUIComponent(),
    new LostContextComponent(),
    new AboutComponent(),
    new ChatWindowComponent(),
    new RegisterUserComponent(),
    new LoginComponent(),
    new GridPatternComponent()
  ];

  new RenderLoop(components, canvas).run();
}

export const ImGui = ImGuiExport;
