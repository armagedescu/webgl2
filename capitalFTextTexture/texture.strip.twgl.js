{
"use strict";
let canvas = document.currentScript.parentElement;
// make a 2d canvas for making text textures.
let textCtx = document.createElement("canvas").getContext("2d");

function main() {

  let gl = canvas.getContext("webgl2");

  // tell twgl to match program to a_program and
  // normal to a_normal etc...
  twgl.setAttributePrefix("a_");

  let vertexShaderElement   = document.evaluate ("./script[@type='text/glsl-shader' and @data-gl-type='vertex-shader']",   canvas).iterateNext();
  let fragmentShaderElement = document.evaluate ("./script[@type='text/glsl-shader' and @data-gl-type='fragment-shader']", canvas).iterateNext();
  let textProgramInfo = twgl.createProgramInfo(gl, [vertexShaderElement.textContent.trim(), fragmentShaderElement.textContent.trim()]);

  // Create a unit quad for the 'text'
  let textBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 1);
  let textVAO = twgl.createVAOFromBufferInfo(gl, textProgramInfo, textBufferInfo);

  // create text texture.
  let textCanvas = makeTextCanvas("Hello!", 100, 26);  // private lib api
  let textTex   = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let textUniforms = {
    u_matrix: m4.identity(),
    u_texture: textTex,
  };

  gl.useProgram(textProgramInfo.program);
  gl.bindVertexArray(textVAO);
  m4.identity ( textUniforms.u_matrix);
  twgl.setUniforms(textProgramInfo, textUniforms);
  twgl.drawBufferInfo(gl, textBufferInfo);

}

main();
}