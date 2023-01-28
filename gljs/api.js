"use strict";

//prepare
//<video width="320" height="240" autoplay loop muted>
//  <source src="movie.mp4" type="video/mp4">
//  <source src="movie.ogg" type="video/ogg">
//  Your browser does not support the video tag.
//  https://www.w3schools.com/tags/movie.mp4
//</video>

async function readImgHeightMap (src, crossOrigin)
{
   let imgData = await readImg (src, crossOrigin);
   let heightmap = [[]];

   for (let j = 0, j0 = 0; j < imgData.height; j++, j0 = j * imgData.width * 4)
   {
      heightmap[j] = [];
      for (let i = 0, i0 = 0; i < imgData.width; i++, i0 += 4)
         heightmap[j][i] = imgData.data[j0 + i0];
   }
   //console.log("read imgData: src=" + src + ": {" + imgData.width + ":" + imgData.height + "}");
   return new Promise( (resolve, reject) => {resolve({data:heightmap, height:imgData.height, width:imgData.width});});
}
async function readImg (src, crossOrigin)
{
   let canvas = await makeCanvasFromImg (src, crossOrigin);
   let ctx     = canvas.getContext("2d");
   let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height, { colorSpace: "srgb" });
   return new Promise( (resolve, reject) => {resolve(imgData);});
}
async function makeCanvasFromImg (src, crossOrigin)
{
   let image  = makeImg(src, crossOrigin);
   return new Promise((resolve, reject) =>
      {
          image.addEventListener('load',  () => { resolve(copyImgCanvas (image)); } );
          image.addEventListener('error', (event) => { console.log(event); reject (event); } );
          //image.onerror = (event) => { };
      });
}

// Puts text in center of canvas.
function makeTextCanvas(text, width, height)
{
   let canvas = document.createElement("canvas");
   let ctx    = canvas.getContext("2d");
   canvas.width  = width;
   canvas.height = height;
   ctx.font          = "20px monospace";
   ctx.textAlign     = "center";
   ctx.textBaseline  = "middle";
   ctx.fillStyle     = "black";
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx.fillText(text, width / 2, height / 2);
   return canvas;
}
function copyImgCanvas(imgref)
{
   let image  = decodeElement (imgref);
   let canvas = document.createElement("canvas");
   canvas.width  = image.width;
   canvas.height = image.height;
   canvas.getContext("2d").drawImage(image, 0, 0);
   return canvas;
}

function decodeElement(elm)
{
   if (elm instanceof Element) return elm;
   return  document.getElementById(elm);
}
function duplicateCanvas(srcc)
{
   let tgCanvas = document.createElement("canvas");
   let srcCanvas = decodeElement (srcc);
   tgCanvas.width  = srcCanvas.width;
   tgCanvas.height = srcCanvas.height;
   let imageData = srcCanvas.getContext("2d").getImageData (0, 0, srcCanvas.width, srcCanvas.height);
   tgCanvas.getContext("2d").putImageData(imageData, 0, 0);
   return tgCanvas;
}
function makeImg (src, crossOrigin)
{
   let image  = new Image ();
   let canvas = document.createElement("canvas");
   if (crossOrigin) image.crossOrigin  =  crossOrigin;
   image.src  =  src;
   return image;
}
function makeEmptyCanvas(width, height)
{
   let canvas = document.createElement("canvas");
   canvas.width  = width;
   canvas.height = height;
   return canvas;
}