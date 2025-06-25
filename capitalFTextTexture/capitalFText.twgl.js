{
"use strict";
let canvas = document.currentScript.parentElement;

function main() {
   var gl = canvas.getContext("webgl2");

   // tell twgl to match program to a_program and
   // normal to a_normal etc...
   twgl.setAttributePrefix("a_");

   let getShaderXPath = (glType, progname) => 
      {
         let baseXpath = `@type='text/glsl-shader' and @data-gl-type='${glType}'`;
         if (progname) baseXpath += ` and @data-gl-program='${progname}'`;
         return `./script[${baseXpath}]`;
      };
   let vertexShaderElement   = document.evaluate (getShaderXPath('vertex-shader'),   canvas).iterateNext();
   let fragmentShaderElement = document.evaluate (getShaderXPath('fragment-shader'), canvas).iterateNext();
   let fProgramInfo = twgl.createProgramInfo(gl, [vertexShaderElement.textContent.trim(), fragmentShaderElement.textContent.trim()]);

   vertexShaderElement   = document.evaluate (getShaderXPath('vertex-shader',   'texture'), canvas).iterateNext();
   fragmentShaderElement = document.evaluate (getShaderXPath('fragment-shader', 'texture'), canvas).iterateNext();
   let textProgramInfo = twgl.createProgramInfo(gl, [vertexShaderElement.textContent.trim(), fragmentShaderElement.textContent.trim()]);

   // Create data for 'F'
   var fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
   var fVAO = twgl.createVAOFromBufferInfo(gl, fProgramInfo, fBufferInfo);
 
   // Create a unit quad for the 'text'
   var textBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 1);
   var textVAO = twgl.createVAOFromBufferInfo(gl, textProgramInfo, textBufferInfo);

   // create text texture.
   var textCanvas = makeTextCanvas("Hello!", 100, 26);
   var textWidth  = textCanvas.width;
   var textHeight = textCanvas.height;
   var textTex = gl.createTexture();
   gl.bindTexture    (gl.TEXTURE_2D, textTex);
   gl.pixelStorei    (gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.pixelStorei    (gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
   gl.texImage2D     (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
   gl.generateMipmap (gl.TEXTURE_2D);
   gl.texParameteri  (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri  (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

   var fUniforms    = { u_matrix: m4.identity()};
   var textUniforms = { u_matrix: m4.identity(), u_texture: textTex };

   var translation        = [0, 30, 0];
   var rotation           = [rad(190), rad(0), rad(0)];
   var scale              = [1, 1, 1];
   var fieldOfViewRadians = rad(60);
   var rotationSpeed      = 1.2;


   requestAnimationFrame(drawScene);

   var then = 0;
   function drawScene(time) {
      // Convert to seconds
      var now = time * 0.001;
      var deltaTime = now - then;
      then = now;

      twgl.resizeCanvasToDisplaySize(gl.canvas);

      // Every frame increase the rotation a little.
      rotation[1] += rotationSpeed * deltaTime;

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      gl.depthMask(true);

      // Compute the matrix
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear  = 1;
      var zFar   = 2000;
      var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

      // Compute the camera's matrix using look at.
      var cameraRadius   = 360;
      var cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius];
      var target         = [0, 0, 0];
      var up             = [0, 1, 0];
      var cameraMatrix   = m4.lookAt(cameraPosition, target, up);
      var viewMatrix     = m4.inverse(cameraMatrix);

      var textPositions = [];

      gl.useProgram(fProgramInfo.program);
      gl.bindVertexArray(fVAO);
      var spread = 170;
      for (var yy = -1; yy <= 1; ++yy) {
         for (var xx = -2; xx <= 2; ++xx) {
            var fViewMatrix = m4.translate(viewMatrix, translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
            fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
            fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
            fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
            fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
            fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);

            // remember the position for the text
            textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);

            fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

            twgl.setUniforms(fProgramInfo, fUniforms);
            twgl.drawBufferInfo(gl, fBufferInfo);
         }
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);


      gl.useProgram(textProgramInfo.program);
      gl.bindVertexArray(textVAO);
      textPositions.forEach(function(pos) {
         // use just the view position of the 'F' for the text

         // because pos is in view space that means it's a vector from the eye to
         // some position. So translate along that vector back toward the eye some distance
         var fromEye               = m4.normalize(pos);
         var amountToMoveTowardEye = 150;  // because the F is 150 units long
         var viewX                 = pos[0] - fromEye[0] * amountToMoveTowardEye;
         var viewY                 = pos[1] - fromEye[1] * amountToMoveTowardEye;
         var viewZ                 = pos[2] - fromEye[2] * amountToMoveTowardEye;
         var desiredTextScale      = -1 / gl.canvas.height;  // 1x1 pixels
         var scale                 = viewZ * desiredTextScale;

         var textMatrix = m4.translate (projectionMatrix, viewX, viewY, viewZ);
         // scale the F to the size we need it.
         textMatrix = m4.scale (textMatrix, textWidth * scale, textHeight * scale, 1);


         m4.copy (textMatrix, textUniforms.u_matrix);
         twgl.setUniforms (textProgramInfo, textUniforms);

         // Draw the text.
         twgl.drawBufferInfo (gl, textBufferInfo);
      });

      requestAnimationFrame(drawScene);
   }
}

main();
}