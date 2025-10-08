{
let canvas = document.currentScript.parentElement;


const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

function buildGeometry ()
{
   return {
      verts: new Float32Array([
         //verts XYZW                    //colors RGBA
         0.2,    0.5,  -0.1,   1,       0, 0,  0, 1, //tip of triangle 1, goes closer to camera, z=-0.1 = outside z-near view
         -0.3,   -0.7,   0.7,   1,       0, 1,  0, 1,
         0.7,   -0.7,   0.7,   1,       1, 0,  1, 1,

         0.0,    0.6,   1.1,   1,       1, 0,  0, 1, //tip of triangle 2, goes farther to camera, z=1.1 = inside z-far view
         -0.5,   -0.6,   0.3,   1,       0, 1,  0, 1,
         0.5,   -0.6,   0.3,   1,       0, 0,  1, 1,

      ])};
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
   const vertexBuffer = device.createBuffer({ //alloc
      size:  geometry.verts.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
   });

   // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
   device.queue.writeBuffer(vertexBuffer, 0, geometry.verts, 0, geometry.verts.length); //write

   // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
   const vertexBuffersDesciptor = [{
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
      label: "Render Pipeline Descriptor",
      vertex: {
         module: shaderModule,
         entryPoint: 'vertex_main',
         buffers: vertexBuffersDesciptor
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
      layout: 'auto',
      depthStencil: {
         depthWriteEnabled: true,
         //depthCompare: 'less',      //Non Inverted the z axis depthStencilAttachment.depthClearValue = 1.0
         depthCompare: 'greater', //Inverted the z axis depthStencilAttachment.depthClearValue = 0.0
         format: 'depth24plus',
      },
   };

   // 6: Create the actual render pipeline
   const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

   // 7: Create GPUCommandEncoder to issue commands to the GPU
   // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.
   const commandEncoder = device.createCommandEncoder();

   // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass
   let currentTexture = webgpu.getCurrentTexture();
   let depthTexture = device.createTexture({
            size: [currentTexture.width, currentTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
   const renderPassDescriptor = {
      label: "Render Pass Descriptor",
      colorAttachments: [{
         label      : "Color Attachment",
         clearValue : clearColor,
         loadOp     : 'clear',
         storeOp    : 'store',
         view       : currentTexture.createView()
      }],
      depthStencilAttachment: { //this is deth stensil aware in renderPipeline:depthStencil
         label            : "Depth Attachment",
         view             : depthTexture.createView(),
         depthClearValue  : 0.0,
         depthLoadOp      : 'clear',
         depthStoreOp     : 'store',
      },
   };

   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
   //9: Draw the triangle(s)

   passEncoder.setPipeline(renderPipeline);
   passEncoder.setVertexBuffer(0, vertexBuffer);
   passEncoder.draw(geometry.verts.length / 8); //strided verts 4D + colors 4D

   // End the render pass
   passEncoder.end();

   // 10: End frame by passing array of command buffers to command queue for execution
   device.queue.submit([commandEncoder.finish()]);
	return 0;
}

async function gpustartup(event) {
   new GpuCanvas ({canvas:canvas, newAdapter: false}).ready().then (
      canvasObj =>{
         gpumain (canvasObj);
	   });
}

document.addEventListener('DOMContentLoaded', event => gpustartup (event));
}