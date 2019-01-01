import * as GLUtils from "GL/utils";
import * as ImGui from "ImGui/imgui";
import {ImTextureID} from "ImGui/imgui";
import {GameContext} from "GL/render";

export class ImGuiImplWebGl {
  private g_ShaderHandle: WebGLProgram | null = null;
  private g_AttribLocationTex: WebGLUniformLocation | null = null;
  private g_AttribLocationProjMtx: WebGLUniformLocation | null = null;
  private g_AttribLocationPosition: GLint = -1;
  private g_AttribLocationUV: GLint = -1;
  private g_AttribLocationColor: GLint = -1;
  private g_VboHandle: WebGLBuffer | null = null;
  private g_ElementsHandle: WebGLBuffer | null = null;

  private g_FontTexture: WebGLTexture | null = null;

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

    this.g_ShaderHandle = GLUtils.createProgramFromSrc(this.gl, vertexShader, fragmentShader);

    if (this.g_ShaderHandle !== null) {
      this.g_AttribLocationTex = this.gl.getUniformLocation(this.g_ShaderHandle, "Texture");
      this.g_AttribLocationProjMtx = this.gl.getUniformLocation(this.g_ShaderHandle, "ProjMtx");
      this.g_AttribLocationPosition = this.gl.getAttribLocation(this.g_ShaderHandle, "Position") || 0;
      this.g_AttribLocationUV = this.gl.getAttribLocation(this.g_ShaderHandle, "UV") || 0;
      this.g_AttribLocationColor = this.gl.getAttribLocation(this.g_ShaderHandle, "Color") || 0;
    }

    this.g_VboHandle = this.gl.createBuffer();
    this.g_ElementsHandle = this.gl.createBuffer();

    const io = ImGui.GetIO();

    // Fonts
    const {width, height, pixels} = io.Fonts.GetTexDataAsRGBA32();   // Load as RGBA 32-bits (75% of the memory is wasted, but default font is so small) because it is more likely to be compatible with user's existing shaders. If your ImTextureId represent a higher-level concept than just a GL texture id, consider calling GetTexDataAsAlpha8() instead to save on GPU memory.

    // Upload texture to graphics system
    this.g_FontTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.g_FontTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

