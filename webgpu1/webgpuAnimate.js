{
let canvas = document.currentScript.parentElement;
let clearColor = [0.5, 0.5, 0.5, 0.9];
let vertices   = new Float32Array ([ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,     //lower triangle
                                     0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ]); //upper triangle

let gpumain = async () =>
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
      label: "Vertex Buffer",
      size:  vertices.byteLength, // malloc size
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);
   let vertexBuffers = [ // GPUVertexBufferLayout []
      {  //buffer1 attrbute 1
         arrayStride: 4 * 3,
         attributes: [
                  { shaderLocation: 0, offset:  0, format: 'float32x3'}, // offset sizeof(float32) * 0
         ],
         stepMode: 'vertex'
      }
   ];
   //  Write range (bufferOffset: 0, size: 64) does not fit in [Buffer (unlabeled)] size (16).
   //  - While calling [Queue].WriteBuffer([Buffer (unlabeled)], (0 bytes), data, (64 bytes))
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

   //doesn't require the linked shader, can be done in the beginning:
   const vsUniformBuffer = device.createBuffer({
      size: 4 * 4, label: "MyUniforms",
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
   });
   let vsUniformValues      = new Float32Array (4 * 4);        // 1 vec4f
   const translation4f      = vsUniformValues.subarray(0, 16); //not actually required for this simple case
   //requires the linked shader:
   const bindGroup = device.createBindGroup ({
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [
         { binding: 0, resource: { buffer: vsUniformBuffer } }
      ],
   });


   let animateMain = (time) =>
   {
      let fi = time * 0.005;
      translation4f.set ([0.5 *  Math.cos(fi),  0.5 *  Math.sin(fi),  0.5 *  Math.sin(fi), 0.0])
      device.queue.writeBuffer(vsUniformBuffer, 0, translation4f, 0, 4);

      ////this works without translation4f
      //vsUniformValues.set ([0.5 *  Math.cos(fi),  0.5 *  Math.sin(fi),  0.5 *  Math.sin(fi), 0.0]);
      //device.queue.writeBuffer(vsUniformBuffer, 0, vsUniformValues, 0, 4);
 
      const renderPassDescriptor = {
         colorAttachments: [{
            clearValue:  clearColor,
            loadOp:      'clear',
            storeOp:     'store',
            view:        context.getCurrentTexture().createView()
         }]
      };
      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginRenderPass (renderPassDescriptor);

      passEncoder.setPipeline     (renderPipeline); 
      passEncoder.setBindGroup    (0, bindGroup);
      passEncoder.setVertexBuffer (0, vertexBuffer);
      passEncoder.draw (vertices.length / 3); // len / vertex size

      // End the render pass
      passEncoder.end ();
      device.queue.submit ([commandEncoder.finish()]);// return;

      window.requestAnimationFrame (animateMain);
   }
   window.requestAnimationFrame (animateMain);
};
document.addEventListener ('DOMContentLoaded', gpumain);
}