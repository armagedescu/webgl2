"use strict";

/*
  var image = new Image();
  mage.src = "./texture/f-texture.png";
  document.body.appendChild(image); //*/

function main() {
   // Get A WebGL context
   /** @type {HTMLCanvasElement} */
   let canvas = document.getElementById("canvas");
   let glCanvas = new GlCanvas(canvas);
   let gl = glCanvas.gl;

   let fvao = new GlVAObject (glCanvas);
   let tvao = new GlVAObject (glCanvas.getGlProgram("texture"));

   // create text texture.
   let textCanvas = makeTextCanvas("Hello!", 100, 26);
   document.body.appendChild(textCanvas);
   let textWidth  = textCanvas.width;
   let textHeight = textCanvas.height;
   let textTex = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, textTex);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
   gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


   let fUniforms    = { u_matrix:  fvao.uniformMatrix4fv("u_matrix")};
   let textUniforms = { u_matrix:  tvao.uniformMatrix4fv("u_matrix"), u_texture: textTex};


   let translation        = [0, 30, 0];
   let rotation           = [rad(190), rad(0), rad(0)];
   let scale              = [1, 1, 1];
   let fieldOfViewRadians = rad(60);
   let rotationSpeed      = 1.2;

 
   requestAnimationFrame(drawScene);
 
   let then = 0;
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
      gl.enable(gl.DEPTH_TEST); // turn on depth testing
      gl.enable(gl.CULL_FACE);  // tell webgl to cull faces
      gl.disable(gl.BLEND);     //?????
      gl.depthMask(true);       //?????

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
                                           translation[0] + xx * spread,
                                           translation[1] + yy * spread,
                                           translation[2]);
            fViewMatrix = m4.xRotate   (fViewMatrix, rotation[0]);
            fViewMatrix = m4.yRotate   (fViewMatrix, rotation[1] + yy * xx * 0.2);
            fViewMatrix = m4.zRotate   (fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
            fViewMatrix = m4.scale     (fViewMatrix, scale[0], scale[1], scale[2]);
            fViewMatrix = m4.translate (fViewMatrix, -50, -75, 0);
    
            // remember the position for the text
            textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);
    
            // setup to draw the 'F'
            //gl.useProgram(fProgramInfo.program);
		        fvao.useProgram();
		        fvao.bindVertexArray();
    
            // setup the attributes and buffers for the F
            //gl.bindVertexArray(fVAO);
    
            let fu_matrix = m4.multiply(projectionMatrix, fViewMatrix);
    
            //twgl.setUniforms(fProgramInfo, fUniforms);
            gl.uniform4fv(fUniforms.u_matrix, fu_matrix);
    
            //twgl.drawBufferInfo(gl, fBufferInfo);
		      fvao.draw();
         }
      }

      if (0) {
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
   
         m4.copy(textMatrix, textUniforms.u_matrix);
	      //console.log(JSON.stringify(textUniforms.u_matrix));
         //twgl.setUniforms(textProgramInfo, textUniforms);
	      gl.uniform4fv(textUniforms.u_matrix, textMatrix);
   
         // Draw the text.
         //twgl.drawBufferInfo(gl, textBufferInfo);
	       tvao.draw();
      });
      }
      requestAnimationFrame(drawScene);
   }
}

main();
