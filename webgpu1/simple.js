{
let canvas = document.currentScript.parentElement;
document.addEventListener('DOMContentLoaded', async () =>
{
   if (!navigator.gpu)  throw Error("WebGPU not supported.");

   let context = canvas.getContext('webgpu');

   const adapter = await navigator.gpu.requestAdapter();
   if (!adapter) throw Error("Couldn't request WebGPU adapter.");
   const device = await adapter.requestDevice();
   context.configure
      ({
        device    :  device,
        format    :  navigator.gpu.getPreferredCanvasFormat(),
        alphaMode :  "premultiplied",
      });

   const commandEncoder = device.createCommandEncoder();

   const renderPassDescriptor =
      {
         colorAttachments:
         [
            {
              clearValue : [0.9, 0.5, 0.5, 1], // Opaque black
              loadOp     : "clear",
              storeOp    : "store",
              view       : context.getCurrentTexture().createView(),
            }
         ]
      };

   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
   passEncoder.end();
   
   //context.unconfigure ();
   device.queue.submit([commandEncoder.finish()]);
});
}