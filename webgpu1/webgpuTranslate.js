{
let canvas = document.currentScript.parentElement;
let clearColor = [0.5, 0.5, 0.5, 0.9];
let vertices = new Float32Array ([ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                                   0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ]);

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

   let vertexBuffer;
   vertexBuffer = device.createBuffer({
      size:  vertices.byteLength, // malloc size
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);
   let vertexBuffers;
   vertexBuffers = [ // GPUVertexBufferLayout []
      {  //buffer1 attrbute 1
         arrayStride: 4 * 3,
         attributes: [
                  { shaderLocation: 0, offset:  0, format: 'float32x3'}, // offset sizeof(float32) * 0
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
         targets: [{ format: navigator.gpu.getPreferredCanvasFormat () }]
      },
      primitive: { topology: 'triangle-list' },
      layout: 'auto'
   };
   const renderPipeline = device.createRenderPipeline (pipelineDescriptor); // link shaders
   const commandEncoder = device.createCommandEncoder ();

   const renderPassDescriptor = {
      colorAttachments: [{
         clearValue:  clearColor,
         loadOp:      'clear',
         storeOp:     'store',
         view:        context.getCurrentTexture().createView()
      }]
   };

   const passEncoder = commandEncoder.beginRenderPass (renderPassDescriptor);

   passEncoder.setPipeline     (renderPipeline); 
   passEncoder.setVertexBuffer (0, vertexBuffer);
   passEncoder.draw (vertices.length / 3); // len / vertex size

   // End the render pass
   passEncoder.end ();

   device.queue.submit ([commandEncoder.finish()]);


};
document.addEventListener ('DOMContentLoaded', func);
}