import { FontData } from 'rpgcore-common/types';

import { IOLifeCycle } from 'IO/lifecycle';
import * as ImGui from 'ImGui/imgui';
import { KeyCodes } from 'IO/codes';
import { ImGuiIOConnector } from 'IO/imgui';
import { ImGuiImplWebGl } from 'GL/components/imgui-impl-webgl';
import { GameNetClient } from 'Net/game-net-client';
import { SocketIONetClient } from 'Net/socketio-client';
import { NetClient } from 'Net/net-client';
import PersistentGameSettings from 'Store/Persistent-game-settings';
import InMemorySharedStore from 'Store/In-memory-shared-store';
import { GameContext, RenderComponent } from 'GL/render/renderable';
import { DEFAULT_ACTIVE_FONT, FontSelectorComponent } from 'GL/components/window/font-selector';
import { GameMessagesBroker } from 'Message/game-messages';
import { ESGameClient } from 'Event/es-game-client';

export class RenderLoop {
  private done: boolean = false;

  private readonly ioLifeCycle: IOLifeCycle;
  private readonly imGuiIOConnector: ImGuiIOConnector;
  private readonly netClient: NetClient;
  private readonly gameNetClient: GameNetClient;
  private readonly gameMessageBroker: GameMessagesBroker;
  private readonly persistentGameSettings: PersistentGameSettings;
  private readonly inMemorySharedStore: InMemorySharedStore;
  private readonly esClient: ESGameClient;

  private readonly gameContext: GameContext;
  private readonly imGuiImplWebGl: ImGuiImplWebGl;

  private prevFrameTime: number = 0;
  private prevFrameTimes: number[] = [];
  private prevFrameTimesIdx: number = 0;
  private readonly prevFrameTimesWindow: number = 20;

  constructor(readonly components: RenderComponent[], readonly canvas: HTMLCanvasElement) {
    this.ioLifeCycle = new IOLifeCycle(this.canvas);
    this.imGuiIOConnector = new ImGuiIOConnector();
    this.netClient = new SocketIONetClient();
    this.gameNetClient = new GameNetClient(this.netClient);
    this.persistentGameSettings = new PersistentGameSettings();
    this.inMemorySharedStore = new InMemorySharedStore();
    this.gameMessageBroker = new GameMessagesBroker();
    this.esClient = new ESGameClient(this.gameNetClient, this.inMemorySharedStore);

    // https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
    const newGl = canvas.getContext('webgl', { alpha: false });
    if (newGl === null) {
      throw Error('Gl context cannot be null');
    }

    this.gameContext = {
      gl: newGl,
      net: this.gameNetClient,
      store: { mem: this.inMemorySharedStore, p: this.persistentGameSettings },
      broker: this.gameMessageBroker,
      io: { dispatcher: this.ioLifeCycle.dispatcher, state: this.ioLifeCycle.ioState },
      es: this.esClient,
    };

    this.imGuiImplWebGl = new ImGuiImplWebGl();
    this.imGuiImplWebGl.bindContext(this.gameContext);

    for (let i = 0; i < this.prevFrameTimesWindow; i++) {
      this.prevFrameTimes.push(0);
    }
  }

  run(): RenderLoop {
    if (typeof (window) === 'undefined') {
      throw new Error('window must be defined');
    }

    window.requestAnimationFrame(() => this.init());
    return this;
  }

  private async init() {
    // Init everything
    this.ioLifeCycle.init();
    this.imGuiIOConnector.init(this.gameContext.io.dispatcher);
    this.initAdditionalHandlers();
    await this.initImGui();

    // Init net
    this.netClient.open();
    this.gameNetClient.listenInitState(initState => {
      console.log('Setting initial state');
      this.inMemorySharedStore.userProfile = initState.userProfile;
      this.inMemorySharedStore.roomId = initState.roomId;
      if (initState.roomId !== -1) {
        this.esClient.requestWorldState()
          .then(seqId => this.esClient.init(seqId))
          .catch(console.error);
      }
    });

    this.resizeCanvas();

    // Setup components
    this.imGuiImplWebGl.init();
    this.components.forEach(c => {
      c.bindContext(this.gameContext);
      c.init();
    });

    window.requestAnimationFrame(t => this.loop(t));
  }

  private initFromLostContext() {
    console.log('RenderLoop.initFromLostContext()');

    const newGl = this.canvas.getContext('webgl', { alpha: false });
    if (newGl === null) {
      throw Error('Gl context cannot be null');
    } else {
      this.gameContext.gl = newGl;
    }

    this.resizeCanvas();

    // Setup components
    this.imGuiImplWebGl.initFromLostContext();
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
    this.esClient.dispatchEvents();
    this.imGuiImplWebGl.startFrame();
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
    this.imGuiImplWebGl.render();

    // Special case
    this.imGuiImplWebGl.endFrame();

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
    this.imGuiImplWebGl.destroy();
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

    ImGui.Text(`Logged in as: ${this.inMemorySharedStore.userProfile.username}`);
    ImGui.Text(`Joined room: ${this.inMemorySharedStore.roomId}`);
    ImGui.Text(`Frame perf: ${avgFrameTime.toFixed(3)} ms`);
    ImGui.Text(`Application average ${(1000.0 / ImGui.GetIO().Framerate).toFixed(3)} ms/frame (${ImGui.GetIO().Framerate.toFixed(1)} FPS)`);

    ImGui.End();
  }

  private async initFonts() {
    const io = ImGui.GetIO();

    const activeFont: FontData = await this.persistentGameSettings.getActiveFont() || DEFAULT_ACTIVE_FONT;

    try {
      await FontSelectorComponent.fetchAndRegisterFont(activeFont);
    } catch (e) {
      // If something goes wrong fetching and registering the font, then suppress it and fallback to the default ImGui font
      // This is to prevent the graphics from rendering badly (and, say, preventing the user from selecting a different font)
    }

    io.Fonts.AddFontDefault();
  }

  private async initImGui() {
    await ImGui.default();
    ImGui.IMGUI_CHECKVERSION();
    ImGui.CreateContext();
    ImGui.StyleColorsDark();
    ImGui.LoadIniSettingsFromMemory(window.localStorage.getItem('imgui.ini') || '');

    await this.initFonts();

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

    const dt: number = time - this.prevFrameTime;
    this.prevFrameTime = time;
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

  get gl() {
    return this.gameContext.gl;
  }
}
