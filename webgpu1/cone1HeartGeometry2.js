{
let canvas = document.currentScript.parentElement;
let clearColor = [0.5, 0.5, 0.5, 0.9];
function buildConeHearth (nh, ns)
{
   if (ns & 1) ns++;

   let verts    = [];
   let norms    = [];

   let PI_2 = 2 * Math.PI;      //2 * Pi
   let FI_S = 2 * Math.PI / ns; //angular size of one sector
   let R_S  = 2 / ns;           //Radius = FI normalized (FI / PI)
   let D_H  = 1 / nh;


   for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < ns; i++,     ix += 9,iy += 9,iz += 9)
   {
      let ps, cr;
      if (i < ns/2)
      {
         let fi1 = i   * FI_S;
         let fi2 = fi1 + FI_S; //next fi
         
         let rc1 = i   * R_S; //<-- radius coeficient
         let rc2 = rc1 + R_S; //<-- next radius coeficient

         let r1 = rc1 / nh; //<-- radius
         let r2 = rc2 / nh; //<-- next radius

         ps = [[0.0,                  0.0,                  0.0], //<--0 points to us, z lefhanded
               [r1 * Math.cos(fi1),   r1 * Math.sin(fi1),   D_H],
               [r2 * Math.cos(fi2),   r2 * Math.sin(fi2),   D_H]];

         cr = [[0,   0,   0],
               [(Math.sin(fi1) + fi1 * Math.cos(fi1)),  -(Math.cos(fi1) - fi1 * Math.sin(fi1)),   -(1 + fi1)],
               [(Math.sin(fi2) + fi2 * Math.cos(fi2)),  -(Math.cos(fi2) - fi2 * Math.sin(fi2)),   -(1 + fi2)]];

      } else
      {
         let i2 = i - ns / 2;
         let fi1 = -i2   * FI_S;
         let fi2 =  fi1  - FI_S;
         
         let rc1 = i2  * R_S; //<-- radius coeficients
         let rc2 = rc1 + R_S; //<-- radius coeficients

         let r1 = rc1 / nh; //<-- radius
         let r2 = rc2 / nh; //<-- radius
         
         ps =     [[0.0,                  0.0,                  0.0], //<--0 points to us, z lefhanded
                   [r2 * Math.cos(fi2),   r2 * Math.sin(fi2),   D_H],
                   [r1 * Math.cos(fi1),   r1 * Math.sin(fi1),   D_H]];

         cr = [[ 0,  0,  0],
               [-(Math.sin(fi2) + fi2 * Math.cos(fi2)), (Math.cos(fi2) - fi2 * Math.sin(fi2)), -(1 + fi2)],
               [-(Math.sin(fi1) + fi1 * Math.cos(fi1)), (Math.cos(fi1) - fi1 * Math.sin(fi1)), -(1 + fi1)]];
      }
      [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
      [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
      [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[2];

      [norms[ix],     norms[iy],     norms[iz]]     = cr[0];
      [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[1];
      [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[2];
   }

   //1 triangle = 3 points * 3 coordinates
   for (let h = 1, ix = ns*9, iy = ns*9 + 1, iz = ns*9 + 2;    h < nh; h++)
   {
      let h1n = h/nh, h2n = (h+1)/nh; //<-- start and stop height
      for (let i = 0;    i < ns; i++,       ix += 9,iy += 9,iz += 9)
      {
         let ps, cr;
         if (i < ns / 2)
         {
            let fi1 = i   * FI_S;
            let fi2 = fi1 + FI_S;

            let rc1 = i   * R_S; //<-- radius coeficients
            let rc2 = rc1 + R_S; //<-- radius coeficients
            //if (rc1 > 1) rc1 = 2 - rc1; //<-- decreases when passes Pi
            //if (rc2 > 1) rc2 = 2 - rc2; //<-- decreases when passes Pi
            let r11 = rc1 * h1n; //<-- radius
            let r12 = rc2 * h1n; //<-- radius
            let r21 = rc1 * h2n; //<-- radius
            let r22 = rc2 * h2n; //<-- radius

            ps = [[r11 * Math.cos(fi1),  r11 * Math.sin(fi1),  -(0.0 - h1n)],  // <-- points [1] []    [1]   [4]
                  [r12 * Math.cos(fi2),  r12 * Math.sin(fi2),  -(0.0 - h1n)],  // <-- points [ ] []    [ ]   [6]
                  [r21 * Math.cos(fi1),  r21 * Math.sin(fi1),  -(0.0 - h2n)],  // <-- points [3] []    [2]   [ ]
                  [r22 * Math.cos(fi2),  r22 * Math.sin(fi2),  -(0.0 - h2n)]]; // <-- points [2] []    [3]   [5]

            cr = [[(Math.sin(fi1) + fi1 * Math.cos(fi1)),  -(Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                  [(Math.sin(fi2) + fi2 * Math.cos(fi2)),  -(Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)],
                  [(Math.sin(fi1) + fi1 * Math.cos(fi1)),  -(Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                  [(Math.sin(fi2) + fi2 * Math.cos(fi2)),  -(Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)]
                 ];
         } else
         {
            let i2 = i - ns / 2;
            let fi1 = -i2 * FI_S;
            let fi2 = fi1 - FI_S;

            let rc1 = i2  * R_S; //<-- radius coeficients
            let rc2 = rc1 + R_S; //<-- radius coeficients
            //if (rc1 > 1) rc1 = 2 - rc1; //<-- decreases when passes Pi
            //if (rc2 > 1) rc2 = 2 - rc2; //<-- decreases when passes Pi
            let r11 = rc1 * h1n; //<-- radius
            let r12 = rc2 * h1n; //<-- radius
            let r21 = rc1 * h2n; //<-- radius
            let r22 = rc2 * h2n; //<-- radius

            ps = [[r11 * Math.cos(fi1),  r11 * Math.sin(fi1),  -(0 - h1n)],  // <-- points [1]   [4]
                  [r12 * Math.cos(fi2),  r12 * Math.sin(fi2),  -(0 - h1n)],  // <-- points [ ]   [6]
                  [r21 * Math.cos(fi1),  r21 * Math.sin(fi1),  -(0 - h2n)],  // <-- points [2]   [ ]
                  [r22 * Math.cos(fi2),  r22 * Math.sin(fi2),  -(0 - h2n)]]; // <-- points [3]   [5]

            cr = [[-(Math.sin(fi1) + fi1 * Math.cos(fi1)),  (Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                  [-(Math.sin(fi2) + fi2 * Math.cos(fi2)),  (Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)],
                  [-(Math.sin(fi1) + fi1 * Math.cos(fi1)),  (Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                  [-(Math.sin(fi2) + fi2 * Math.cos(fi2)),  (Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)]
                 ];
         }

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[2];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr[0];
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[2];
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[3];

         ix += 9;iy += 9;iz += 9;

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr[0];
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[1];
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[3];

      }
   }
   return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list', cullMode: 'back' } };
   //return {verts:new Float32Array(verts), norms:new Float32Array(norms), gpu:{topology: 'triangle-list' } };
}


let gpumain = (gpuCanvas) =>
{
   let   device = gpuCanvas.device; //DPUDevice
   const webgpu = gpuCanvas.webgpu; //GPUCanvasContext

   //logShader (canvas);

   let nh = 2, ns = 40;
   let geometry = buildConeHearth (nh, ns);

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
         view:        currentTexture.createView()
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