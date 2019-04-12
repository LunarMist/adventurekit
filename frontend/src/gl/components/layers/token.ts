import { TokenProto } from 'rpgcore-common/es-proto';
import { EventAggCategories, EventCategories } from 'rpgcore-common/es';
import { m4 } from 'twgl.js';
import rbush from 'rbush';

import { RenderComponent } from 'GL/render/renderable';
import * as GLUtils from 'GL/utils';
import RBush = rbush.RBush;
import BBox = rbush.BBox;

// (x,y) is bottom-left
class TokenItem implements BBox {
  token: TokenProto.Token;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor(token: TokenProto.Token) {
    this.token = token;
    this.minX = this.token.x;
    this.maxX = this.token.x + this.token.width;
    this.minY = this.token.y;
    this.maxY = this.token.y + this.token.height;
  }
}

const tokenTextureVertexShaderSrc = `
  attribute vec4 a_position;
  attribute vec2 a_texcoord;

  uniform mat4 u_matrix;

  varying vec2 v_texcoord;

  void main() {
     gl_Position = u_matrix * a_position;
     v_texcoord = a_texcoord;
  }
`;

const tokenTextureFragmentShaderSrc = `
  precision mediump float;

  varying vec2 v_texcoord;

  uniform sampler2D u_texture;

  void main() {
     gl_FragColor = texture2D(u_texture, v_texcoord);
  }
`;

export class TokenLayerComponent extends RenderComponent {
  private readonly rtree: RBush<TokenItem>;
  private viewport: BBox;
  // (x,y) is bottom-left
  private offset: { x: number; y: number };
  private visibleItems: TokenItem[] = [];

  // Gl stuff
  private programHandle: WebGLProgram | null = null;
  private tokenTextures = new Map<string, WebGLTexture | null>();

  private positionLocation: GLint = -1;
  private texcoordLocation: GLint = -1;
  private matrixLocation: WebGLUniformLocation | null = null;
  private textureLocation: WebGLUniformLocation | null = null;

  private positionBuffer: WebGLBuffer | null = null;
  private texcoordBuffer: WebGLBuffer | null = null;

  constructor() {
    super();
    this.rtree = rbush();
    this.viewport = { minX: -10000, maxX: 10000, minY: -10000, maxY: 10000 };
    this.offset = { x: 0, y: 0 };
    this.refreshVisibleItems();
  }

  init(): void {
    this.es.addEventListener(EventCategories.TokenChangeEvent, dataPack => {
      const event = TokenProto.TokenChangeEvent.decode(dataPack.dataUi8);
      console.log('Token event listener:');
      console.log('\t', event);
      console.log('\t', this.es.aggs.tokenSet);

      if (!event.id) {
        return;
      }
      const token = this.es.aggs.tokenSet.tokens[event.id];

      switch (event.changeType) {
        case TokenProto.TokenChangeType.CREATE:
          this.addNewToken(token);
          break;
        case TokenProto.TokenChangeType.UPDATE:
          this.updateToken(token);
          break;
        case TokenProto.TokenChangeType.DELETE:
          this.removeToken(token);
          break;
        default:
          throw Error(`Unknown change type: ${event.changeType}`);
      }
    });

    this.es.addResyncListener(EventAggCategories.TokenSet, () => {
      console.log('Token agg listener:');
      console.log('\t', this.es.aggs.tokenSet);
      this.processAgg(this.es.aggs.tokenSet);
    });

    this.initGL();
  }

