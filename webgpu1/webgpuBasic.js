{
let canvas = document.currentScript.parentElement;
canvas.addEventListener("wheel", (event) => { if (event.ctrlKey) event.preventDefault(); });

//const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };
const clearColor = [  0.0,  0.5,   1.0,  1.0 ];
const vertices = new Float32Array([
   //verts XYZW             //colors RGBA
    0.0,   0.6,  0,  1,     1,  0,  0,  1,
   -0.5,  -0.6,  0,  1,     0,  1,  0,  1,
    0.5,  -0.6,  0,  1,     0,  0,  1,  1
]);
const shaders = `
struct VertexOut {
   @builtin(position) position : vec4f, //builtin = gl_Position in GLSL
   @location(0)       color    : vec4f
}

@vertex
fn vertex_main   (@location(0) position : vec4f,
                  @location(1) color    : vec4f) -> VertexOut
{
   var output : VertexOut;
   output.position = position;
   output.color    = color;
   return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
   return fragData.color;
}
`;

async function init() {

   if (!navigator.gpu) throw Error('WebGPU not supported.');

   const adapter = await navigator.gpu.requestAdapter();
   if (!adapter) throw Error("Couldn't request WebGPU adapter.");
   let   device       = await adapter.requestDevice();
   const context      = canvas.getContext('webgpu');

   const shaderModule = device.createShaderModule({code: shaders}); //compile shader code
   context.configure
   ({
      device    :  device,
      format    :  navigator.gpu.getPreferredCanvasFormat(), //adapter as parameter can be
      alphaMode :  'premultiplied' //wtf?
   });

   //// 4: Create vertex buffer to contain vertex data
   let vertexBuffer;
   vertexBuffer = device.createBuffer({
      size:  vertices.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

   // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
   let vertexBuffers;
   vertexBuffers = [ // GPUVertexBufferLayout []
      {  //buffer1 attrbute 1,2
         arrayStride: 32,
         attributes: [
                  { shaderLocation: 0, offset:  0, format: 'float32x4' }, // offset sizeof(float32) * 0
                  { shaderLocation: 1, offset: 16, format: 'float32x4' }  // offset sizeof(float32) * 4
         ],
         stepMode: 'vertex'
      }
   ];

   const pipelineDescriptor = {
      vertex: {
         module: shaderModule,
         entryPoint: 'vertex_main',
         buffers: vertexBuffers
      },
      fragment: {
         module: shaderModule,
         entryPoint: 'fragment_main',
         targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
      },
      primitive: { topology: 'triangle-list' }, //~glDrawArrays with TRIANGLES
      layout: 'auto'
   };

   // 6: Create the actual render pipeline // 
   const renderPipeline = device.createRenderPipeline(pipelineDescriptor); // ~link shaders

   // 7: Create GPUCommandEncoder to issue commands to the GPU
   // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.
   const commandEncoder = device.createCommandEncoder();

   // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass

   const renderPassDescriptor = {
      colorAttachments: [{
         clearValue:  clearColor,
         loadOp:      'clear',
         storeOp:     'store',
         view:        context.getCurrentTexture().createView()
      }]
   };

   /////////     start of encoding commands for a frame    ///////////
   //
   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
   // 9: Draw the triangle
   passEncoder.setPipeline     (renderPipeline);  // bind program?
   passEncoder.setVertexBuffer (0, vertexBuffer); // bind vao?
   passEncoder.draw(3);

   // End the render pass
   passEncoder.end();
   //
   /////////     end of encoding commands for a frame    ///////////

   // 10: End frame by passing array of command buffers to command queue for execution
   device.queue.submit([commandEncoder.finish()]);
}

init();

}