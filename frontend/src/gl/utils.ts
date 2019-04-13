import { BufferInfo, ProgramInfo } from 'twgl.js';

export function compileShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: number): WebGLShader | null {
  const shader = gl.createShader(shaderType);
  if (shader === null) {
    return null;
  }
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  // Check if it compiled
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    throw new Error(`Could not compile shader: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
}

export function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader | null,
                              fragmentShader: WebGLShader | null): WebGLProgram | null {
  if (vertexShader === null || fragmentShader === null) {
    return null;
  }
  const program = gl.createProgram();
  if (program === null) {
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Check
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`Could not compile WebGL program: ${gl.getProgramInfoLog(program)}`);
  }

  return program;
}

export function createProgramFromSrc(gl: WebGLRenderingContext, vertexShaderSrc: string, fragmentShaderSrc: string): WebGLProgram | null {
  const vs = compileShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER);
  // TODO: Do I need to unlink and destroy shaders? How about on lost context?
  return createProgram(gl, vs, fs);
}

export function deleteProgramInfo(gl: WebGLRenderingContext, programInfo: ProgramInfo | null) {
  if (programInfo) {
    gl.deleteProgram(programInfo.program);
  }
}

export function deleteBufferInfo(gl: WebGLRenderingContext, bufferInfo: BufferInfo | null) {
  if (bufferInfo && bufferInfo.attribs) {
    Object.values(bufferInfo.attribs).forEach(v => gl.deleteBuffer(v.buffer));
    if (bufferInfo.indices) {
      gl.deleteBuffer(bufferInfo.indices);
    }
  }
}
