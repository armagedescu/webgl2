"use strict";

// make a 2d canvas for making text textures.
var textCtx = document.createElement("canvas").getContext("2d");

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

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // tell twgl to match program to a_program and
  // normal to a_normal etc...
  twgl.setAttributePrefix("a_");

  // setup GLSL programs
  var fProgramInfo    = twgl.createProgramInfo ( gl, [fVertexShaderSource,    fFragmentShaderSource] );
  var textProgramInfo = twgl.createProgramInfo ( gl, [textVertexShaderSource, textFragmentShaderSource]);

  // Create data for 'F'
  var fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
  console.log(JSON.stringify(fBufferInfo));
  var fVAO = twgl.createVAOFromBufferInfo (gl, fProgramInfo, fBufferInfo);

  // Create a unit quad for the 'text'
  var textBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 1);
  var textVAO = twgl.createVAOFromBufferInfo(
      gl, textProgramInfo, textBufferInfo);

  // create text texture.
  var textCanvas = makeTextCanvas("Hello!", 100, 26);
  var textWidth  = textCanvas.width;
  var textHeight = textCanvas.height;
  var textTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var fUniforms = {
    u_matrix: m4.identity(),
  };

  var textUniforms = {
    u_matrix: m4.identity(),
    u_texture: textTex,
  };

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var translation = [0, 30, 0];
  var rotation = [degToRad(190), degToRad(0), degToRad(0)];
  var scale = [1, 1, 1];
  var fieldOfViewRadians = degToRad(60);
  var rotationSpeed = 1.2;

  var then = 0;

  requestAnimationFrame(drawScene);

  function drawScene(time) {
    // Convert to seconds
    var now = time * 0.001;
    // Subtract the previous time from the current time
    var deltaTime = now - then;
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
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute the camera's matrix using look at.
    var cameraRadius = 360;
    var cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);
    var viewMatrix = m4.inverse(cameraMatrix);

    var textPositions = [];

    var spread = 170;
    for (var yy = -1; yy <= 1; ++yy) {
      for (var xx = -2; xx <= 2; ++xx) {
        var fViewMatrix = m4.translate(viewMatrix,
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
      var textMatrix = m4.translate(projectionMatrix,
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