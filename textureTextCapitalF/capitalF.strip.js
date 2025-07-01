{
"use strict";
let canvas = document.currentScript.parentElement;

function main() {
   let glCanvas = new GlCanvas(canvas);
   let gl       = glCanvas.gl;

   let capitalFVao = new GlVAObject (glCanvas);

   // Init capital F buffers
   capitalFVao.bindVertexArray();
   let   capitalFVerticesLocation = gl.getAttribLocation (capitalFVao.program, "a_position");
   let   capitalFColorLocation    = gl.getAttribLocation (capitalFVao.program, "a_color");
   const capitalFUMatrixlocation  = gl.getUniformLocation(capitalFVao.program, "u_matrix");

   let capitalFVerticesBuffer   = gl.createBuffer();
   gl.bindBuffer                 (gl.ARRAY_BUFFER, capitalFVerticesBuffer);
   gl.vertexAttribPointer        (capitalFVerticesLocation, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray    (capitalFVerticesLocation);

   let capitalFColorBuffer      = gl.createBuffer();
   gl.bindBuffer                 (gl.ARRAY_BUFFER, capitalFColorBuffer);
   gl.vertexAttribPointer        (capitalFColorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
   gl.enableVertexAttribArray    (capitalFColorLocation);

   // Init capital F buffers, feed them with data.
   let fMesh   = capitalFBuildVertices3 ();
   let fColors = capitalFBuildColors3   ();
   gl.bindBuffer (gl.ARRAY_BUFFER, capitalFVerticesBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, fMesh, gl.STATIC_DRAW);
   gl.bindBuffer (gl.ARRAY_BUFFER, capitalFColorBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, fColors, gl.STATIC_DRAW);

   let translation        =  [ 0, 30,  0];
   let scale              =  [ 1,  1,  1];
   let rotation           =  [rad (190), rad (0), rad (0)];
   let fieldOfViewRadians =  rad (60);
   let rotationSpeed      =  1.2;

   requestAnimationFrame(drawScene);
 
   let then = 0;
   function drawScene(time) {
      let now = time * 0.001;
      let deltaTime = now - then;
      then = now; 
      rotation[1] += rotationSpeed * deltaTime;


      twgl.resizeCanvasToDisplaySize(gl.canvas);  //TODO: remove
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
  
      let spread = 170;

      //Draw five F in a 3x5 grid
      capitalFVao.useProgram();
      capitalFVao.bindVertexArray();

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

            let fu_matrix = m4.multiply(projectionMatrix, fViewMatrix);

            gl.uniformMatrix4fv(capitalFUMatrixlocation, false, fu_matrix);

		      //capitalFVao.draw(); //TODO: to move code to GlVAObject
            gl.drawArrays(gl.TRIANGLES,  0, fMesh.length / 3);
         }
      }

      requestAnimationFrame(drawScene);
   }
}

document.addEventListener("DOMContentLoaded", main);
//main();



function capitalFBuildVertices3 () {
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
// Color format is RGB, each color is 3 bytes, 0-255 further normalized to 0.0-1.0
function capitalFBuildColors3 () {
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

}