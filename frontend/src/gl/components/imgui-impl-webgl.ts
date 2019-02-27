import { RenderComponent } from 'GL/render/renderable';
import * as GLUtils from 'GL/utils';
import * as ImGui from 'ImGui/imgui';

export class ImGuiImplWebGl extends RenderComponent {
  private programHandle: WebGLProgram | null = null;
  private uniformTexture: WebGLUniformLocation | null = null;
  private uniformProjMtx: WebGLUniformLocation | null = null;
  private attributePosition: GLint = -1;
  private attributeUV: GLint = -1;
  private attributeColor: GLint = -1;
  private vboBuffer: WebGLBuffer | null = null;
  private elementBuffer: WebGLBuffer | null = null;

  private fontTexture: WebGLTexture | null = null;

  private readonly vertexShaderSrc = `
      uniform mat4 ProjMtx;
      attribute vec2 Position;
      attribute vec2 UV;
      attribute vec4 Color;
      varying vec2 Frag_UV;
      varying vec4 Frag_Color;
      void main() {
        Frag_UV = UV;
        Frag_Color = Color;
        gl_Position = ProjMtx * vec4(Position.xy,0,1);
      }
    `;

  private readonly fragmentShaderSrc = `
      precision mediump float;
      uniform sampler2D Texture;
      varying vec2 Frag_UV;
      varying vec4 Frag_Color;
      void main() {
        gl_FragColor = Frag_Color * texture2D(Texture, Frag_UV);
      }
    `;

  init(): void {
    this.programHandle = GLUtils.createProgramFromSrc(this.gl, this.vertexShaderSrc, this.fragmentShaderSrc);

    if (this.programHandle !== null) {
      this.uniformTexture = this.gl.getUniformLocation(this.programHandle, 'Texture');
      this.uniformProjMtx = this.gl.getUniformLocation(this.programHandle, 'ProjMtx');
      this.attributePosition = this.gl.getAttribLocation(this.programHandle, 'Position');
      this.attributeUV = this.gl.getAttribLocation(this.programHandle, 'UV');
      this.attributeColor = this.gl.getAttribLocation(this.programHandle, 'Color');
    }

    this.vboBuffer = this.gl.createBuffer();
    this.elementBuffer = this.gl.createBuffer();

    this.initFont();
  }

  initFont() {
    const io = ImGui.GetIO();

    // Must be called before GetTexDataAsRGBA32()
    // https://github.com/ocornut/imgui/tree/master/misc/freetype
    ImGui.FreeTypeBuildFontAtlas(io.Fonts);

    const { width, height, pixels } = io.Fonts.GetTexDataAsRGBA32();

    // Upload texture to graphics system
    this.fontTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.fontTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

    // Store our identifier
    io.Fonts.TexID = this.fontTexture;
  }

  initFromLostContext(): void {
    this.init();
  }

  render(): void {
    const drawData = ImGui.GetDrawData();
    if (drawData === null) {
      throw new Error('ImGui draw data is null');
    }

    // Avoid rendering when minimized, scale coordinates for retina displays (screen coordinates != framebuffer coordinates)
    const io = ImGui.GetIO();
    const fbWidth: number = io.DisplaySize.x * io.DisplayFramebufferScale.x;
    const fbHeight: number = io.DisplaySize.y * io.DisplayFramebufferScale.y;
    if (fbWidth === 0 || fbHeight === 0) {
      return;
    }
    drawData.ScaleClipRects(io.DisplayFramebufferScale);

    // Setup render state: alpha-blending enabled, no face culling, no depth testing, scissor enabled, polygon fill
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendEquation(this.gl.FUNC_ADD);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.SCISSOR_TEST);

