{
let canvas = document.currentScript.parentElement;
let clearColor = [0.5, 0.5, 0.5, 0.9];

function buildGeometryStrip (nh, ns, dnh, dr)
{
   console.assert (ns % 4 == 0);
   let verts    = [0.8,  0.8,  1];
   let norms    = [  0,    0,  0];//[0.0, 0.0, 1.0];
   let realns = ns;
   let start  = ns / 2;
   let z = 0; //cone edge orientation to us, not the tip
   for (let i = start, [ix, iy, iz] = [3, 4, 5]; i <= realns + start; i++, ix += 3,iy += 3,iz += 3)
   {
      [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * i / ns),   dr * Math.sin(2 * Math.PI * i / ns),   z ];
      [norms [ix], norms [iy], norms [iz]] = [0, -1, 1]; //all normals point down forward, glowing effect
      ix += 3,iy += 3,iz += 3;
      [verts [ix], verts [iy], verts [iz]] = [0.8, 0.8, 1.0]; //back to the tip
      [norms [ix], norms [iy], norms [iz]] = [0, 0, 0];
   }
   let expectedLength = 3 + 3 * 2 * (realns + 1);
   console.assert (verts.length ==  expectedLength, `vets length ${verts.length} != ${expectedLength}`);
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology:  'triangle-strip', cullMode: 'back' } };
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology:  'triangle-strip', cullMode: 'front' } };
   return {verts: new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology:  'triangle-strip'} };
}

function buildGeometryTriangles (nh, ns, dnh, dr)
{
   console.assert (ns % 4 == 0);
   let verts    = [];//triangle list topology, each triangle has its own tip
   let norms    = [];
   let realns = ns;
   let start  = ns / 2;
   let z = 0; //cone edge orientation to us, not the tip
   for (let i = start, [ix, iy, iz] = [0, 1, 2]; i < realns + start; i++, ix += 3,iy += 3,iz += 3)
   {
      [verts [ix], verts [iy], verts [iz]] = [0.8,  0.8,  1.0];
      [norms [ix], norms [iy], norms [iz]] = [0.0,  0.0,  0.0]; //tip of the cone: null norm
      ix += 3,iy += 3,iz += 3;
      [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * i / ns),   dr * Math.sin(2 * Math.PI * i / ns),   z];
      [norms [ix], norms [iy], norms [iz]] = [0, -1, 1]; //all normals point down forward, glowing effect
      ix += 3,iy += 3,iz += 3;
      [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * (i+1) / ns),   dr * Math.sin(2 * Math.PI * (i+1) / ns),   z];
      [norms [ix], norms [iy], norms [iz]] = [0, -1, 1]; //all normals point down forward, glowing effect
   }
   console.assert (verts.length == 3 * 3 * realns);
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list', cullMode: 'back' } };
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list', cullMode: 'front' } };
   return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology:   'triangle-list'} };
}


async function gpumain (gpuCanvas)
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext

   // 4: Create vertex buffer to contain vertex data
   //device.createBuffer = alloc buffer
   //device.writeBuffer  = write buffer
   //vertexBuffers       = buffer descriptor
   let nh = 1, ns = 16, dnh = 0.2, dr = 0.6;
   //let geometry = buildGeometryStrip (nh, ns, dnh, dr);
   let geometry = buildGeometryTriangles (nh, ns, dnh, dr);
   let vertexBuffer, normalBuffer;
   vertexBuffer = device.createBuffer({ //alloc
      label: "Vertex Buffer",
      size:  geometry.verts.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
   });
   device.queue.writeBuffer(vertexBuffer, 0, geometry.verts, 0, geometry.verts.length); //write
   normalBuffer = device.createBuffer({
      label: "Normal Buffer",
      size:  geometry.norms.byteLength,      // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
   });
   device.queue.writeBuffer(normalBuffer, 0, geometry.norms, 0, geometry.norms.length); //write

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
      //primitive: {  topology: 'triangle-list' },
      primitive: geometry.gpu,
      layout: 'auto',
      depthStencil: {
         depthWriteEnabled: true,
         depthCompare: 'less',      //Non Inverted the z axis depthStencilAttachment.depthClearValue = 1.0
         //depthCompare: 'greater', //Inverted the z axis depthStencilAttachment.depthClearValue = 0.0
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
      colorAttachments: [{
         clearValue : clearColor,
         loadOp     : 'clear',
         storeOp    : 'store',
         view       : currentTexture.createView()
      }],
      depthStencilAttachment: { //this is deth stensil aware in renderPipeline:depthStencil
         label            : "Depth Attachment",
         view             : depthTexture.createView(),
         depthClearValue  : 1.0,
         //depthClearValue  : 0.0,
         depthLoadOp      : 'clear',
         depthStoreOp     : 'store',
      },
   };

   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
   //9: Draw the triangle(s)
   passEncoder.setPipeline(renderPipeline);
   passEncoder.setVertexBuffer(0, vertexBuffer);
   passEncoder.setVertexBuffer(1, normalBuffer);
   passEncoder.draw(geometry.verts.length / 3);

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