    // Store our identifier
    io.Fonts.TexID = this.g_FontTexture;
  }

  destroy(): void {
    this.gl.deleteBuffer(this.g_VboHandle);
    this.g_VboHandle = null;

    this.gl.deleteBuffer(this.g_ElementsHandle);
    this.g_ElementsHandle = null;

    this.g_AttribLocationTex = null;
    this.g_AttribLocationProjMtx = null;
    this.g_AttribLocationPosition = -1;
    this.g_AttribLocationUV = -1;
    this.g_AttribLocationColor = -1;

    this.gl.deleteProgram(this.g_ShaderHandle);
    this.g_ShaderHandle = null;

    // TODO: Destroy program shaders

    const io = ImGui.GetIO();

    // Destroy font
    io.Fonts.TexID = null;
    this.gl.deleteTexture(this.g_FontTexture);
    this.g_FontTexture = null;
  }

  render(drawData: ImGui.ImDrawData | null): void {
    if (drawData === null) {
      throw new Error("ImGui draw data is null");
    }

    // Avoid rendering when minimized, scale coordinates for retina displays (screen coordinates != framebuffer coordinates)
    const io = ImGui.GetIO();
    const fb_width: number = io.DisplaySize.x * io.DisplayFramebufferScale.x;
    const fb_height: number = io.DisplaySize.y * io.DisplayFramebufferScale.y;
    if (fb_width === 0 || fb_height === 0) {
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
    // Our visible imgui space lies from draw_data->DisplayPps (top left) to draw_data->DisplayPos+data_data->DisplaySize (bottom right). DisplayMin is typically (0,0) for single viewport apps.
    this.gl.viewport(0, 0, fb_width, fb_height);
    const L: number = drawData.DisplayPos.x;
    const R: number = drawData.DisplayPos.x + drawData.DisplaySize.x;
    const T: number = drawData.DisplayPos.y;
    const B: number = drawData.DisplayPos.y + drawData.DisplaySize.y;
    const ortho_projection: Float32Array = new Float32Array([
      2.0 / (R - L), 0.0, 0.0, 0.0,
      0.0, 2.0 / (T - B), 0.0, 0.0,
      0.0, 0.0, -1.0, 0.0,
      (R + L) / (L - R), (T + B) / (B - T), 0.0, 1.0,
    ]);
    this.gl.useProgram(this.g_ShaderHandle);
    this.gl.uniform1i(this.g_AttribLocationTex, 0);
    this.g_AttribLocationProjMtx && this.gl.uniformMatrix4fv(this.g_AttribLocationProjMtx, false, ortho_projection);

    // Render command lists
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.g_VboHandle);
    this.gl.enableVertexAttribArray(this.g_AttribLocationPosition);
    this.gl.enableVertexAttribArray(this.g_AttribLocationUV);
    this.gl.enableVertexAttribArray(this.g_AttribLocationColor);

    this.gl.vertexAttribPointer(this.g_AttribLocationPosition, 2, this.gl.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertPosOffset);
    this.gl.vertexAttribPointer(this.g_AttribLocationUV, 2, this.gl.FLOAT, false, ImGui.ImDrawVertSize, ImGui.ImDrawVertUVOffset);
    this.gl.vertexAttribPointer(this.g_AttribLocationColor, 4, this.gl.UNSIGNED_BYTE, true, ImGui.ImDrawVertSize, ImGui.ImDrawVertColOffset);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.g_VboHandle);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.g_ElementsHandle);

    let currTextId: ImTextureID | null = null;

    // Draw
    const pos = drawData.DisplayPos;
    const idx_buffer_type: GLenum = ((ImGui.ImDrawIdxSize === 4) ? this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT) || 0;
    drawData.IterateDrawLists((draw_list: ImGui.ImDrawList): void => {
      let idx_buffer_offset: number = 0;

      this.gl.bufferData(this.gl.ARRAY_BUFFER, draw_list.VtxBuffer, this.gl.STREAM_DRAW);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, draw_list.IdxBuffer, this.gl.STREAM_DRAW);

      draw_list.IterateDrawCmds((draw_cmd: ImGui.ImDrawCmd): void => {
        if (draw_cmd.UserCallback !== null) {
          // User callback (registered via ImDrawList::AddCallback)
          draw_cmd.UserCallback(draw_list, draw_cmd);
        } else {
          const clip_rect = new ImGui.ImVec4(draw_cmd.ClipRect.x - pos.x, draw_cmd.ClipRect.y - pos.y, draw_cmd.ClipRect.z - pos.x, draw_cmd.ClipRect.w - pos.y);
          if (clip_rect.x < fb_width && clip_rect.y < fb_height && clip_rect.z >= 0.0 && clip_rect.w >= 0.0) {
            // Apply scissor/clipping rectangle
            this.gl.scissor(clip_rect.x, fb_height - clip_rect.w, clip_rect.z - clip_rect.x, clip_rect.w - clip_rect.y);

            // Bind texture, Draw
            if (currTextId !== draw_cmd.TextureId) {
              this.gl.bindTexture(this.gl.TEXTURE_2D, draw_cmd.TextureId);
              currTextId = draw_cmd.TextureId;
            }
            this.gl.drawElements(this.gl.TRIANGLES, draw_cmd.ElemCount, idx_buffer_type, idx_buffer_offset);
          }
        }

        idx_buffer_offset += draw_cmd.ElemCount * ImGui.ImDrawIdxSize;
      });
    });

    this.gl.disable(this.gl.SCISSOR_TEST);

    // Restore modified GL state
    this.gl.disableVertexAttribArray(this.g_AttribLocationPosition);
    this.gl.disableVertexAttribArray(this.g_AttribLocationUV);
    this.gl.disableVertexAttribArray(this.g_AttribLocationColor);
  }
}
