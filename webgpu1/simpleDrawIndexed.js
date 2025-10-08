{
"use strict";
let canvas = document.currentScript.parentElement;

let clearColor = [0.5, 0.5, 0.5, 0.9];

function buildGeometry ()
{
   return { verts:   new Float32Array ([ 0.5, -0.5,    1.0, 1.0,   -1.0,  1.0,   -1.0, -1.0]),
            indices: new Uint16Array  ([0, 1, 2, 0, 2, 3])};
}
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

   let geometry = buildGeometry ();
   let vertexBuffer = device.createBuffer({
      size:  geometry.verts.byteLength, // malloc size
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer(vertexBuffer, 0, geometry.verts, 0, geometry.verts.length);
   let indexBuffer = device.createBuffer({
      size:  geometry.indices.byteLength, // malloc size
      usage: GPUBufferUsage.INDEX  | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer(indexBuffer, 0, geometry.indices);//, 0, indices.length);


   let vertexBuffersDesciptor = [ // GPUVertexBufferLayout []
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
         buffers: vertexBuffersDesciptor
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
   passEncoder.drawIndexed(geometry.indices.length);

   // End the render pass
   passEncoder.end();

   device.queue.submit([commandEncoder.finish()]);

};
document.addEventListener('DOMContentLoaded', func);
}