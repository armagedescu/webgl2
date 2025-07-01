class NewPromise extends Promise
{
   constructor(executor)
   {
      super((resolve, reject) =>  executor(resolve, reject));
	}
   then(onFulfilled, onRejected)
   {
		 console.log(this.constructor.name);
       return super.then(onFulfilled, onRejected);
   }
}

class NewPromiseThis extends Promise
{
   constructor(executor)
   {
      super((resolve, reject) =>  executor(resolve, reject));
	}
   then(onFulfilled, onRejected)
   {
		 sonsole.log( typeof this);
       return super.then(onFulfilled, onRejected);
   }
}
// Main function

async function newPromiseExperiment()
{
	let res = "foo";
   let x = new NewPromise ((resolve, reject) => 
   {
      setTimeout(() => 
      {
         resolve(res);
      }, 3000);
      console.log("salut")
   });
	//x.then(value => console.log('Valoarea este: ' + value));
	x.then(console.log);
	console.log("follows " + res);
}
function promisize () {
   const promise1 = Promise.resolve(123);
   const promise2 = Promise.resolve(234);
   class someclass {};
   let a = new someclass();
   if   (promise1 instanceof Promise)  console.log ("promise1 is promise");
   if (!(promise1 instanceof Promise)) console.log ("promise1 is not promise");
   if   (a instanceof Promise)  console.log ("a is promise");
   if (!(a instanceof Promise)) console.log ("a is not promise");
   if   (5 instanceof Promise)  console.log ("5 is promise");
   if (!(5 instanceof Promise)) console.log ("5 is not promise");
   let nomatter = promise1;
   Promise.resolve(nomatter).then(value => console.log("nomatter = " + value));
   nomatter = 5678;
   Promise.resolve(nomatter).then(value => console.log("nomatter = " + value));
   console.log ("start resolving");
   async function asyncPromiseMain()
   {
      let x = await Promise.resolve(promise2).then(value => value);
      console.log("x = " + x);
      x = await Promise.resolve(12345).then(value => value);
      console.log("x = " + x);
      x = await 3;
      console.log("x = " + x);
   }
   asyncPromiseMain();

   class MyPromise extends Promise {}

   const mypromise = MyPromise.resolve(123);

   if (mypromise instanceof MyPromise) console.log("mypromise is MyPromise");
   if (mypromise instanceof Promise)   console.log("mypromise is Promise");

   mypromise.then (value => console.log(value));

};

//Experiments with LIB functions
//lib/heightmap, lib/imageread
async function makeImageReadExperiments()
{
   readImg ("./lib/heightmap/butuceni.png");
   readImg ("./lib/heightmap/tipova.png");
   readImg ("./3rdparty/texture/f-texture.png");
   document.body.appendChild(document.createElement("br") );
   document.body.appendChild(duplicateCanvas(makeImgCanvas("imgBasic")));    //Show a duplicate of invisible image canvas
   document.body.appendChild(await makeCanvasFromImg ("./3rdparty/texture/f-texture.png"));
   //makeCanvasFromImg ("../3rdparty/texture/f-texture.png").then( (canvas) => { document.body.appendChild(canvas);});
   document.body.appendChild(document.createElement("br") );
   document.body.appendChild(makeTextCanvas ("./3rdparty/texture/f-texture.png", 100, 26) ); //Show text canvas "texture/f-texture.png"
   document.body.appendChild(document.createElement("br"));
   document.body.appendChild(duplicateCanvas(makeTextCanvas ("hello", 100, 26))); //Show a duplicate of invisible text canvas

   let img  = makeImg("./3rdparty/texture/f-texture.png");
   document.body.appendChild(document.createElement("br"));
   makeOffscreenFromImg ("./3rdparty/texture/f-texture.png").then ( (cnv) => {document.body.appendChild (duplicateCanvas (cnv));});
   makeCanvasFromImg ("./3rdparty/texture/f-texture.png").then ( (cnv) => {document.body.appendChild (cnv);});
}