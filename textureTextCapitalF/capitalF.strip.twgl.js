{
"use strict";
let canvas = document.currentScript.parentElement;

function main()
{
   let gl = canvas.getContext("webgl2");

   // tell twgl to match program to a_program and
   // normal to a_normal etc...
   twgl.setAttributePrefix("a_");
   //let resolver = () => "http://www.w3.org/XML/1998/namespace"; //sample of resolver
   let selectSingleNode = (xpathStr, element, resolver) =>
      document.evaluate(xpathStr, element, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
   let selectSingleNodeText = (xpathStr, element, resolver) =>
      selectSingleNode (xpathStr, element, resolver).textContent;

   // setup GLSL programs
   let fProgramInfo = twgl.createProgramInfo(gl, [ selectSingleNodeText ("./script[@data-gl-type='vertex-shader']",   canvas).trim(),
                                                   selectSingleNodeText ("./script[@data-gl-type='fragment-shader']", canvas).trim()]);
   /* //fProgramInfo
   {
      program          : {},
      uniformSetters   : {},
      attribSetters    : {},
      uniformBlockSpec :
      {
         blockSpecs:{},
         uniformData:
         [
            {
               name:"u_matrix",
               type:35676,
               size:1,
               blockNdx:-1,
               offset:-1
            }
         ]
      },
      transformFeedbackInfo:{}
   }
   //*/
   // Create data for 'F'
   let fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
   let fVAO        = twgl.createVAOFromBufferInfo(gl, fProgramInfo, fBufferInfo);

   let fUniforms          = {u_matrix: m4.identity()};
   let translation        = [0, 30, 0];
   let rotation           = [rad(190), rad(0), rad(0)];
   let scale              = [1, 1, 1];
   let fieldOfViewRadians = rad(60);
   let rotationSpeed      = 1.2;

   let then = 0;

   requestAnimationFrame(drawScene);

   function drawScene(time)
   {
      let now = time * 0.001;
      let deltaTime = now - then;
      then = now;

       twgl.resizeCanvasToDisplaySize(gl.canvas);

      // Every frame increase the rotation a little.
      rotation[1] += rotationSpeed * deltaTime;

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport   (0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor (0, 0, 0, 0);
      gl.clear      (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable     (gl.DEPTH_TEST);
      gl.enable     (gl.CULL_FACE);
      gl.disable    (gl.BLEND);
      gl.depthMask  (true);

      // Compute the matrix
      let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      let zNear  = 1;
      let zFar   = 2000;
      let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

      // Compute the camera's matrix using look at.
      let cameraRadius   = 360;
      let cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius];
      let target         = [0, 0, 0];
      let up             = [0, 1, 0];
      let cameraMatrix   = m4.lookAt  (cameraPosition, target, up);
      let viewMatrix     = m4.inverse (cameraMatrix);

      gl.useProgram(fProgramInfo.program);
      gl.bindVertexArray(fVAO);

      let spread = 170;
      for (let yy = -1; yy <= 1; ++yy) {
         for (let xx = -2; xx <= 2; ++xx) {
            let fViewMatrix = m4.translate(viewMatrix, translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
            fViewMatrix = m4.xRotate   (fViewMatrix, rotation[0]);
            fViewMatrix = m4.yRotate   (fViewMatrix, rotation[1] + yy * xx * 0.2);
            fViewMatrix = m4.zRotate   (fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
            fViewMatrix = m4.scale     (fViewMatrix, scale[0], scale[1], scale[2]);
            fViewMatrix = m4.translate (fViewMatrix, -50, -75, 0);

            fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);
            twgl.setUniforms    (fProgramInfo, fUniforms);
            twgl.drawBufferInfo (gl, fBufferInfo);
         }
      }

      requestAnimationFrame (drawScene);
  }
}

main();
}