{
let canvas = document.currentScript.parentElement;


const clearColor = { r: 0.5, g: 0.5, b: 0.5, a: 0.9 };
let vertices = new Float32Array(
               [  0.0,  0.0,  0.0,      -1.0,  0.4,  2.0,    -0.5, -0.6,  2.0,
                  0.0,  0.0,  0.0,       0.4,  0.4,  2.0,    -0.4,  0.5, -0.0  ]);
let normals  = new Float32Array(
               [  1.0,  1.0,  -1.0,      1.0,  1.0,  -1.0,    1.0,  1.0,  -1.0,
                  1.0,  0.0,  -1.0,      1.0,  0.0,  -1.0,    1.0,  0.0,  -1.0  ]);



async function gpumain (gpuCanvas)
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext

   // 4: Create vertex buffer to contain vertex data
   //device.createBuffer = alloc buffer
   //device.writeBuffer  = write buffer
   //vertexBuffers       = buffer descriptor
   let vertexBuffer, normalBuffer;
   vertexBuffer = device.createBuffer({ //alloc
      label: "Vertex Buffer",
      size:  vertices.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
   });

   // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
   device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length); //write

   normalBuffer = device.createBuffer({
      label: "Normal Buffer",
      size:  normals.byteLength,      // make it big enough to store vertices in
       usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // COPY_DST is not needed if we map the buffer ?? by copilot
      //usage: GPUBufferUsage.VERTEX , //| GPUBufferUsage.COPY_DST // COPY_DST is not needed if we map the buffer ?? by copilot
      //mappedAtCreation: true         //required for getMappedRange, requires unmap after writing
   });
   //const dst =  new normals.constructor(normalBuffer.getMappedRange()); //Float32Array::constructor with range mapped to GPU //GPUBuffer::getMappedRange
   //dst.set(normals);     // Float32Array::TypedArray::set
   //normalBuffer.unmap();
   device.queue.writeBuffer(normalBuffer, 0, normals, 0, normals.length); //write

   // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
   let vertexBuffers = [
      {  //buffer1 attribute 1 GPUVertexBufferLayout
         label: "Vertex Position",
         arrayStride: 4 * 3,
         attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3'}], stepMode: 'vertex' //stepmode whtf is it
      },
      {  //buffer2 attribute 2 GPUVertexBufferLayout
         label: "Vertex Normal",
         arrayStride: 4 * 3,
         attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3'}], stepMode: 'vertex' 
      },
   ];

   const shaderModule = device.createShaderModule({code: gpuCanvas.shaders});
   const pipelineDescriptor = {
      label: "Render Pipeline Descriptor",
      vertex: {
         label: "Vertex Shader",
         module: shaderModule,
         entryPoint: 'vertex_main',
         buffers: vertexBuffers
      },
      fragment: {
         label: "Fragment Shader",
         module: shaderModule,
         entryPoint: 'fragment_main',
         targets: [{
            format: gpuCanvas.gpu.getPreferredCanvasFormat()
         }]
      },
      primitive: {  topology: 'triangle-list' },
      layout: 'auto'
   };

   // 6: Create the actual render pipeline
   const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
   // 7: Create GPUCommandEncoder to issue commands to the GPU
   // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.
   const commandEncoder = device.createCommandEncoder();

   // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass
   let currentTexture = webgpu.getCurrentTexture();
   const renderPassDescriptor = {
      colorAttachments: [{
         clearValue : clearColor,
         loadOp     : 'clear',
         storeOp    : 'store',
         view       : currentTexture.createView()
      }]
   };

   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
   //9: Draw the triangle(s)

   passEncoder.setPipeline(renderPipeline);
   passEncoder.setVertexBuffer(0, vertexBuffer);
   passEncoder.setVertexBuffer(1, normalBuffer);
   passEncoder.draw(6);

   // End the render pass
   passEncoder.end();

   // 10: End frame by passing array of command buffers to command queue for execution
   device.queue.submit([commandEncoder.finish()]);
	return 0;
}
async function gpustartup (event) {
   new GpuCanvas ({canvas:canvas, newAdapter: false}).ready().then (
      canvasObj =>{
         gpumain (canvasObj);
	   });
}
document.addEventListener('DOMContentLoaded', event => gpustartup (event));

}