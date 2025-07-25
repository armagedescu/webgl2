{
"use strict";
let canvas = document.currentScript.parentElement;

let clearColor = [0.5, 0.5, 0.5, 0.9];
let vertices  = new Float32Array ([ 0.5, -0.5,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0]);
////to be changed to
//let vertices  = [ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
let indices   = new Uint16Array ([0, 1, 2, 0, 2, 3]);

let func = async () =>
{
   let context = canvas.getContext('webgpu');

   const adapter = await navigator.gpu.requestAdapter();
   const device  = await adapter.requestDevice();
   context.configure
      ({
        device    :  device,
        format    :  navigator.gpu.getPreferredCanvasFormat(),
        alphaMode :  "premultiplied",
      });

   let selectSingleNode = (xpathStr, element, resolver) =>
      document.evaluate(xpathStr, element, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
   let selectSingleNodeText = (xpathStr, element, resolver) =>
      selectSingleNode (xpathStr, element, resolver).textContent;
   const shaderModule = device.createShaderModule({code: selectSingleNodeText("./script[@type='text/wgsl-shader']", canvas)});

   let vertexBuffer = device.createBuffer({
      size:  vertices.byteLength, // malloc size
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);
   let indexBuffer = device.createBuffer({
      size:  indices.byteLength, // malloc size
      usage: GPUBufferUsage.INDEX  | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer(indexBuffer, 0, indices);//, 0, indices.length);
   let vertexBuffers;
   vertexBuffers = [ // GPUVertexBufferLayout []
      {  //buffer1 attrbute 1
         arrayStride: 4 * 2,
         attributes: [
                  { shaderLocation: 0, offset:  0, format: 'float32x2', arrayStride: 4 * 2 }, // offset sizeof(float32) * 0
         ],
         stepMode: 'vertex'
      }
   ];
   const pipelineDescriptor = {
      vertex: {
         module: shaderModule,
         entryPoint: 'vertex_main',
         buffers: vertexBuffers
      },
      fragment: {
         module: shaderModule,
         entryPoint: 'fragment_main',
         targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
      },
      primitive: { topology: 'triangle-list' },
      layout: 'auto'
   };
   const renderPipeline = device.createRenderPipeline(pipelineDescriptor); // link shaders
   const commandEncoder = device.createCommandEncoder();
   const renderPassDescriptor = {
      colorAttachments: [{
         clearValue:  clearColor,
         loadOp:      'clear',
         storeOp:     'store',
         view:        context.getCurrentTexture().createView()
      }]
   };
   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
   // 9: Draw the triangle
   passEncoder.setPipeline     (renderPipeline);  // bind program?
   passEncoder.setVertexBuffer (0, vertexBuffer); // bind vao?
   passEncoder.setIndexBuffer  (indexBuffer, "uint16");
   //passEncoder.draw(vertices.length / 2);
   passEncoder.drawIndexed(indices.length);

   // End the render pass
   passEncoder.end();

   device.queue.submit([commandEncoder.finish()]);

   //let glCanvas = new GlCanvas('simpleDrawIndexed');
   //let gl = glCanvas.gl;
   //glCanvas.useProgram ();
//
   //gl.clearColor(0.5, 0.5, 0.5, 0.9);
   //gl.enable(gl.DEPTH_TEST);
   //gl.clear (gl.COLOR_BUFFER_BIT);
//
   //let vertices  = [ 0.5, -0.5,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
   //////to be changed to
   ////let vertices  = [ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
   //let indices   = [0, 1, 2, 0, 2, 3];
//
   //// Create a new buffer object
   //let vertex_buffer = gl.createBuffer();
   //gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
//
   //let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   //gl.vertexAttribPointer     (coord, 2, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
   //gl.enableVertexAttribArray (coord); //Enable the attribute
//
   //let idxBuffer = gl.createBuffer();
   //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
   //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
//
   //gl.drawElements (gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

};
document.addEventListener('DOMContentLoaded', func);
}