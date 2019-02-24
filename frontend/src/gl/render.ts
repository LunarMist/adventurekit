import { IOLifeCycle } from 'IO/lifecycle';
import * as ImGui from 'ImGui/imgui';
import { KeyCodes } from 'IO/codes';
import { State } from 'IO/state';
import { EventDispatcher } from 'IO/event';
import { ImGuiIOConnector } from 'IO/imgui';
import { ImGuiImplWebGl } from 'GL/imgui-impl-webgl';
import { GameNetClient } from 'Net/game-net-client';
import { SocketIONetClient } from 'Net/socketio-client';
import { NetClient } from 'Net/net-client';
import PersistentGameSettings from 'Store/Persistent-game-settings';
import InMemoryGameSettings from 'Store/In-memory-game-settings';
import { FontData } from 'rpgcore-common';

export class GameContext {
  dispatcher: EventDispatcher;
  io: State;
  net: GameNetClient;
  store: { p: PersistentGameSettings; mem: InMemoryGameSettings };
  gl: WebGLRenderingContext;

  constructor(dispatcher: EventDispatcher, io: State, net: GameNetClient,
              p: PersistentGameSettings, mem: InMemoryGameSettings, gl: WebGLRenderingContext) {
    this.dispatcher = dispatcher;
    this.io = io;
    this.net = net;
    this.store = { p, mem };
    this.gl = gl;
  }
}

export interface RenderComponent {
  context: GameContext;

  init(): void;

  initFromLostContext(): void;

  startFrame(): void;

  render(): void;

  endFrame(): void;

  destroy(): void;
}

export abstract class SimpleRenderComponent implements RenderComponent {
  context!: GameContext;

  get dispatcher(): EventDispatcher {
    return this.context.dispatcher;
  }

  get io(): State {
    return this.context.io;
  }

  get net(): GameNetClient {
    return this.context.net;
  }

  get store() {
    return this.context.store;
  }

  get gl(): WebGLRenderingContext {
    return this.context.gl;
  }

  init(): void {
  }

  initFromLostContext(): void {
  }

  startFrame(): void {
  }

  abstract render(): void;

  endFrame(): void {
  }

  destroy(): void {
  }
}

export class RenderLoop {
  private done: boolean = false;

  private readonly ioLifeCycle: IOLifeCycle;
  private readonly imGuiIOConnector: ImGuiIOConnector;
  private readonly gameContext: GameContext;
  private readonly imGuiWebGlHelper: ImGuiImplWebGl;

  private readonly netClient: NetClient;
  private readonly gameNetClient: GameNetClient;
  private readonly persistentGameSettings: PersistentGameSettings;
  private readonly inMemoryGameSettings: InMemoryGameSettings;

  private prevTime: number = 0;
  private prevFrameTimes: number[] = [];
  private prevFrameTimesIdx: number = 0;
  private prevFrameTimesCount: number = 20;

  constructor(readonly components: RenderComponent[], readonly canvas: HTMLCanvasElement) {
    this.ioLifeCycle = new IOLifeCycle(this.canvas);
    this.imGuiIOConnector = new ImGuiIOConnector();

    this.netClient = new SocketIONetClient();
    this.gameNetClient = new GameNetClient(this.netClient);
    this.persistentGameSettings = new PersistentGameSettings();
    this.inMemoryGameSettings = new InMemoryGameSettings();

    const newGl = canvas.getContext('webgl');
    if (newGl === null) {
      throw Error('Gl context cannot be null');
    }

    this.gameContext = new GameContext(this.ioLifeCycle.dispatcher, this.ioLifeCycle.ioState, this.gameNetClient,
      this.persistentGameSettings, this.inMemoryGameSettings, newGl);

    this.imGuiWebGlHelper = new ImGuiImplWebGl(this.gameContext);

    for (let i = 0; i < this.prevFrameTimesCount; i++) {
      this.prevFrameTimes.push(0);
    }
  }

  run(): void {
    if (typeof (window) === 'undefined') {
      throw new Error('window must be defined');
    }

    window.requestAnimationFrame(async () => await this.init());
  }

