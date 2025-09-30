{
"use strict";
let canvas = document.currentScript.parentElement;
document.addEventListener('DOMContentLoaded', async () =>
{
   let context = canvas.getContext('webgpu');
   const adapter = await navigator.gpu.requestAdapter();
   const device  = await adapter.requestDevice();
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
              clearValue : [0.9, 0.5, 0.5, 1], // Opaque something
              loadOp     : "clear",
              storeOp    : "store",
              view       : context.getCurrentTexture().createView(),
            }
         ]
      };
   /////////     start of encoding commands for a frame    ///////////
   //
   const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
   //any drawing commands here...
   passEncoder.end();
   //
   /////////     end of encoding commands for a frame    ///////////

   device.queue.submit([commandEncoder.finish()]);
});
}