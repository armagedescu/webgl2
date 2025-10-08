{
let canvas = document.currentScript.parentElement;

const clearColor = [0.5, 0.5, 0.5, 0.9];

function buildGeometry ()
{
   return  {verts: new Float32Array(             
               [  //Vertices XYZ           //Colors RGBA
                   0.0,  0.0,  0.0,        0.0, 1.0, 0.0, 1.0, 
                  -1.0,  0.4,  0.0,        0.0, 1.0, 0.0, 1.0,      
                  -0.5, -0.6,  0.0,        0.0, 1.0, 0.0, 1.0,
                   0.0,  0.0,  0.0,        1.0, 0.0, 0.0, 1.0,
                   0.4,  0.4,  2.0,        1.0, 0.0, 0.0, 1.0,
                  -0.4,  0.5, -0.0,        1.0, 0.0, 0.0, 1.0  ])};
}

async function gpumain (gpuCanvas)
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext

   let geometry = buildGeometry ();
   // 4: Create vertex buffer to contain vertex data
   //device.createBuffer = alloc buffer
   //device.writeBuffer  = write buffer
   //vertexBuffers       = buffer descriptor
   let vertexColorBuffer = device.createBuffer({ //alloc
      label: "Vertex+Color Buffer",
      size:  geometry.verts.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
   });
   device.queue.writeBuffer(vertexColorBuffer, 0, geometry.verts, 0, geometry.verts.length); //write

   //// 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
   let vertexColorBuffersDescriptor  = [ // GPUVertexBufferLayout []
      {  //buffer1 attrbute 1,2
         arrayStride: 28, //32,
         attributes: [
                  { shaderLocation: 0, offset:  0, format: 'float32x3' }, // offset sizeof(float32) * 0
                  { shaderLocation: 1, offset: 12, format: 'float32x4' }  // offset sizeof(float32) * 4
         ],
         stepMode: 'vertex'
      }
   ];

   const shaderModule = device.createShaderModule({code: gpuCanvas.shaders});
   const pipelineDescriptor = {
      label: "Render Pipeline Descriptor",
      vertex: {
         label: "Vertex Shader",
         module: shaderModule,
         entryPoint: 'vertex_main',
         //buffers: vertexBuffers
         buffers: vertexColorBuffersDescriptor
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
   passEncoder.setVertexBuffer(0, vertexColorBuffer);
   passEncoder.draw(geometry.verts.length / 7); //strided verts 3D + colors 4D

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