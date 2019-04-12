import * as GLUtils from 'GL/utils';
import { MouseCodes } from 'IO/codes';
import * as IOEvent from 'IO/event';
import { RenderComponent } from 'GL/render/renderable';
import { TokenLayerComponent } from 'GL/components/layers/token';

// TODO: Rewrite more efficiently
// Should not need to be a full-screen fragment shader
// Use lines instead
export class GridPatternComponent extends RenderComponent {
  private program: WebGLProgram | null = null;
  private readonly vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
  private readonly tileSize = [50.0, 50.0]; // [width, height]
  private gridOffset = [0.0, 0.0]; // [x, y]
  private prevPointerXY = { x: 0.0, y: 0.0 };

  private readonly tokenLayerComponent: TokenLayerComponent;

  constructor() {
    super();
    this.tokenLayerComponent = new TokenLayerComponent();
    this.children.push(this.tokenLayerComponent);
  }

  init(): void {
    this.io.dispatcher.addHandler(IOEvent.EventType.PointerDown, event => {
      // For touch events: To prevent jank, reset the prev xy
      this.prevPointerXY = { x: event.offsetX, y: event.offsetY };
      return false;
    });

    this.io.dispatcher.addHandler(IOEvent.EventType.PointerMove, event => {
      if (this.io.state.pointerDown[MouseCodes.LeftButton]) {
        this.gridOffset[0] += (event.offsetX - this.prevPointerXY.x);
        this.gridOffset[1] += (event.offsetY - this.prevPointerXY.y);
        this.prevPointerXY = { x: event.offsetX, y: event.offsetY };
        this.adjustTokenViewport();
        return true;
      }
      this.prevPointerXY = { x: event.offsetX, y: event.offsetY };
      return false;
    });

    this.io.dispatcher.addHandler(IOEvent.EventType.Resized, event => {
      this.adjustTokenViewport();
      return false;
    });

    this.initGL();
    super.init();
  }

  adjustTokenViewport() {
    this.tokenLayerComponent.adjustViewport({
      minX: -this.gridOffset[0],
      maxX: -this.gridOffset[0] + this.gl.canvas.width,
      minY: this.gridOffset[1],
      maxY: this.gridOffset[1] + this.gl.canvas.height,
    }, { x: this.gridOffset[0], y: this.gridOffset[1] });
  }

  initGL(): void {
    const vs = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `;

    const fs = `
      precision mediump float;

      uniform vec2 tileSize; // [width, height]
      uniform vec2 gridOffset; // [x, y]
      uniform vec2 gridSelection; // [x, y]
      vec4 bgColor = vec4(1.0, 1.0, 1.0, 1.0);
      vec4 lineColor = vec4(0.0, 0.0, 0.0, 0.5);
      vec4 selectedColor = vec4(0.0, 1.0, 0.0, 0.5);

      void main() {
        float x = gl_FragCoord.x + gridOffset[0];
        float y = gl_FragCoord.y + gridOffset[1];
        int xMod = int(mod(x, tileSize[0]));
        int yMod = int(mod(y, tileSize[1]));

        float columnId = gridSelection[0];
        float rowId = gridSelection[1];

        // [x1, x2, y1, y2]
        vec4 box = vec4(
          columnId * tileSize[0] - gridOffset[0],
          (columnId + 1.0) * tileSize[0] - gridOffset[0],
          rowId * tileSize[1] - gridOffset[1],
          (rowId + 1.0) * tileSize[1] - gridOffset[1]
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

    this.program = GLUtils.createProgramFromSrc(this.gl, vs, fs);
  }

  initFromLostContext(): void {
    this.initGL();
    super.initFromLostContext();
  }

  render(): void {
    if (this.program === null) {
      return;
    }

    const scaleFactor = window.devicePixelRatio || 1;

    this.gl.useProgram(this.program);

    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

    const aVertexPosition = this.gl.getAttribLocation(this.program, 'aVertexPosition');
    this.gl.enableVertexAttribArray(aVertexPosition);
    this.gl.vertexAttribPointer(aVertexPosition, 2, this.gl.FLOAT, false, 0, 0);

    const tileSize = this.gl.getUniformLocation(this.program, 'tileSize');
    this.gl.uniform2fv(tileSize, this.tileSize);

    const gridOffset = this.gl.getUniformLocation(this.program, 'gridOffset');
    const gridOff = [(this.gridOffset[0] * scaleFactor) % this.tileSize[0], (this.gridOffset[1] * scaleFactor) % this.tileSize[1]];
    this.gl.uniform2fv(gridOffset, gridOff);

    const gridSelection = this.gl.getUniformLocation(this.program, 'gridSelection');
    const selXY = [this.io.state.pointerX * scaleFactor, (this.gl.canvas.clientHeight - this.io.state.pointerY) * scaleFactor];
    const gridSel = [this.divToInf(selXY[0] + gridOff[0], this.tileSize[0]), this.divToInf(selXY[1] + gridOff[1], this.tileSize[1])];
    this.gl.uniform2fv(gridSelection, gridSel);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertices.length / 2);
    super.render();
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
    this.program = null;
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
