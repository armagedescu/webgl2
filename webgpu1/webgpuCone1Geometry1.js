{
let canvas = document.currentScript.parentElement;
let clearColor = [0.5, 0.5, 0.5, 0.9];
function buildCone (nh, ns, dr)
{
   let verts    = [];
   let norms    = [];
   for (let i = 0, ix = 0,iy = 1,iz = 2; i < ns; i++, ix += 9,iy += 9,iz += 9)
   {
      [verts[ix],     verts[iy],     verts[iz]]     = [0.0, 0.0, 0.0] ;//<-- tip of the cone, points to us
      [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = [dr * Math.cos(2 * Math.PI * i / ns),       dr * Math.sin(2 * Math.PI * i / ns),      1.0] ;
      [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = [dr * Math.cos(2 * Math.PI * (i+1) / ns),   dr * Math.sin(2 * Math.PI * (i+1) / ns),  1.0] ;

      [norms[ix],     norms[iy],     norms[iz]]     = [0.0, 0.0, 0.0]; //<-- tip of the cone, null normal
      [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = [verts[ix + 3],   verts[iy + 3],  -0.7] ; //z points to us
      [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = [verts[ix + 6],   verts[iy + 6],  -0.7] ; //z points to us

   }
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list', cullMode: 'back' }};
   return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list' }};
}

let gpumain = (gpuCanvas) =>
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext

   //logShader (canvas);
   let nh = 4, ns = 20, dr = 1.0;
   let geometry = buildCone (nh, ns, dr);

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
      primitive:  geometry.gpu ,
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
         clearValue:  clearColor,
         loadOp:      'clear',
         storeOp:     'store',
         view:        webgpu.getCurrentTexture().createView()
      }]
   };
   const passEncoder = commandEncoder.beginRenderPass (renderPassDescriptor);

   passEncoder.setPipeline     (renderPipeline); 
   passEncoder.setVertexBuffer (0, vertexBuffer);
   passEncoder.setVertexBuffer (1, normalBuffer);
   passEncoder.draw (geometry.verts.length / 3); // len / vertex size

   // End the render pass
   passEncoder.end ();
   device.queue.submit ([commandEncoder.finish()]);

}
async function main(event) {
   new GpuCanvas ({canvas:canvas, newAdapter: false}).ready().then (
      canvasObj =>{
         gpumain (canvasObj);
	   });
}

document.addEventListener('DOMContentLoaded', main);

}