  private initGL() {
    this.programHandle = GLUtils.createProgramFromSrc(this.gl, tokenTextureVertexShaderSrc, tokenTextureFragmentShaderSrc);

    if (this.programHandle !== null) {
      this.positionLocation = this.gl.getAttribLocation(this.programHandle, 'a_position');
      this.texcoordLocation = this.gl.getAttribLocation(this.programHandle, 'a_texcoord');
      this.matrixLocation = this.gl.getUniformLocation(this.programHandle, 'u_matrix');
      this.textureLocation = this.gl.getUniformLocation(this.programHandle, 'u_texture');
    }

    // Create a buffer.
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1,
    ]), this.gl.STATIC_DRAW);

    // Create a buffer for texture coords
    this.texcoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1,
    ]), this.gl.STATIC_DRAW);
  }

  initFromLostContext(): void {
    this.initGL();
    this.loadVisibleTextures(true);
  }

  destroy(): void {
    this.gl.deleteProgram(this.programHandle);
    this.programHandle = null;

    this.tokenTextures.forEach(v => this.gl.deleteTexture(v));
    this.tokenTextures.clear();

    this.positionLocation = -1;
    this.texcoordLocation = -1;
    this.matrixLocation = null;
    this.textureLocation = null;

    this.gl.deleteBuffer(this.positionBuffer);
    this.positionBuffer = null;

    this.gl.deleteBuffer(this.texcoordBuffer);
    this.texcoordBuffer = null;
  }

  render(): void {
    this.visibleItems.forEach(item => {
      const texture = this.tokenTextures.get(item.token.url);
      if (texture === undefined) {
        console.warn(`Unable to get texture for url ${item.token.url}`);
        return;
      }
      this.drawToken(item, texture);
    });
  }

  private drawToken(item: TokenItem, texture: WebGLTexture | null) {
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendEquation(this.gl.FUNC_ADD);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.SCISSOR_TEST);

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.useProgram(this.programHandle);

    // Setup the attributes to pull data from our buffers
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
    this.gl.enableVertexAttribArray(this.texcoordLocation);
    this.gl.vertexAttribPointer(this.texcoordLocation, 2, this.gl.FLOAT, false, 0, 0);

    let matrix = m4.ortho(0, this.gl.canvas.width, this.gl.canvas.height, 0, -1, 1);
    // Since +y is downward, we need to invert the y axis
    matrix = m4.translate(matrix, [item.token.x + this.offset.x, this.gl.canvas.height - item.token.height - item.token.y + this.offset.y, 0]);
    matrix = m4.scale(matrix, [item.token.width, item.token.height, 1]);

    this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
    this.gl.uniform1i(this.textureLocation, 0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private processAgg(tokenSet: TokenProto.TokenSet) {
    // Clear
    this.rtree.clear();

    // Add all tokens
    for (const tokenId in tokenSet.tokens) {
      const token = tokenSet.tokens[tokenId];
      const bbox = new TokenItem(token);
      this.rtree.insert(bbox);
    }

    // Refresh visibility list
    this.refreshVisibleItems();

    // Load textures for visible items
    this.loadVisibleTextures();
  }

  private addNewToken(token: TokenProto.Token) {
    // Insert into rtree
    this.rtree.insert(new TokenItem(token));

    // Refresh visibility list
    this.refreshVisibleItems();

    // Load single texture
    if (!this.tokenTextures.has(token.url)) {
      this.tokenTextures.set(token.url, this.loadTexture(token.url));
    }
  }

  private updateToken(token: TokenProto.Token) {
    // Remove and reinsert
    this.rtree.remove(new TokenItem(token), (a, b) => a.token.id === b.token.id);
    this.rtree.insert(new TokenItem(token));

    // Refresh visibility list
    this.refreshVisibleItems();

    // Load single texture
    if (!this.tokenTextures.has(token.url)) {
      this.tokenTextures.set(token.url, this.loadTexture(token.url));
    }
  }

  private removeToken(token: TokenProto.Token) {
    // Remove from rtree
    this.rtree.remove(new TokenItem(token), (a, b) => a.token.id === b.token.id);

    // Refresh visibility list
    this.refreshVisibleItems();

    // Load textures for visible items
    this.loadVisibleTextures();
  }

  // We cache the list of visible items
  // This makes rendering faster at the expense of memory, since a tree search is not always needed every frame
  private refreshVisibleItems(): void {
    this.visibleItems = this.rtree.search(this.viewport);
  }

  public adjustViewport(viewport: BBox, offset: { x: number; y: number }): void {
    this.viewport = viewport;
    this.offset = offset;

    // Refresh visibility list
    this.refreshVisibleItems();

    // Load textures for visible items
    this.loadVisibleTextures();
  }

  private loadVisibleTextures(forceReload: boolean = false) {
    const newTexturesMap = new Map<string, WebGLTexture | null>();

    if (forceReload) {
      this.tokenTextures.forEach(t => this.gl.deleteTexture(t));
      this.tokenTextures.clear();
    }

    this.visibleItems.forEach(item => {
      const existingTexture = this.tokenTextures.get(item.token.url);
      if (existingTexture !== undefined) {
        // Was already previously loaded
        newTexturesMap.set(item.token.url, existingTexture);
      } else {
        // We have to load it
        newTexturesMap.set(item.token.url, this.loadTexture(item.token.url));
      }
    });

    // Find out which textures are unused and can now be freed
    newTexturesMap.forEach((value, key) => this.tokenTextures.delete(key));
    this.tokenTextures.forEach(t => this.gl.deleteTexture(t));

    this.tokenTextures = newTexturesMap;
  }

  private loadTexture(src: string, texture: WebGLTexture | null = null): WebGLTexture | null {
    const newTexture = texture || this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, newTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    const image = new Image();
    image.onload = e => {
      this.gl.bindTexture(this.gl.TEXTURE_2D, newTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

      // WebGL has different requirements for power of 2 images vs non power of 2 images
      if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
      } else {
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      }
    };
    image.onerror = e => {
      console.warn(`Unable to load image at ${src}. Using placeholder image.`);
      if (src === this.placeholderImageB64) {
        throw Error('Unable to load place image');
      }
      this.loadTexture(this.placeholderImageB64, newTexture);
    };
    image.src = src;
    return newTexture;
  }

  private isPowerOf2(value: number) {
    return (value & (value - 1)) === 0;
  }

  // tslint:disable-next-line:max-line-length
  private placeholderImageB64: string = 'data:image/png;base64,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';
}
