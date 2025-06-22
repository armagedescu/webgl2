"use strict";

/*
  var image = new Image();
  mage.src = "./texture/f-texture.png";
  document.body.appendChild(image); //*/

function main() {
   // Get A WebGL context
   /** @type {HTMLCanvasElement} */
   let canvas   = document.getElementById("canvas");
   let glCanvas = new GlCanvas(canvas);
   let gl       = glCanvas.gl;

   let fvao = new GlVAObject (glCanvas);
   let tvao = new GlVAObject (glCanvas.getGlProgram("texture"));
   fvao.bindVertexArray();
   let coordBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
   let coordsLocation = gl.getAttribLocation (fvao.program, "a_position");
   //gl.vertexAttribPointer     (coordsLocation, 3, gl.INT, false, 0, 0);
   gl.vertexAttribPointer     (coordsLocation, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coordsLocation);

   let colorBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
   let colorLocation = gl.getAttribLocation (fvao.program, "a_color");
   gl.vertexAttribPointer     (colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
   gl.enableVertexAttribArray (colorLocation);

   let fMesh = getFMesh3 ();
   let fColors = getFColor3 ();
   gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, fMesh, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, fColors, gl.STATIC_DRAW);


   // create text texture.
   let textCanvas = makeTextCanvas("Hello!", 100, 26);
   document.body.appendChild(textCanvas);
   let textWidth  = textCanvas.width;
   let textHeight = textCanvas.height;

   //texture
   let textTex = gl.createTexture();
   gl.bindTexture    (gl.TEXTURE_2D, textTex);
   gl.pixelStorei    (gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.pixelStorei    (gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
   gl.texImage2D     (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
   gl.generateMipmap (gl.TEXTURE_2D);
   gl.texParameteri  (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri  (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


   let fUniforms    = { u_matrix: fvao.uniformMatrix4fv("u_matrix") };
   let textUniforms = { u_matrix: tvao.uniformMatrix4fv("u_matrix"), u_texture: textTex };


   let translation        = [0, 30, 0];
   let rotation           = [rad (190), rad (0), rad (0)];
   let scale              = [1, 1, 1];
   let fieldOfViewRadians = rad (60);
   let rotationSpeed      = 1.2;

 
   requestAnimationFrame(drawScene);
 
   let then = 0;
   function drawScene(time) {
      let now = time * 0.001;
      let deltaTime = now - then;
      then = now; 
      rotation[1] += rotationSpeed * deltaTime;


      twgl.resizeCanvasToDisplaySize(gl.canvas); 
      // Every frame increase the rotation a little.
      // Tell WebGL how to convert from clip space to pixels
      // Clear the canvas
      gl.viewport   (0, 0, gl.canvas.width, gl.canvas.height); 
      gl.clearColor (0, 0, 0, 0);
      gl.clear      (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
      gl.enable     (gl.DEPTH_TEST); // turn on depth testing
      gl.enable     (gl.CULL_FACE);  // tell webgl to cull faces
      gl.disable    (gl.BLEND);      //?????
      gl.depthMask  (true);          //?????

      // Compute the matrix
      let aspect           = gl.canvas.clientWidth / gl.canvas.clientHeight;
      let zNear            = 1;
      let zFar             = 2000;
      let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

      // Compute the camera's matrix using look at.
      let cameraRadius   = 360;
      let cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius];
      let target         = [0, 0, 0];
      let up             = [0, 1, 0];
      let cameraMatrix   = m4.lookAt  (cameraPosition, target, up);
      let viewMatrix     = m4.inverse (cameraMatrix);
  
      let textPositions = [];
  
      let spread = 170;
      //Draw five F in a 3x5 grid
      for (let yy = -1; yy <= 1; ++yy) {
         for (let xx = -2; xx <= 2; ++xx) {
            let fViewMatrix = m4.translate   (viewMatrix,
                                              translation[0] + xx * spread,
                                              translation[1] + yy * spread,
                                              translation[2]);
            fViewMatrix     = m4.xRotate     (fViewMatrix, rotation[0]);
            fViewMatrix     = m4.yRotate     (fViewMatrix, rotation[1]       +  yy * xx      * 0.2);
            fViewMatrix     = m4.zRotate     (fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
            fViewMatrix     = m4.scale       (fViewMatrix, scale[0], scale[1], scale[2]);
            fViewMatrix     = m4.translate   (fViewMatrix, -50, -75, 0);

            // remember the position for the text
            textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);

		      fvao.useProgram();
		      fvao.bindVertexArray();

            let fu_matrix = m4.multiply(projectionMatrix, fViewMatrix);

            const location = gl.getUniformLocation(fvao.program, "u_matrix");
            gl.uniformMatrix4fv(location, false, fu_matrix);

		      fvao.draw();
            gl.drawArrays(gl.TRIANGLES,  0, fMesh.length / 3);
         }
      }

      ////draw text on each 'F' on one edge
      if (1) {
         gl.enable(gl.BLEND);
         gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
         gl.depthMask(false);

         textPositions.forEach(function(pos) {
            // use just the view position of the 'F' for the text

            // because pos is in view space that means it's a vector from the eye to
            // some position. So translate along that vector back toward the eye some distance
            let fromEye = m4.normalize(pos);
            let amountToMoveTowardEye = 150;  // because the F is 150 units long
            let viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
            let viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
            let viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
      
            let textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
            // scale the F to the size we need it.
            textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

            // setup to draw the text.
            //gl.useProgram(textProgramInfo.program);
	         tvao.useProgram();

            //gl.bindVertexArray(textVAO);
	         tvao.bindVertexArray();

            let fu_matrix = [];//new Float32Array();//[];
            //m4.copy(textMatrix, textUniforms.u_matrix);
            m4.copy(textMatrix, fu_matrix);
	         //console.log(JSON.stringify(textUniforms.u_matrix));
            //twgl.setUniforms(textProgramInfo, textUniforms);
	         //gl.uniform4fv(textUniforms.u_matrix, textMatrix);
            const location = gl.getUniformLocation(tvao.program, "u_matrix");

            gl.uniformMatrix4fv(location, false, fu_matrix);
            //gl.uniform4fv(location, fu_matrix); 
            // Draw the text.
            //twgl.drawBufferInfo(gl, textBufferInfo);
	         tvao.draw();
         });
      }
      requestAnimationFrame(drawScene);
   }
}

document.addEventListener("DOMContentLoaded", main);
//main();



function getFMesh3() {
      return new Float32Array([
          // left column front
           0,   0,   0,
           0, 150,   0,
          30,   0,   0,
           0, 150,   0,
          30, 150,   0,
          30,   0,   0,

          // top rung front
          30,   0,   0,
          30,  30,   0,
         100,   0,   0,
          30,  30,   0,
         100,  30,   0,
         100,   0,   0,

         // middle rung front
          30,  60,   0,
          30,  90,   0,
          67,  60,   0,
          30,  90,   0,
          67,  90,   0,
          67,  60,   0,

         // left column back
           0,   0,  30,
          30,   0,  30,
           0, 150,  30,
           0, 150,  30,
          30,   0,  30,
          30, 150,  30,

         // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

         // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

         // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

         // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

         // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

         // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

         // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

         // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

         // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

         // bottom
           0,  150,   0,
           0,  150,  30,
          30,  150,  30,
           0,  150,   0,
          30,  150,  30,
          30,  150,   0,

         // left side
           0,   0,    0,
           0,   0,   30,
           0, 150,   30,
           0,   0,    0,
           0, 150,   30,
           0, 150,    0,
      ]);
}

// Fill the current ARRAY_BUFFER buffer with colors for the 'F'.
function getFColor3() {
   return new Uint8Array([
         // left column front
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,

         // top rung front
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,

         // middle rung front
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,
         200,  70, 120,

         // left column back
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,

         // top rung back
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,

         // middle rung back
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,
          80,  70, 200,

         // top
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,
          70, 200, 210,

         // top rung right
         200, 200,  70,
         200, 200,  70,
         200, 200,  70,
         200, 200,  70,
         200, 200,  70,
         200, 200,  70,

         // under top rung
         210, 100,  70,
         210, 100,  70,
         210, 100,  70,
         210, 100,  70,
         210, 100,  70,
         210, 100,  70,

         // between top rung and middle
         210, 160,  70,
         210, 160,  70,
         210, 160,  70,
         210, 160,  70,
         210, 160,  70,
         210, 160,  70,

         // top of middle rung
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,
          70, 180, 210,

         // right of middle rung
         100,  70, 210,
         100,  70, 210,
         100,  70, 210,
         100,  70, 210,
         100,  70, 210,
         100,  70, 210,

         // bottom of middle rung.
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,
          76, 210, 100,

         // right of bottom
         140, 210,  80,
         140, 210,  80,
         140, 210,  80,
         140, 210,  80,
         140, 210,  80,
         140, 210,  80,

         // bottom
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,
          90, 130, 110,

         // left side
         160, 160, 220,
         160, 160, 220,
         160, 160, 220,
         160, 160, 220,
         160, 160, 220,
         160, 160, 220,
      ]);
   }