import * as GLUtils from 'GL/utils';
import * as ImGui from 'ImGui/imgui';
import { GameContext } from 'GL/render';

export class ImGuiImplWebGl {
  private shaderHandle: WebGLProgram | null = null;
  private attribLocationTex: WebGLUniformLocation | null = null;
  private attribLocationProjMtx: WebGLUniformLocation | null = null;
  private attribLocationPosition: GLint = -1;
  private attribLocationUV: GLint = -1;
  private attribLocationColor: GLint = -1;
  private vboHandle: WebGLBuffer | null = null;
  private elementsHandle: WebGLBuffer | null = null;

  private fontTexture: WebGLTexture | null = null;

  constructor(readonly context: GameContext) {

  }

  private get gl(): WebGLRenderingContext {
    return this.context.gl;
  }

  init(): void {
    const vertexShader = `
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

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D Texture;
      varying vec2 Frag_UV;
      varying vec4 Frag_Color;
      void main() {
        gl_FragColor = Frag_Color * texture2D(Texture, Frag_UV);
      }
    `;

    this.shaderHandle = GLUtils.createProgramFromSrc(this.gl, vertexShader, fragmentShader);

    if (this.shaderHandle !== null) {
      this.attribLocationTex = this.gl.getUniformLocation(this.shaderHandle, 'Texture');
      this.attribLocationProjMtx = this.gl.getUniformLocation(this.shaderHandle, 'ProjMtx');
      this.attribLocationPosition = this.gl.getAttribLocation(this.shaderHandle, 'Position') || 0;
      this.attribLocationUV = this.gl.getAttribLocation(this.shaderHandle, 'UV') || 0;
      this.attribLocationColor = this.gl.getAttribLocation(this.shaderHandle, 'Color') || 0;
    }

    this.vboHandle = this.gl.createBuffer();
    this.elementsHandle = this.gl.createBuffer();

    const io = ImGui.GetIO();

    // Must be called before GetTexDataAsRGBA32()
    ImGui.FreeTypeBuildFontAtlas(io.Fonts);

    // Fonts
    // Load as RGBA 32-bits (75% of the memory is wasted, but default font is so small) because it is more likely to be compatible
    // with user's existing shaders. If your ImTextureId represent a higher-level concept than just a GL texture id, consider calling
    // GetTexDataAsAlpha8() instead to save on GPU memory.
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

  destroy(): void {
    this.gl.deleteBuffer(this.vboHandle);
    this.vboHandle = null;

    this.gl.deleteBuffer(this.elementsHandle);
    this.elementsHandle = null;

    this.attribLocationTex = null;
    this.attribLocationProjMtx = null;
    this.attribLocationPosition = -1;
    this.attribLocationUV = -1;
    this.attribLocationColor = -1;

    this.gl.deleteProgram(this.shaderHandle);
    this.shaderHandle = null;

    // TODO: Destroy program shaders

    const io = ImGui.GetIO();

    // Destroy font
    io.Fonts.TexID = null;
    this.gl.deleteTexture(this.fontTexture);
    this.fontTexture = null;
  }

  render(drawData: ImGui.ImDrawData | null): void {
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

    // Setup viewport, orthographic projection matrix
    // Our visible imgui space lies from draw_data->DisplayPps (top left) to draw_data->DisplayPos+data_data->DisplaySize (bottom right).
    // DisplayMin is typically (0,0) for single viewport apps.
    this.gl.viewport(0, 0, fbWidth, fbHeight);
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
    this.gl.useProgram(this.shaderHandle);
    this.gl.uniform1i(this.attribLocationTex, 0);
    this.attribLocationProjMtx && this.gl.uniformMatrix4fv(this.attribLocationProjMtx, false, orthoProjection);

    // Render command lists
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vboHandle);
    this.gl.enableVertexAttribArray(this.attribLocationPosition);
    this.gl.enableVertexAttribArray(this.attribLocationUV);
    this.gl.enableVertexAttribArray(this.attribLocationColor);

    this.gl.vertexAttribPointer(this.attribLocationPosition, 2, this.gl.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertPosOffset);
    this.gl.vertexAttribPointer(this.attribLocationUV, 2, this.gl.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertUVOffset);
    this.gl.vertexAttribPointer(this.attribLocationColor, 4, this.gl.UNSIGNED_BYTE, true, ImGui.ImDrawVertSize, ImGui.ImDrawVertColOffset);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vboHandle);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.elementsHandle);

    let currTextId: ImGui.ImTextureID | null = null;

    // Draw
    const pos = drawData.DisplayPos;
    const idxBufferType: GLenum = ((ImGui.ImDrawIdxSize === 4) ? this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT) || 0;
    drawData.IterateDrawLists((drawList: ImGui.ImDrawList): void => {
      let idxBufferOffset: number = 0;

      this.gl.bufferData(this.gl.ARRAY_BUFFER, drawList.VtxBuffer, this.gl.STREAM_DRAW);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, drawList.IdxBuffer, this.gl.STREAM_DRAW);

      drawList.IterateDrawCmds((drawCmd: ImGui.ImDrawCmd): void => {
        if (drawCmd.UserCallback !== null) {
          // User callback (registered via ImDrawList::AddCallback)
          drawCmd.UserCallback(drawList, drawCmd);
        } else {
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
        }

        idxBufferOffset += drawCmd.ElemCount * ImGui.ImDrawIdxSize;
      });
    });

    this.gl.disable(this.gl.SCISSOR_TEST);

    // Restore modified GL state
    this.gl.disableVertexAttribArray(this.attribLocationPosition);
    this.gl.disableVertexAttribArray(this.attribLocationUV);
    this.gl.disableVertexAttribArray(this.attribLocationColor);
  }
}
