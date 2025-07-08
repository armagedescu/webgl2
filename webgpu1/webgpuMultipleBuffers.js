{
let canvas = document.currentScript.parentElement;
canvas.addEventListener("wheel", (event) => { if (event.ctrlKey) event.preventDefault(); });

//const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };
const clearColor = [  0.0,  0.5,   1.0,  1.0 ];
const vertices = new Float32Array([
   //verts XYZW
    0.0,   0.6,  0,  1,
   -0.5,  -0.6,  0,  1,
    0.5,  -0.6,  0,  1
]);
const colors = new Float32Array([
    //colors RGBA
    1,  0,  0,  1,
    0,  1,  0,  1,
    0,  0,  1,  1
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
   output.color = color;
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
   if (!adapter) throw Error('Couldn\'t request WebGPU adapter.');

   let   device       = await adapter.requestDevice();
   const shaderModule = device.createShaderModule({code: shaders}); //compile shader code
   const context      = canvas.getContext('webgpu');

   context.configure
   ({
      device    :  device,
      format    :  navigator.gpu.getPreferredCanvasFormat(), //adapter as parameter can be
      alphaMode :  'premultiplied' //wtf?
   });

   // Create vertex and color buffer to contain data
   // Can be done at the end, before draw routine, before/after beginRenderPass
   let vertexBuffer, colorBuffer;
   vertexBuffer = device.createBuffer({
      size:  vertices.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
   });
   device.queue.writeBuffer (vertexBuffer, 0, vertices, 0, vertices.length);
   //// Alternatively we can allocate and write buffer like this
   colorBuffer = device.createBuffer({
      size:  colors.byteLength,      // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX , //| GPUBufferUsage.COPY_DST // COPY_DST is not needed if we map the buffer ?? by copilot
      mappedAtCreation: true         //required for getMappedRange, requires unmap after writing
   });
   const dst =  new colors.constructor(colorBuffer.getMappedRange()); //Float32Array::constructor with range mapped to GPU //GPUBuffer::getMappedRange
   dst.set(colors);     // Float32Array::TypedArray::set
   colorBuffer.unmap();

   // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
   //Some alternative that doesn't work as of now
   //Each vertexBuffer requires separate device.createBuffer//passEncoder.setVertexBuffer
   //We did only one createBuffer and pass only one vertexBuffer, so two vertexBuffer will not pass
   let vertexBuffers = [
      {  //buffer1 attribute 1 GPUVertexBufferLayout
         arrayStride: 4 * 4,
         attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4'}], stepMode: 'vertex' //stepmode whtf is it
      },
      {  //buffer2 attribute 2 GPUVertexBufferLayout
         arrayStride: 4 * 4,
         attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x4'}], stepMode: 'vertex' 
      },
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
      primitive: { topology: 'triangle-list' },
      layout: 'auto'
   };

   // 6: Create the actual render pipeline // 
   const renderPipeline = device.createRenderPipeline(pipelineDescriptor); // link shaders
    
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

   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

   passEncoder.setPipeline     (renderPipeline);      // bind program?
   passEncoder.setVertexBuffer (0, vertexBuffer); // bind vao?
   passEncoder.setVertexBuffer (1, colorBuffer); // bind vao?
   passEncoder.draw(3);

   // End the render pass
   passEncoder.end();

   // 10: End frame by passing array of command buffers to command queue for execution
   device.queue.submit([commandEncoder.finish()]);
}

init();

}