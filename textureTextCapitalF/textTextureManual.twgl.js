"use strict";
{
let fVertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
out vec4 v_color;
void main() {
   gl_Position = u_matrix * a_position;
   v_color = a_color;
}
`;

let fFragmentShaderSource = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() {
   outColor = v_color;
}
`;

let textVertexShaderSource = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
uniform mat4 u_matrix;
out vec2 v_texcoord;
void main() {
   gl_Position = u_matrix * a_position;
   v_texcoord = a_texcoord;
}
`;

let textFragmentShaderSource = `#version 300 es
precision highp float;
in vec2 v_texcoord;
uniform sampler2D u_texture;
out vec4 outColor;
void main() {
   outColor = texture(u_texture, v_texcoord);
}
`;

// make a 2d canvas for making text textures.
let textCtx = document.createElement("canvas").getContext("2d");

// Puts text in center of canvas.
function makeTextCanvas(text, width, height) {
   textCtx.canvas.width  = width;
   textCtx.canvas.height = height;
   textCtx.font = "20px monospace";
   textCtx.textAlign = "center";
   textCtx.textBaseline = "middle";
   textCtx.fillStyle = "black";
   textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
   textCtx.fillText(text, width / 2, height / 2);
   return textCtx.canvas;
}

let canvas = document.currentScript.parentElement;
function main() {
   let gl = canvas.getContext("webgl2");

   twgl.setAttributePrefix("a_");
   // setup GLSL programs
   let fProgramInfo    = twgl.createProgramInfo ( gl, [fVertexShaderSource,    fFragmentShaderSource] );
   let textProgramInfo = twgl.createProgramInfo ( gl, [textVertexShaderSource, textFragmentShaderSource]);

   // Create data for 'F'
   let fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
   console.log(JSON.stringify(fBufferInfo));
   let fVAO = twgl.createVAOFromBufferInfo (gl, fProgramInfo, fBufferInfo);

   // Create a unit quad for the 'text'
   let textBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 1);
   let textVAO = twgl.createVAOFromBufferInfo(
         gl, textProgramInfo, textBufferInfo);

   // create text texture.
   let textCanvas = makeTextCanvas("Hello!", 100, 26);
   let textWidth  = textCanvas.width;
   let textHeight = textCanvas.height;
   let textTex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, textTex);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
   gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

   let fUniforms = {u_matrix: m4.identity(),};

   let textUniforms = {
      u_matrix: m4.identity(),
      u_texture: textTex,
   };

    let translation        = [0, 30, 0];
   let rotation           = [rad(190), rad(0), rad(0)];
   let scale              = [1, 1, 1];
   let fieldOfViewRadians = rad(60);
   let rotationSpeed      = 1.2;

   let then = 0;

   requestAnimationFrame(drawScene);

   function drawScene(time) {
      // Convert to seconds
      let now = time * 0.001;
      // Subtract the previous time from the current time
      let deltaTime = now - then;
      // Remember the current time for the next frame.
      then = now;

      twgl.resizeCanvasToDisplaySize(gl.canvas);

      // Every frame increase the rotation a little.
      rotation[1] += rotationSpeed * deltaTime;

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // turn on depth testing
      gl.enable(gl.DEPTH_TEST);

      // tell webgl to cull faces
      gl.enable(gl.CULL_FACE);

      gl.disable(gl.BLEND);
      gl.depthMask(true);

      // Compute the matrix
      let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      let zNear = 1;
      let zFar = 2000;
      let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

      // Compute the camera's matrix using look at.
      let cameraRadius = 360;
      let cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius];
      let target = [0, 0, 0];
      let up = [0, 1, 0];
      let cameraMatrix = m4.lookAt(cameraPosition, target, up);
      let viewMatrix = m4.inverse(cameraMatrix);

      let textPositions = [];

      let spread = 170;
      for (let yy = -1; yy <= 1; ++yy) {
         for (let xx = -2; xx <= 2; ++xx) {
            let fViewMatrix = m4.translate(viewMatrix,
               translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
            fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
            fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
            fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
            fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
            fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);

            // remember the position for the text
            textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);

            // setup to draw the 'F'
            gl.useProgram(fProgramInfo.program);

            // setup the attributes and buffers for the F
            gl.bindVertexArray(fVAO);

            fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

            twgl.setUniforms(fProgramInfo, fUniforms);

            twgl.drawBufferInfo(gl, fBufferInfo);
         }
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);

      textPositions.forEach(function(pos) {
         // use just the view position of the 'F' for the text
         let textMatrix = m4.translate(projectionMatrix,
               pos[0], pos[1], pos[2]);
         // scale the F to the size we need it.
         textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

         // setup to draw the text.
         gl.useProgram(textProgramInfo.program);

         gl.bindVertexArray(textVAO);

         m4.copy(textMatrix, textUniforms.u_matrix);
         twgl.setUniforms(textProgramInfo, textUniforms);

         // Draw the text.
         twgl.drawBufferInfo(gl, textBufferInfo);
      });

      requestAnimationFrame(drawScene);
   }
}

main();

}