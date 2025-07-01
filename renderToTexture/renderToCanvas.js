"use strict";
{
let canvas = document.currentScript.parentElement;
class HeightMap extends GlVAObject
{
   #vertices = [];
   #norms    = [];
   #indices  = [];
   #p = null;
   constructor (context, src, crossOrigin)
   {
      super (context);
      this.#p = readImgHeightMap  (src, crossOrigin);
   }
   async ready()
   {
      await this.#p.then ( (heightmap) =>
      {
         this.heightmap = heightmap;
         this.buildGeometry ();
         this.init ();
      });
      return this;
   }
   init()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#vertices));
      this.coord = this.vertex_buffer.attrib ("vert", 3, gl.FLOAT);

      this.normal_buffer = this.arrayBuffer(new Float32Array(this.#norms));
      this.noord = this.normal_buffer.attrib ("norm", 3, gl.FLOAT);

      this.indb = this.indexBuffer(new Uint32Array(this.#indices));

      this.modelLocation       = gl.getUniformLocation (this.program, "model");
      this.viewLocation        = gl.getUniformLocation (this.program, "view");
      this.projectionLocation  = gl.getUniformLocation (this.program, "projection");
      this.vertColorLocation   = 2;
   }
   set model      (mtx)  {this.gl.uniformMatrix4fv (this.modelLocation,      false,  mtx) ;}
   set view       (mtx)  {this.gl.uniformMatrix4fv (this.viewLocation,       false,  mtx) ;}
   set projection (mtx)  {this.gl.uniformMatrix4fv (this.projectionLocation, false,  mtx) ;}
   set color      (vec4) {this.gl.vertexAttrib4fv  (this.vertColorLocation,         vec4) ;}
   buildGeometry()
   {
      let heightmap = this.heightmap;

      const bottom = -0.7, maxheight = 0.2/heightmap.maxh; //0.2;

      const rfi = 2.0 / heightmap.height, rfj = 2.0 / heightmap.width;
      let viter = 0;

      //unsigned int length, width;
      let length = heightmap.height - 1, width = heightmap.width - 1;
      for (let j = 0; j < length; j++)  // z=j is height, from top (deep) to bottom (near)
      {
         for (let i = 0; i < width; i++) // x=i is width, from left to right
         {
            //j is the row, i is the position inside the row
            //   as it comes from bitmap
            let [x,  y,  z]  = [i,      heightmap.data[j]    [i]    ,      j];
            let [x1, y1, z1] = [i + 1,  heightmap.data[j]    [i + 1],      j];
            let [x2, y2, z2] = [i + 1,  heightmap.data[j + 1][i + 1],  j + 1];

            let nms = cross3p ( [x,  y,  z], [x2, y2, z2],  [x1, y1, z1]);
            nms = normv (nms);

            [x,  y,  z]   = resizev ([ x,  y,  z], [rfi, maxheight, rfj]); [x,  y,  z]  = offsetv([x,  y,  z],  [-1., bottom, -1.]);
            [this.#vertices[viter], this.#vertices[viter + 1], this.#vertices[viter + 2]] = [x, y, z];
            [this.#norms   [viter], this.#norms   [viter + 1], this.#norms   [viter + 2]] = nms;

            viter += 3;
         }
      }

      let iiter = 0;   //index iterator
      for (let j = 0; j < length - 1; j++)
      {
         for (let i = 0; i < width - 1; i++)
         {
            [this.#indices[iiter + 0],       this.#indices[iiter + 1],       this.#indices[iiter + 2]] = 
                     [j  * length + i,    (j + 1)  * length + (i + 1),            j  * length + i + 1]
            iiter += 3;
            [this.#indices[iiter + 0],       this.#indices[iiter + 1],       this.#indices[iiter + 2]] = 
                     [j  * length + i,          (j + 1)  * length + i,    (j + 1)  * length + (i + 1)]
            iiter += 3;
         }
      }
   }

   drawVao()
   {
      let gl = this.gl;
      this.color      = new Float32Array([1, 0, 0, 1]);
      gl.drawElements (gl.TRIANGLES, this.#indices.length, gl.UNSIGNED_INT, 0);
   }
}

function addUIListeners (elm, controller)
{
   elm.addEventListener ( "click",     (event) => {controller.timer.switchStop();});
   elm.addEventListener ( "mousemove", (event) =>
   {
      if (event.shiftKey)
          [controller.camera.ypos, controller.camera.xpos] = [event.movementY, event.movementX];
      if (event.ctrlKey)                                
          [controller.camera.ytg,  controller.camera.xtg]  = [event.movementY, event.movementX];
   } );
   elm.addEventListener ( "wheel", (event) =>
   {
       console.log("wheel: " + event.deltaX + ":" + event.deltaY + ":" + event.deltaZ + ":" + event.deltaMode);
       event.preventDefault();
       //if (event.ctrlKey)
       //   console.log("prevent whole window from resizing");
   } );
}


async function main()
{
   //new HeightMap ("HeightMapButuceni", "./lib/heightmap/craterArizona.png").ready().then ( (v) =>  { heightMapDraw (v);} );
   new HeightMap (canvas, "./lib/heightmap/craterArizona.png").ready().then ( (v) =>  { heightMapDraw (v);} );
   //new HeightMap ("HeightMapButuceni", "./lib/heightmap/butuceni.png").ready().then ( (v) =>  { heightMapDraw (v);} );
}

async function heightMapDraw (vao)
{
   let gl = vao.gl;
   let controller = new glcontroller ();

   //addUIListeners (gl.canvas, controller);

   console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

   let fieldOfViewRadians    = rad (60);


   requestAnimationFrame(drawScene);

   // Draw the scene.
   let then = 0;
   

   function drawScene(time)
   {
      let ttime = time;
      time *= 0.001;
      let deltaTime = time - then;
      then = time;
      if (controller.timer.stop)
         deltaTime = 0;

      vao.useProgram();
      gl.enable   (gl.CULL_FACE);
      gl.enable   (gl.DEPTH_TEST);

      gl.clearColor (0., 0., 1., 1.0);
      //gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);
      //gl.blendFunc(gl.GL_SRC_ALPHA, gl.GL_ONE_MINUS_SRC_ALPHA);
      gl.clear    (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if (true)
      {
         // Compute the projection matrix
         let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
         let projectionMatrix = m4.perspective (fieldOfViewRadians, aspect, 1, 2000);

         let viewProjectionMatrix = m4.multiply(projectionMatrix, controller.camera.matrix);

         // Animate the rotation
         controller.model.deltat = deltaTime;
         let projection  = projectionMatrix;

         projection = m4.identity();

         vao.model      = controller.model.matrix;
         vao.view       = controller.camera.matrix;
         vao.projection = projection;

         vao.draw();
      }
   
      requestAnimationFrame(drawScene);
   }
}

main();
}