    // Setup orthographic projection matrix
    // Our visible imgui space lies from draw_data->DisplayPps (top left) to draw_data->DisplayPos+data_data->DisplaySize (bottom right).
    // DisplayMin is typically (0,0) for single viewport apps.
    const L: number = drawData.DisplayPos.x;
    const R: number = drawData.DisplayPos.x + drawData.DisplaySize.x;
    const T: number = drawData.DisplayPos.y;
    const B: number = drawData.DisplayPos.y + drawData.DisplaySize.y;
    const orthoProjection: Float32Array = new Float32Array([
      2.0 / (R - L), 0.0, 0.0, 0.0,
      0.0, 2.0 / (T - B), 0.0, 0.0,
      0.0, 0.0, -1.0, 0.0,
      (R + L) / (L - R), (T + B) / (B - T), 0.0, 1.0,
    ]);
    this.gl.useProgram(this.programHandle);
    this.gl.uniform1i(this.uniformTexture, 0);
    this.gl.uniformMatrix4fv(this.uniformProjMtx, false, orthoProjection);

    // Render command lists
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vboBuffer);
    this.gl.enableVertexAttribArray(this.attributePosition);
    this.gl.enableVertexAttribArray(this.attributeUV);
    this.gl.enableVertexAttribArray(this.attributeColor);

    this.gl.vertexAttribPointer(this.attributePosition, 2, this.gl.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertPosOffset);
    this.gl.vertexAttribPointer(this.attributeUV, 2, this.gl.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertUVOffset);
    this.gl.vertexAttribPointer(this.attributeColor, 4, this.gl.UNSIGNED_BYTE, true, ImGui.ImDrawVertSize, ImGui.ImDrawVertColOffset);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vboBuffer);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.elementBuffer);

    let currTextId: ImGui.ImTextureID | null = null;

    // Draw
    const pos = drawData.DisplayPos;
    const idxBufferType: GLenum = ((ImGui.ImDrawIdxSize === 4) ? this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT) || 0;
    drawData.IterateDrawLists((drawList: ImGui.ImDrawList): void => {
      let idxBufferOffset: number = 0;

      this.gl.bufferData(this.gl.ARRAY_BUFFER, drawList.VtxBuffer, this.gl.STREAM_DRAW);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, drawList.IdxBuffer, this.gl.STREAM_DRAW);

      drawList.IterateDrawCmds((drawCmd: ImGui.ImDrawCmd): void => {
        const clipRect = new ImGui.ImVec4(drawCmd.ClipRect.x - pos.x, drawCmd.ClipRect.y - pos.y,
          drawCmd.ClipRect.z - pos.x, drawCmd.ClipRect.w - pos.y);
        if (clipRect.x < fbWidth && clipRect.y < fbHeight && clipRect.z >= 0.0 && clipRect.w >= 0.0) {
          // Apply scissor/clipping rectangle
          this.gl.scissor(clipRect.x, fbHeight - clipRect.w, clipRect.z - clipRect.x, clipRect.w - clipRect.y);

          // Bind texture, Draw
          if (currTextId !== drawCmd.TextureId) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, drawCmd.TextureId);
            currTextId = drawCmd.TextureId;
          }
          this.gl.drawElements(this.gl.TRIANGLES, drawCmd.ElemCount, idxBufferType, idxBufferOffset);
        }

        idxBufferOffset += drawCmd.ElemCount * ImGui.ImDrawIdxSize;
      });
    });

    this.gl.disable(this.gl.SCISSOR_TEST);
  }

  destroy(): void {
    this.destroyFont();

    this.gl.deleteBuffer(this.vboBuffer);
    this.vboBuffer = null;

    this.gl.deleteBuffer(this.elementBuffer);
    this.elementBuffer = null;

    this.uniformTexture = null;
    this.uniformProjMtx = null;
    this.attributePosition = -1;
    this.attributeUV = -1;
    this.attributeColor = -1;

    this.gl.deleteProgram(this.programHandle);
    this.programHandle = null;
  }

  destroyFont() {
    this.gl.deleteTexture(this.fontTexture);
    this.fontTexture = null;
    ImGui.GetIO().Fonts.TexID = null;
  }
}
