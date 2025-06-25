"use strict";

{
let canvas = document.currentScript.parentElement;

// TODO: this is a stub, yet unclear purpose of the function
//function addUIListeners (elm, controller)
//{
//   elm.addEventListener ( "click",     (event) => {controller.timer.switchStop();});
//   elm.addEventListener ( "mousemove", (event) =>
//   {
//      if (event.shiftKey)
//          [controller.camera.ypos, controller.camera.xpos] = [event.movementY, event.movementX];
//      if (event.ctrlKey)                                
//          [controller.camera.ytg,  controller.camera.xtg]  = [event.movementY, event.movementX];
//   } );
//   elm.addEventListener ( "wheel", (event) =>
//   {
//       console.log("wheel: " + event.deltaX + ":" + event.deltaY + ":" + event.deltaZ + ":" + event.deltaMode);
//       event.preventDefault();
//       //if (event.ctrlKey)
//       //   console.log("prevent whole window from resizing");
//   } );
//}


async function main()
{
   let objtext = await makeOffscreenText ("./3rdparty/3dobj/chair.obj");
   let  objfile = new OBJFile(objtext);
   let  obj = objfile.result;

   //TODO: 3D-Trebujeni.obj is not 3rdparty, it is 1stparty owned by author (IF)
   let trebujeniText = await makeOffscreenText ("./lib/3dobj/3D-Trebujeni.obj");
   let trebujeniFile = new OBJFile(trebujeniText);
   let trebujeniObj = trebujeniFile.result;
   return;
}


main();
}