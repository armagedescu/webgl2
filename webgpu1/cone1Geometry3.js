{
let canvas = document.currentScript.parentElement;

let clearColor = [0.5, 0.5, 0.5, 0.9];

function buildCone (nh, ns, dr)
{

   let verts    = [];
   let norms    = [];
   let smooth = true;
   let sm  = smooth ? 1 : 0;
   let sm1 = smooth ? 2 : 0;

   for (let i = 0, [ix, iy, iz] = [0,  1,  2];    i < ns;      i++,  ix += 9,iy += 9,iz += 9)
   {
      let ps = [[0.0,                                            0.0,                                          -(0.0)], //<--points in direction of us
                [(dr/nh) * Math.cos(2 * Math.PI *      i / ns ), (dr/nh) * Math.sin(2 * Math.PI *     i / ns), -(0 - 1/nh)],
                [(dr/nh) * Math.cos(2 * Math.PI *  (i+1) / ns ), (dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -(0 - 1/nh)],
                [(dr/nh) * Math.cos(2 * Math.PI *  (i+2) / ns ), (dr/nh) * Math.sin(2 * Math.PI * (i+2) / ns), -(0 - 1/nh)]];
      let cr = [[0, 0, 0], cross3pl (ps[0], ps[1], ps[2]), cross3pl (ps[0], ps[2], ps[3])];
      [verts[ix],     verts[iy],     verts[iz]]     = ps[0]; //tip //3d point
      [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
      [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[2];

      [norms[ix],     norms[iy],     norms[iz]]     = cr[0]; //tip //3d point
      [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[sm];
      [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[sm1];
   }

   //1 triangle = 3 points * 3 coordinates
   for (let h = 1, [ix, iy, iz] = [ns * 9, ns * 9 + 1, ns*  9 + 2];        h < nh;     h++)
   {
      for (let i = 0;       i < ns;     i++,  ix += 9,iy += 9,iz += 9)
      {
         let ps = [[     (h*dr/nh) * Math.cos(2 * Math.PI *     i/ns),     (h*dr/nh) * Math.sin(2 * Math.PI *     i / ns), -(0.0 -     h*1/nh)],  //[0] 1  4
                   [     (h*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns),     (h*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -(0.0 -     h*1/nh)],  //[1]    6
                   [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI *     i/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI *     i / ns), -(0.0 - (h+1)*1/nh)],  //[2] 2
                   [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -(0.0 - (h+1)*1/nh)],  //[3] 3  5

                 //[     (h*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns),     (h*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -(0.0 -     h*1/nh)],  //[1]    6
                   [     (h*dr/nh) * Math.cos(2 * Math.PI * (i+2)/ns),     (h*dr/nh) * Math.sin(2 * Math.PI * (i+2) / ns), -(0.0 -     h*1/nh)],  //[4] for cross product
                 //[ ((h+1)*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -(0.0 - (h+1)*1/nh)],  //[3] 3  5
                   [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI * (i+2)/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI * (i+2) / ns), -(0.0 - (h+1)*1/nh)]]; //[5] for cross product

         let cr = [cross3pl (ps[0], ps[2], ps[3]), cross3pl (ps[2], ps[3], ps[0]), cross3pl (ps[5], ps[1], ps[3])];

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[2];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr[0];
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[sm];
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[sm1];

         ix += 9;iy += 9;iz += 9;
         cr = [cross3pl (ps[0], ps[3], ps[1]), cross3pl (ps[1], ps[5], ps[4]), cross3pl (ps[5], ps[4], ps[1])];

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[3];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[1];

         [norms[ix],     norms[iy],     norms[iz]]     = cr[0];
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[sm];
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[sm1];

      }
   }
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list', cullMode: 'back' }};
   return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list' }};
}

let gpumain = (gpuCanvas) =>
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext

   //logShader (canvas);

   let nh = 20, ns = 40, dr = 1.0;
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
      primitive: geometry.gpu,
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
async function gpustartup(event) {
   new GpuCanvas ({canvas:canvas, newAdapter: false}).ready().then (
      canvasObj =>{
         gpumain (canvasObj);
	   });
}
document.addEventListener('DOMContentLoaded', gpustartup);

}