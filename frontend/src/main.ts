import {IOStateUIComponent} from "GL/components/iostate";
import {DemoUIComponent} from "GL/components/demo";
import {GridPatternComponent} from "GL/components/grid"
import {LostContextComponent} from "GL/components/lost-context";
import {ChatWindowComponent} from "GL/components/chat-client";
import {AboutComponent} from "GL/components/about";
import {LogoutComponent} from "GL/components/logout";
import {RenderLoop} from "GL/render";
import {RoomComponent} from "GL/components/room";
import * as ImGuiExport from "ImGui/imgui"
import {LoginUtils} from "rpgcore-common";
import * as LoginApi from "Api/login";

export default function main(canvas: HTMLCanvasElement) {
  const components = [
    new RoomComponent(),
    new DemoUIComponent(),
    new IOStateUIComponent(),
    new LostContextComponent(),
    new AboutComponent(),
    new ChatWindowComponent(),
    new LogoutComponent(),
    new GridPatternComponent()
  ];

  new RenderLoop(components, canvas).run();
}

export const ImGui = ImGuiExport;
export {LoginUtils, LoginApi};
