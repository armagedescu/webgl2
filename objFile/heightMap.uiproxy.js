"use strict";
{
let canvas = document.currentScript.parentElement;
async function webWorker ()
{
   //let canvas = document.getElementById  ("HeightMapButuceniOffscreen");
   let worker = new Worker("./objFile/heightMap.worker.js");
   let grabber = new GlInfoGrabber(canvas);
   worker.onmessage = (msg) => 
   {
      //console.log("received getInfo");
      switch (msg.data)
      {
      case "getInfo":
         //console.log("received getInfo");
         worker.postMessage(new GlInfoGrabber(canvas).glinfo);
         break;
      case "getCanvas":
         //console.log("received getCanvas");
         let offscreenCanvas = canvas.transferControlToOffscreen();
         worker.postMessage(offscreenCanvas, [offscreenCanvas]);
         break;
      case "getArizona":
         //console.log("received getCanvas");
         worker.postMessage(  {arizona: grabber.buildUrl ( "./lib/heightmap/craterArizona.png")}  );
         break;
      }
   };
   addWorkerUIListeners (canvas, worker);
}

function addWorkerUIListeners (elm, worker)
{
   elm.addEventListener ( "click",      (event) => {  worker.postMessage(  cloneMouseEvent(event) );}  );
   elm.addEventListener ( "mousemove",  (event) => {  worker.postMessage(  cloneMouseEvent(event) );}  );
   elm.addEventListener ( "wheel",      (event) =>
   {
      worker.postMessage(  cloneMouseEvent(event) );
      event.preventDefault();
      //if (event.ctrlKey)
      //   event.preventDefault();
   });
}

async function main()
{
   webWorker ();
}

main();
}