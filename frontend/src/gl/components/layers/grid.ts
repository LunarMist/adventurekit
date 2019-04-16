import * as twgl from 'twgl.js';

import { KeyCodes, MouseCodes } from 'IO/codes';
import * as IOEvent from 'IO/event';
import * as GLUtils from 'GL/utils';
import { RenderComponent } from 'GL/render/renderable';
import { TokenLayerComponent } from 'GL/components/layers/token';

const gridVertexShaderSrc = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const gridFragmentShaderSrc = `
  precision mediump float;

  uniform vec2 u_tilesize; // [width, height]
  uniform vec2 u_gridoffset; // [x, y]
  uniform vec2 u_gridsel; // [x, y]
  vec4 bgColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 lineColor = vec4(0.0, 0.0, 0.0, 0.5);
  vec4 selectedColor = vec4(0.0, 1.0, 0.0, 0.5);

  void main() {
    float x = gl_FragCoord.x + u_gridoffset[0];
    float y = gl_FragCoord.y + u_gridoffset[1];
    int xMod = int(mod(x, u_tilesize[0]));
    int yMod = int(mod(y, u_tilesize[1]));

    float columnId = u_gridsel[0];
    float rowId = u_gridsel[1];

    // [x1, x2, y1, y2]
    vec4 box = vec4(
      columnId * u_tilesize[0] - u_gridoffset[0],
      (columnId + 1.0) * u_tilesize[0] - u_gridoffset[0],
      rowId * u_tilesize[1] - u_gridoffset[1],
      (rowId + 1.0) * u_tilesize[1] - u_gridoffset[1]
    );

    bool selected = gl_FragCoord.x >= box[0]
      && gl_FragCoord.x <= box[1]
      && gl_FragCoord.y >= box[2]
      && gl_FragCoord.y <= box[3];

    if (selected) {
      gl_FragColor = selectedColor;
    } else if (xMod == 0 || yMod == 0) {
      gl_FragColor = lineColor;
    } else {
      gl_FragColor = bgColor;
    }
  }
`;

// TODO: Rewrite more efficiently
// Should not need to be a full-screen fragment shader
// Use lines instead
export class GridPatternComponent extends RenderComponent {
  private readonly tileSize = [50.0, 50.0]; // [width, height]
  private gridOffset = [0.0, 0.0]; // [x, y]
  private prevPointerXY = { x: 0.0, y: 0.0 };

  private readonly tokenLayerComponent: TokenLayerComponent;

  // GL stuff
  private programInfo: twgl.ProgramInfo | null = null;
  private bufferInfo: twgl.BufferInfo | null = null;

  constructor() {
    super();
    this.tokenLayerComponent = new TokenLayerComponent();
    this.children.push(this.tokenLayerComponent);
  }

  init(): void {
    this.io.dispatcher.addHandler(IOEvent.EventType.PointerDown, event => {
      // For touch events: To prevent jank, reset the prev xy
      this.prevPointerXY = { x: event.offsetX, y: event.offsetY };
      if (this.tokenLayerComponent.pickStart(event.offsetX, event.offsetY)) {
        return true;
      }
      return false;
    });

    this.io.dispatcher.addHandler(IOEvent.EventType.PointerUp, event => {
      if (this.tokenLayerComponent.pickEnd()) {
        return true;
      }
      return false;
    });

    this.io.dispatcher.addHandler(IOEvent.EventType.PointerMove, event => {
      const dx = (event.offsetX - this.prevPointerXY.x);
      // dy is inverted because +y is down (instead of up)
      const dy = -(event.offsetY - this.prevPointerXY.y);
      if (this.tokenLayerComponent.pickDrag(dx, dy)) {
        this.prevPointerXY = { x: event.offsetX, y: event.offsetY };
        return true;
      }
      if (this.io.state.pointerDown[MouseCodes.LeftButton]) {
        this.gridOffset[0] += dx;
        this.gridOffset[1] += dy;
        this.prevPointerXY = { x: event.offsetX, y: event.offsetY };
        this.adjustTokenViewport();
        return true;
      }
      this.prevPointerXY = { x: event.offsetX, y: event.offsetY };
      return false;
    });

    this.io.dispatcher.addHandler(IOEvent.EventType.KeyDown, event => {
      if (event.keyCode === KeyCodes.RightArrow) {
        this.gridOffset[0] -= 5;
      } else if (event.keyCode === KeyCodes.LeftArrow) {
        this.gridOffset[0] += 5;
      } else if (event.keyCode === KeyCodes.UpArrow) {
        this.gridOffset[1] -= 5;
      } else if (event.keyCode === KeyCodes.DownArrow) {
        this.gridOffset[1] += 5;
      }
      if (event.keyCode === KeyCodes.RightArrow || event.keyCode === KeyCodes.LeftArrow
        || event.keyCode === KeyCodes.UpArrow || event.keyCode === KeyCodes.DownArrow) {
        this.adjustTokenViewport();
        return true;
      }
      return false;
    });

    this.io.dispatcher.addHandler(IOEvent.EventType.Resized, event => {
      this.adjustTokenViewport();
      return false;
    });

    this.adjustTokenViewport();

    this.initGL();
    super.init();
  }

  adjustTokenViewport() {
    this.tokenLayerComponent.adjustViewport(this.gridOffset[0], this.gridOffset[1], this.gl.canvas.width, this.gl.canvas.height);
  }

  initGL(): void {
    this.programInfo = twgl.createProgramInfo(this.gl, [gridVertexShaderSrc, gridFragmentShaderSrc]);

    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, {
      a_position: {
        numComponents: 2, data: new Float32Array([1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]),
      },
    });
  }

  initFromLostContext(): void {
    this.initGL();
    super.initFromLostContext();
  }

  render(): void {
    if (!this.programInfo || !this.bufferInfo) {
      throw Error('Program info or buffer info is null');
    }

    const scaleFactor = window.devicePixelRatio || 1;
    const gridOff = [(-this.gridOffset[0] * scaleFactor) % this.tileSize[0], (-this.gridOffset[1] * scaleFactor) % this.tileSize[1]];
    const selXY = [this.io.state.pointerX * scaleFactor, (this.gl.canvas.clientHeight - this.io.state.pointerY) * scaleFactor];
    const gridSel = [this.divToInf(selXY[0] + gridOff[0], this.tileSize[0]), this.divToInf(selXY[1] + gridOff[1], this.tileSize[1])];

    this.gl.useProgram(this.programInfo.program);

    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
    twgl.setUniforms(this.programInfo, {
      u_tilesize: this.tileSize,
      u_gridoffset: gridOff,
      u_gridsel: gridSel,
    });

    twgl.drawBufferInfo(this.gl, this.bufferInfo, this.gl.TRIANGLE_STRIP);

    super.render();
  }

  destroy(): void {
    GLUtils.deleteProgramInfo(this.gl, this.programInfo);
    this.programInfo = null;

    GLUtils.deleteBufferInfo(this.gl, this.bufferInfo);
    this.bufferInfo = null;

    super.destroy();
  }

  private divToInf(i: number, div: number): number {
    // return Math.trunc(i / div);
    const q: number = Math.trunc(i / div);
    const r: number = Math.trunc(i % div);
    if (i < 0 && r !== 0) {
      return q - 1;
    }
    return q;
  }
}
