{
let canvas = document.currentScript.parentElement;
let clearColor = [0.5, 0.5, 0.5, 0.9];

function buildConeHearth (nh, ns, dr)
{
   if (ns & 1) ns++; //make sure ns is even

   let verts    = [];
   let norms    = [];

   for (let i = 0,   [ix, iy, iz] = [0,  1,  2];    i < ns; i++,     ix += 9,iy += 9,iz += 9)
   {
      dr      =  2 *  i      * (1/ns); // <-- increase from 0 to 2 (PI)
      let drd =  2 * (i + 1) * (1/ns); // <-- increase from 0 to 2 (PI)
      if (dr  > 1) dr  = 2 - dr;  //<-- decrease when greater than PI
      if (drd > 1) drd = 2 - drd; //<-- decrease when greater than PI
      let ps = [[0.0,                                             0.0,                                            0.0], //<--points in direction of us
                [(dr /nh) * Math.cos(2 * Math.PI *   i    / ns ), (dr /nh) * Math.sin(2 * Math.PI *  i    / ns),  1.0 /nh],
                [(drd/nh) * Math.cos(2 * Math.PI *  (i+1) / ns ), (drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns),  1.0 /nh],
                [(drd/nh) * Math.cos(2 * Math.PI *  (i+2) / ns ), (drd/nh) * Math.sin(2 * Math.PI * (i+2) / ns),  1.0 /nh]];
      let cr =  cross3pl (ps[0], ps[1], ps[2]);
      //let cr1 = cross3pl (ps[0], ps[2], ps[3]);

      [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
      [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
      [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[2];

      [norms[ix],     norms[iy],     norms[iz]]     = [0, 0, 0];
      [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr;
      [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr; //cr1
   }

   //1 triangle = 3 points * 3 coordinates
   for (let h = 1, [ix, iy, iz] = [ns * 9, ns * 9 + 1, ns * 9 + 2];    h < nh; h++)
   {
      for (let i = 0;    i < ns; i++,       ix += 9,iy += 9,iz += 9)
      {
         dr      =  2 *  i      * (1/ns);
         let drd =  2 * (i + 1) * (1/ns);
         if (dr  > 1) dr  = 2 - dr;  //<-- decrease when greater than PI
         if (drd > 1) drd = 2 - drd; //<-- decrease when greater than PI

                   //x                                                 y                                                      z
         let ps = [[( h   *dr /nh) * Math.cos(2 * Math.PI *  i   /ns), ( h   *dr /nh) * Math.sin(2 * Math.PI *  i    / ns),   h    * 1/nh],  // 1  4
                   [( h   *drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ( h   *drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns),   h    * 1/nh],  //    6
                   [((h+1)*dr /nh) * Math.cos(2 * Math.PI *  i   /ns), ((h+1)*dr /nh) * Math.sin(2 * Math.PI *  i    / ns),  (h+1) * 1/nh],  // 2
                   [((h+1)*drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns),  (h+1) * 1/nh]]; // 3  5

         let cr = cross3pl (ps[0], ps[2], ps[3]);

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[2];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr;
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr;
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr;

         ix += 9;iy += 9;iz += 9;
         cr = cross3pl (ps[0], ps[3], ps[1]);

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr;
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr;
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr;

      }
   }
   return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list', cullMode: 'back' }};
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list' }};
}

let gpumain = (gpuCanvas) =>
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext

   //logShader (canvas);

   let nh = 3, ns = 100, dr = 1.0;
   //let nh = 3, ns = 10, dr = 1.0;
   let geometry = buildConeHearth (nh, ns, dr);

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
async function main(event)
{
   new GpuCanvas ({canvas:canvas, newAdapter: false}).ready().then (
      canvasObj => {
         gpumain (canvasObj);
	   });
}
document.addEventListener('DOMContentLoaded', main);

}