  private async init() {
    // console.log("RenderLoop.init()");

    // Init everything
    this.ioLifeCycle.init();
    this.imGuiIOConnector.init(this.dispatcher);
    this.initAdditionalHandlers();
    await this.initImGui();
    this.imGuiWebGlHelper.init();

    // Init net
    this.netClient.open();
    this.gameNetClient.listenInitState(initState => {
      console.log('Setting initial state');
      this.inMemoryGameSettings.userProfile = initState.userProfile;
      this.inMemoryGameSettings.roomId = initState.roomId;
    });

    // TODO: Re-enable for prod, or find a better way
    // this.gameNetClient.listenDisconnect(() => {
    //   location.replace('/login/'); // On disconnect, redirect to login page
    // });

    this.resizeCanvas();

    // Setup components
    this.components.forEach(c => {
      c.context = this.gameContext;
      c.init();
    });

    window.requestAnimationFrame(t => this.loop(t));
  }

  private initFromLostContext() {
    console.log('RenderLoop.initFromLostContext()');

    const newGl = this.canvas.getContext('webgl');
    if (newGl === null) {
      throw Error('Gl context cannot be null');
    } else {
      this.gameContext.gl = newGl;
    }

    this.imGuiWebGlHelper.init();

    this.resizeCanvas();

    // Setup components
    this.components.forEach(c => c.initFromLostContext());
  }

  private loop(time: DOMHighResTimeStamp): void {
    // Perf
    const frameStartTime = performance.now();

    // resize as needed
    this.resizeCanvas();

    // Start-frame signal
    this.ioLifeCycle.startFrame(); // IO must be the first one
    this.startFrameImGui(time);
    this.components.forEach(c => c.startFrame());

    // Clear
    this.glClear();

    // Render pass 1 : Components
    this.components.forEach(c => c.render());
    this.renderMetricsComponent();

    // End-of-frame signals
    this.ioLifeCycle.endFrame();
    this.components.forEach(c => c.endFrame());

    // Render pass 2 : ImGui
    // Render UI on top of everything
    ImGui.EndFrame();
    ImGui.Render();
    this.imGuiWebGlHelper.render(ImGui.GetDrawData());

    // Perf time
    this.prevFrameTimes[this.prevFrameTimesIdx] = performance.now() - frameStartTime;
    this.prevFrameTimesIdx = (this.prevFrameTimesIdx + 1) % this.prevFrameTimes.length;

    // Signal next frame
    window.requestAnimationFrame(t => this.done ? this.destroy() : this.loop(t));
  }

  private destroy(): void {
    console.log('RenderLoop.destroy()');

    // Clear screen
    this.glClear();

    // Destroy all components
    this.components.forEach(c => c.destroy());

    // Cleanup
    this.ioLifeCycle.destroy();
    this.imGuiWebGlHelper.destroy();
    ImGui.DestroyContext();

    // Net
    this.netClient.close();

    console.log('Total allocated space (uordblks) @ _done:', ImGui.bind.mallinfo().uordblks);
  }

