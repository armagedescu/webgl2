{
let canvas = document.currentScript.parentElement;


const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };
const vertices = new Float32Array([
  0.0,  0.6, 0, 1, 1, 0, 0, 1,
 -0.5, -0.6, 0, 1, 0, 1, 0, 1,
  0.5, -0.6, 0, 1, 0, 0, 1, 1
]);

async function main (gpuCanvas)
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext


   // 4: Create vertex buffer to contain vertex data
   //device.createBuffer = alloc buffer
   //device.writeBuffer  = write buffer
   //vertexBuffers       = buffer descriptor
   const vertexBuffer = device.createBuffer({ //alloc
      size:  vertices.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
   });

   // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
   device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length); //write

   // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
   const vertexBuffers = [{
      attributes: [{
         shaderLocation: 0, // position
         offset: 0,
         format: 'float32x4'
      }, {
         shaderLocation: 1, // color
         offset: 16,
         format: 'float32x4'
      }],
      arrayStride: 32,
      stepMode: 'vertex'
   }];


   const shaderModule = device.createShaderModule({code: gpuCanvas.shaders});
   const pipelineDescriptor = {
      vertex: {
         module: shaderModule,
         entryPoint: 'vertex_main',
         buffers: vertexBuffers
      },
      fragment: {
         module: shaderModule,
         entryPoint: 'fragment_main',
         targets: [{
            format: gpuCanvas.gpu.getPreferredCanvasFormat()
         }]
      },
      primitive: {
         topology: 'triangle-list'
      },
      layout: 'auto'
   };

   // 6: Create the actual render pipeline
   const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
   // 7: Create GPUCommandEncoder to issue commands to the GPU
   // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.
   const commandEncoder = device.createCommandEncoder();

   // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass
   const renderPassDescriptor = {
      colorAttachments: [{
         clearValue : clearColor,
         loadOp     : 'clear',
         storeOp    : 'store',
         view       : webgpu.getCurrentTexture().createView()
      }]
   };

   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
   //9: Draw the triangle(s)

   passEncoder.setPipeline(renderPipeline);
   passEncoder.setVertexBuffer(0, vertexBuffer);
   passEncoder.draw(3);

   // End the render pass
   passEncoder.end();

   // 10: End frame by passing array of command buffers to command queue for execution
   device.queue.submit([commandEncoder.finish()]);
	return 0;
}
async function init(event) {
   new GpuCanvas ({canvas:canvas, newAdapter: false}).ready().then (
      canvasObj =>{
         main (canvasObj);
	   });
}

document.addEventListener('DOMContentLoaded', event => init (event));
}