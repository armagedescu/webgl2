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
   //TODO: review, +await
   return readImg (src, crossOrigin).then ((imgData) =>
   {
      return buildImgHeightMap (imgData);
   } );
}

async function readImgHeightMapOffscreen (src, crossOrigin)
{
   //TODO: review, +await
   return readImgOffscreen (src, crossOrigin).then ((imgData) =>
   {
      return buildImgHeightMap (imgData);
   } );
}

function buildImgHeightMap (imgData)
{
   let heightmap = [];
   let [minh, maxh] = [Number.MAX_VALUE, Number.MIN_VALUE];

   for (let j = 0, j0 = 0; j < imgData.height; j++, j0 += imgData.width * 4)
   {
      heightmap[j] = [];
      for (let i = 0, i0 = 0; i < imgData.width; i++, i0 += 4)
      {
         let num = imgData.data [j0 + i0];
         [minh, maxh] = [Math.min (num, minh), Math.max (num, maxh)];
         heightmap [j][i] = num;
      }
   }
   for (let j = 0; j < imgData.height; j++)
      for (let i = 0; i < imgData.width; i++)
         heightmap [j][i] -= minh;

   return {data:heightmap, height:imgData.height, width:imgData.width, maxh: maxh - minh};
}
async function readImg (src, crossOrigin)
{
   //TODO: review, await
   return makeCanvasFromImg (src, crossOrigin).then ((canvas) =>
   {
      let ctx     = canvas.getContext ("2d");
      let imgData = ctx.getImageData (0, 0, canvas.width, canvas.height, { colorSpace: "srgb" });
      return imgData;
   });
}

async function readImgOffscreen (src, crossOrigin)
{
   return makeOffscreenFromBlob (src, crossOrigin).then ((canvas) =>
   {
      let ctx     = canvas.getContext ("2d");
      let imgData = ctx.getImageData (0, 0, canvas.width, canvas.height, { colorSpace: "srgb" });
      return imgData;
   });
}

async function makeOffscreenFromImg (src, crossOrigin)
{
   return new Promise ((resolve, reject) =>
   {
      let img  = makeImg (src, crossOrigin);
      img.addEventListener ('load',  () =>
      {
         let cnv = new OffscreenCanvas (img.width, img.height);
         cnv.getContext ("2d").drawImage (img, 0, 0);
         resolve (cnv);
      });
      img.addEventListener ('error', (event) => { console.log (event); reject (event); } );
   });
}
async function makeOffscreenFromBlob (src, options)
{
    return fetch (src, options)                            //fetch javascript browser api
              .then( (res)  => { return res.blob (); } )              //as blob javascript browser api
              .then( (blob) => { return createImageBitmap (blob); } ) //createImageBitmap javascript browser api
              .then( (bmp)  =>
              {
                 const { width, height } = bmp;
                 const cnv = new OffscreenCanvas (width, height);
                 const ctx = cnv.getContext ("2d");
                 ctx.drawImage (bmp, 0, 0);
                 bmp.close();
                 return cnv;
              } );
}

async function makeOffscreenText (src, options)
{
    return fetch (src, options)
              .then( (res)  => { return res.text (); } )
              .then( (txt)  => { return txt;} ); // { console.log(txt); return txt;} );
}

async function makeCanvasFromImg (src, crossOrigin)
{
   let image  = makeImg (src, crossOrigin);
   return new Promise ((resolve, reject) =>
   {
      image.addEventListener ('load',  () => { resolve( makeImgCanvas (image)); } );
      image.addEventListener ('error', (event) => { console.log (event); reject (event); } );
   });
}

// Puts text in center of canvas.
function makeTextCanvas (text, width, height)
{
   let canvas = document.createElement ("canvas");
   let ctx    = canvas.getContext ("2d");
   canvas.width  = width;
   canvas.height = height;
   ctx.font          = "20px monospace";
   ctx.textAlign     = "center";
   ctx.textBaseline  = "middle";
   ctx.fillStyle     = "black";
   ctx.clearRect (0, 0, canvas.width, canvas.height);
   ctx.fillText (text, width / 2, height / 2);
   return canvas;
}
function makeImgCanvas (imgref)
{
   let image  = decodeElement (imgref);
   let canvas = document.createElement ("canvas");
   canvas.width  = image.width;
   canvas.height = image.height;
   canvas.getContext ("2d").drawImage (image, 0, 0);
   return canvas;
}

function decodeElement (elm)
{
   if (elm instanceof OffscreenCanvas) return elm;
   if (elm instanceof Element) return elm;
   return  document.getElementById (elm);
}
function duplicateCanvas (srcc)
{
   let tgCanvas = document.createElement ("canvas");
   let srcCanvas = decodeElement (srcc);
   tgCanvas.width  = srcCanvas.width;
   tgCanvas.height = srcCanvas.height;
   let imageData = srcCanvas.getContext ("2d").getImageData (0, 0, srcCanvas.width, srcCanvas.height);
   tgCanvas.getContext ("2d").putImageData (imageData, 0, 0);
   return tgCanvas;
}


function makeImg (src, crossOrigin)
{
   let image  = new Image ();
   if (crossOrigin) image.crossOrigin  =  crossOrigin;
   image.src  =  src;
   return image;
}

//TODO: change to allSettled architecture, as in loadVideo
async function loadImg (src, crossOrigin)
{
   let image  = makeImg (src, crossOrigin);
   return new Promise ((resolve, reject) =>
   {
      image.addEventListener('load',  (event) => { resolve (image); } );
      image.addEventListener('error', (event) => { console.log (event); reject (event); } );
   });
}


//Video API
function makeVideo (src, crossOrigin)
{
   let video  = document.createElement ("video");
   if (crossOrigin) video.crossOrigin  =  crossOrigin;
   if (src)         video.src          =  src;
   video.autoplay    = true;
   video.playsInline = true;
   video.muted       = true;
   video.loop        = true;
   return video;
}

//much prettier as above
async function loadVideo (src, crossOrigin)
{
   let video  = makeVideo (src, crossOrigin);
   video.play ();

	//TODO: not really needed
   await Promise.allSettled
      ([
         new Promise ( (resolve, reject) => {video.addEventListener ('playing',     (event) => {resolve (1);}, {once:true, capture: true} )}   ),
         new Promise ( (resolve, reject) => {video.addEventListener ('timeupdate',  (event) => {resolve (1);}, {once:true, capture: true} )}   )
      ]);
   return video;
}


async function loadCamera ()
{
   let video  = makeVideo ();

   navigator.mediaDevices
     //.getUserMedia(const constraints = {  audio: true,  video: { width: 1280, height: 720 },})
     .getUserMedia( {  video: { width: 1280, height: 720 },})
     .then((mediaStream) =>
     {
        video.srcObject = mediaStream;
        //video.onloadedmetadata = () => { video.play(); };
     })
     .catch((err) => {
       console.error(`${err.name}: ${err.message}`);
     });
   
   video.play();
	
	//TODO: not really needed
   await Promise.allSettled
      ([
         new Promise ( (resolve, reject) => {video.addEventListener ('playing',     (event) => {resolve (1);}, {once:true, capture: true} )}   ),
         new Promise ( (resolve, reject) => {video.addEventListener ('timeupdate',  (event) => {resolve (1);}, {once:true, capture: true} )}   )
      ]);
   return video;

}


function makeEmptyCanvas (width, height)
{
   let canvas = document.createElement ("canvas");
   canvas.width  = width;
   canvas.height = height;
   return canvas;
}