  private glClear(): void {
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private initAdditionalHandlers(): void {
    this.gl.canvas.addEventListener('contextmenu', e => e.preventDefault());
    this.gl.canvas.addEventListener('webglcontextlost', e => e.preventDefault(), false);
    this.gl.canvas.addEventListener('webglcontextrestored', () => this.initFromLostContext(), false);
  }

  private resizeCanvas() {
    const devicePixelRatio: number = window.devicePixelRatio || 1;
    const canvasWidth = this.gl.canvas.width;
    const canvasHeight = this.gl.canvas.height;
    const desiredWidth = this.gl.canvas.clientWidth * devicePixelRatio;
    const desiredHeight = this.gl.canvas.clientHeight * devicePixelRatio;

    if (canvasWidth !== desiredWidth || canvasHeight !== desiredHeight) {
      this.gl.canvas.width = desiredWidth;
      this.gl.canvas.height = desiredHeight;
      // console.log("Adjusting canvas size");
    }
    // console.log(`${this.gl.canvas.clientWidth === window.innerWidth}, ${this.gl.canvas.clientHeight === window.innerHeight}`);
  }

  private renderMetricsComponent() {
    if (!ImGui.Begin('Metrics', null, ImGui.ImGuiWindowFlags.AlwaysAutoResize)) {
      ImGui.End();
      return;
    }

    const avgFrameTime = this.prevFrameTimes.reduce((a, b) => a + b) / this.prevFrameTimes.length;

    ImGui.Text(`Logged in as: ${this.inMemoryGameSettings.userProfile.username}`);
    ImGui.Text(`Joined room: ${this.inMemoryGameSettings.roomId}`);
    ImGui.Text(`Frame perf: ${avgFrameTime.toFixed(3)} ms`);
    ImGui.Text(`Application average ${(1000.0 / ImGui.GetIO().Framerate).toFixed(3)} ms/frame (${ImGui.GetIO().Framerate.toFixed(1)} FPS)`);

    ImGui.End();
  }

  // TODO: Error handling
  private async fetchAndRegisterFont(url: string, sizePixels: number, glyphRanges: number | null = null) {
    console.log(`Loading font at ${url}`);
    const resp: Response = await fetch(url);
    const fontBuffer: ArrayBuffer = await resp.arrayBuffer();
    const fontConfig = new ImGui.ImFontConfig();
    fontConfig.Name = fontConfig.Name || `${url.split(/[\\\/]/).pop()}, ${sizePixels.toFixed(0)}px`;
    return ImGui.GetIO().Fonts.AddFontFromMemoryTTF(fontBuffer, sizePixels, fontConfig, glyphRanges);
  }

  // TODO: Refactor, turn into its own module
  private async initImGuiFonts() {
    const io = ImGui.GetIO();

    const BUILT_IN_FONT_MAPPING = new Map<string, FontData>([
      ['Fonts/NotoSans-Regular.ttf', {
        name: 'Fonts/NotoSans-Regular.ttf',
        url: require('Fonts/NotoSans-Regular.ttf'),
        pixelSize: 16.0,
        glyphRange: io.Fonts.GetGlyphRangesDefault(),
      }],
      ['Fonts/NotoSansCJK-Regular.ttc', {
        name: 'Fonts/NotoSansCJK-Regular.ttc',
        url: require('Fonts/NotoSansCJK-Regular.ttc'),
        pixelSize: 16.0,
        glyphRange: io.Fonts.GetGlyphRangesChineseFull(),
      }],
    ]);

    const DEFAULT_FONT_NAME = 'Fonts/NotoSans-Regular.ttf';

    const activeFont: FontData | null = await this.persistentGameSettings.getActiveFont();
    if (activeFont === null) {
      console.log(`No active font defined. Using: ${DEFAULT_FONT_NAME}`);

      const font = BUILT_IN_FONT_MAPPING.get(DEFAULT_FONT_NAME);
      font && await this.fetchAndRegisterFont(font.url, font.pixelSize, font.glyphRange);
    } else {
      console.log(`Active font: ${activeFont}`);

      if (BUILT_IN_FONT_MAPPING.has(activeFont.name)) {
        const font = BUILT_IN_FONT_MAPPING.get(activeFont.name);
        font && await this.fetchAndRegisterFont(font.url, font.pixelSize, font.glyphRange);
      } else {
        await this.fetchAndRegisterFont(activeFont.url, activeFont.pixelSize, activeFont.glyphRange);
      }
    }

    io.Fonts.AddFontDefault();
  }

  private async initImGui() {
    await ImGui.default();
    ImGui.IMGUI_CHECKVERSION();
    ImGui.CreateContext();
    ImGui.StyleColorsDark();
    ImGui.LoadIniSettingsFromMemory(window.localStorage.getItem('imgui.ini') || '');

    // Fonts
    try {
      await this.initImGuiFonts();
    } catch (e) {
      // Swallow up here
      // TODO: Better error reporting to user
      console.error(`"Unable to fetch font: ${e}`);
    }

    const io = ImGui.GetIO();

    io.ConfigMacOSXBehaviors = navigator.platform.match(/Mac/) !== null;
    io.SetClipboardTextFn = (useData: any, text: string): void => {
      this.ioLifeCycle.ioState.clipboardText = text;
      // console.log(`set clipboard_text: "${text}"`);
      if (typeof navigator !== 'undefined' && typeof (navigator as any).clipboard !== 'undefined') {
        // console.log(`clipboard.writeText: "${text}"`);
        (navigator as any).clipboard.writeText(text).then((): void => {
          // console.log(`clipboard.writeText: "${text}" done.`);
        });
      }
    };
    io.GetClipboardTextFn = (): string => {
      return this.ioLifeCycle.ioState.clipboardText;
    };
    io.ClipboardUserData = null;

    // Setup back-end capabilities flags
    io.BackendFlags |= ImGui.BackendFlags.HasMouseCursors;   // We can honor GetMouseCursor() values (optional)

    // Keyboard mapping. ImGui will use those indices to peek into the io.KeyDown[] array.
    io.KeyMap[ImGui.Key.Tab] = KeyCodes.Tab;
    io.KeyMap[ImGui.Key.LeftArrow] = KeyCodes.LeftArrow;
    io.KeyMap[ImGui.Key.RightArrow] = KeyCodes.RightArrow;
    io.KeyMap[ImGui.Key.UpArrow] = KeyCodes.UpArrow;
    io.KeyMap[ImGui.Key.DownArrow] = KeyCodes.DownArrow;
    io.KeyMap[ImGui.Key.PageUp] = KeyCodes.PageUp;
    io.KeyMap[ImGui.Key.PageDown] = KeyCodes.PageDown;
    io.KeyMap[ImGui.Key.Home] = KeyCodes.Home;
    io.KeyMap[ImGui.Key.End] = KeyCodes.End;
    io.KeyMap[ImGui.Key.Insert] = KeyCodes.Insert;
    io.KeyMap[ImGui.Key.Delete] = KeyCodes.Delete;
    io.KeyMap[ImGui.Key.Backspace] = KeyCodes.Backspace;
    io.KeyMap[ImGui.Key.Space] = KeyCodes.Space;
    io.KeyMap[ImGui.Key.Enter] = KeyCodes.Enter;
    io.KeyMap[ImGui.Key.Escape] = KeyCodes.Escape;
    io.KeyMap[ImGui.Key.A] = KeyCodes.A;
    io.KeyMap[ImGui.Key.C] = KeyCodes.C;
    io.KeyMap[ImGui.Key.V] = KeyCodes.V;
    io.KeyMap[ImGui.Key.X] = KeyCodes.X;
    io.KeyMap[ImGui.Key.Y] = KeyCodes.Y;
    io.KeyMap[ImGui.Key.Z] = KeyCodes.Z;
  }

  private startFrameImGui(time: DOMHighResTimeStamp): void {
    const io = ImGui.GetIO();

    if (io.WantSaveIniSettings) {
      io.WantSaveIniSettings = false;
      window.localStorage.setItem('imgui.ini', ImGui.SaveIniSettingsToMemory());
    }

    const w: number = this.gl.canvas.clientWidth;
    const h: number = this.gl.canvas.clientHeight;
    const displayWidth: number = this.gl.drawingBufferWidth || w;
    const displayHeight: number = this.gl.drawingBufferHeight || h;
    io.DisplaySize.x = w;
    io.DisplaySize.y = h;
    io.DisplayFramebufferScale.x = w > 0 ? (displayWidth / w) : 0;
    io.DisplayFramebufferScale.y = h > 0 ? (displayHeight / h) : 0;

    const dt: number = time - this.prevTime;
    this.prevTime = time;
    io.DeltaTime = dt / 1000;

    if (io.MouseDrawCursor) {
      document.body.style.cursor = 'none';
    } else {
      switch (ImGui.GetMouseCursor()) {
        case ImGui.MouseCursor.None:
          document.body.style.cursor = 'none';
          break;
        default:
        case ImGui.MouseCursor.Arrow:
          document.body.style.cursor = 'default';
          break;
        case ImGui.MouseCursor.TextInput:
          document.body.style.cursor = 'text';
          break;         // When hovering over InputText, etc.
        case ImGui.MouseCursor.ResizeAll:
          document.body.style.cursor = 'move';
          break;         // Unused
        case ImGui.MouseCursor.ResizeNS:
          document.body.style.cursor = 'ns-resize';
          break;     // When hovering over an horizontal border
        case ImGui.MouseCursor.ResizeEW:
          document.body.style.cursor = 'ew-resize';
          break;     // When hovering over a vertical border or a column
        case ImGui.MouseCursor.ResizeNESW:
          document.body.style.cursor = 'nesw-resize';
          break; // When hovering over the bottom-left corner of a window
        case ImGui.MouseCursor.ResizeNWSE:
          document.body.style.cursor = 'nwse-resize';
          break; // When hovering over the bottom-right corner of a window
        case ImGui.MouseCursor.Hand:
          document.body.style.cursor = 'pointer';
          break;
      }
    }

    ImGui.NewFrame();
  }

  get dispatcher(): EventDispatcher {
    return this.gameContext.dispatcher;
  }

  get io(): State {
    return this.gameContext.io;
  }

  get gl(): WebGLRenderingContext {
    return this.gameContext.gl;
  }
}
