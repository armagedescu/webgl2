"use strict";

class HeightMap extends GlVAObject
{
   #vertices = [];
   #norms    = [];
   #indices  = [];
   constructor (context, src, crossOrigin)
   {
      super (context);
      return new Promise ( (resolve, reject) =>
         {
            readImgHeightMap (src).then ((heightmap) =>
               {
                  this.heightmap = heightmap;
                  this.buildGeometry (heightmap);
                  this.init (heightmap);
				  resolve (this);
               });
         });
   }
   init(heightmap)
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#vertices));
      this.coord = this.vertex_buffer.attrib ("vert", 3, gl.FLOAT);

      this.normal_buffer = this.arrayBuffer(new Float32Array(this.#norms));
      this.noord = this.normal_buffer.attrib ("norm", 3, gl.FLOAT);

      //this.noord = this.normal_buffer.attrib ("norm", 3, gl.FLOAT);

      this.indb = this.indexBuffer(new Uint16Array(this.#indices));

      this.modelLocation       = gl.getUniformLocation (this.program, "model");
      this.viewLocation        = gl.getUniformLocation (this.program, "view");
      this.projectionLocation  = gl.getUniformLocation (this.program, "projection");
	  this.vertColorLocation   = 2; //vertexAttrib4f(index, v0, v1, v2, v3)
	  this.vertColorLocation   = gl.getAttribLocation (this.program, "vertColor");
	  //this.vertColorLocation   = gl.getVertexAttrib (this.program, "vertColor");
      //gl.enableVertexAttribArray (this.vertColorLocation);
      console.log("color location: " + this.vertColorLocation);
   }
   set model      (mtx)  {this.gl.uniformMatrix4fv (this.modelLocation,      false, mtx) ;}
   set view       (mtx)  {this.gl.uniformMatrix4fv (this.viewLocation,       false, mtx) ;}
   set projection (mtx)  {this.gl.uniformMatrix4fv (this.projectionLocation, false, mtx) ;}
   set color      (vec4) {this.gl.vertexAttrib4fv  (this.vertColorLocation, vec4);}
   //set color      (vec4) {this.gl.vertexAttrib4fv  (this.vertColorLocation,  false, vec4);}
   buildGeometry()
   {
      //let heightmap = this.heightmap;
      let heightmap =
	     {
            height:4,width:4,
			data:
			[
			   [1/2, 1/2, 1/2, 1/2],
			   [1/2, 1/2, 1/2, 1/2],
			   [1/2, 1/2, 1/2, 1/2],
			   [1/2, 1/2, 1/2, 1/2]
			   ///[]
			]
         };
      const bottom = -0.7, maxheight = 0.2;
      const rfi = 2.0 / heightmap.height, rfj = 2.0 / heightmap.width;
      let viter = 0;

      //unsigned int length, width;
      let length = heightmap.height - 1, width = heightmap.width - 1;
      for (let i = 0; i < length; i++)
      {
         for (let j = 0; j < width; j++)
         {
            let [x,  y,  z]  = [i,      heightmap.data[i]    [j],      j];
            let [x1, y1, z1] = [i,      heightmap.data[i]    [j + 1],  j + 1];
            let [x2, y2, z2] = [i + 1,  heightmap.data[i + 1][j + 1],  j + 1];

            [x,  y,  z]   = resizev ([ x,  y,  z], [rfi, maxheight, rfj]); [x,  y,  z]  = offsetv([x,  y,  z],  [-1., bottom, -1.]);
            [x1, y1, z1]  = resizev ([x1, y1, z1], [rfi, maxheight, rfj]); [x1, y1, z1] = offsetv([x1, y1, z1], [-1., bottom, -1.]);
            [x2, y2, z2]  = resizev ([x2, y2, z2], [rfi, maxheight, rfj]); [x2, y2, z2] = offsetv([x2, y2, z2], [-1., bottom, -1.]);
            //let nms = norm3nz( x1    - x,       y1    -   y,     z1    -   z,     x2      - x,     y2    -   y,     z2    -   z,    2);
            let nms   = [0, 1, 0]; //norm3nz(re1[0] - re0[0], re1[1] - re0[1], re1[2] - re0[2], re2[0] - re0[0], re2[1] - re0[1], re2[2] - re0[2], 2);
            [this.#vertices[viter], this.#vertices[viter + 1], this.#vertices[viter + 2]] = [x, y, z];
            [this.#norms   [viter], this.#norms   [viter + 1], this.#norms   [viter + 2]] = nms;

            viter += 3;
         }
      }
      let iiter = 0;   //index iterator
      for (let i = 0; i < length - 1; i++)
      {
         for (let j = 0; j < width - 1; j++)
         {
            //this.#indices[iiter + 0] =      i  * width + j;
            //this.#indices[iiter + 1] =      i  * width + (j + 1);
            //this.#indices[iiter + 2] = (i + 1) * width + (j + 1);
            [this.#indices[iiter + 0],    this.#indices[iiter + 1],       this.#indices[iiter + 2]] = 
                      [i  * width + j,        i  * width + (j + 1),      (i + 1) * width + (j + 1)]
            iiter += 3;
            //this.#indices[iiter + 0] =      i  * width  + j;
            //this.#indices[iiter + 1] = (i + 1) * width  + (j + 1);
            //this.#indices[iiter + 2] = (i + 1) * width  + j;
            [this.#indices[iiter + 0],      this.#indices[iiter + 1],     this.#indices[iiter + 2]] = 
                     [i  * width  + j,    (i + 1) * width  + (j + 1),         (i + 1) * width  + j]
            iiter += 3;
         }
      }
   }
   
   //void GoogleMapTerrainIndexed::drawInit(glm::mat4& model, glm::mat4& view, glm::mat4& projection, const glm::vec4& color)
   //{
   //    glUseProgram(*this);
   //    glUniformMatrix4fv(modelLocationId,      1, GL_FALSE, glm::value_ptr(model));
   //    glUniformMatrix4fv(viewLocationId,       1, GL_FALSE, glm::value_ptr(view));
   //    glUniformMatrix4fv(projectionLocationId, 1, GL_FALSE, glm::value_ptr(projection));
   //
   //    glVertexAttrib4fv(vertColorLocation, glm::value_ptr(color));
   //
   //}
   drawVao()
   {
      let gl = this.gl;
      gl.drawElements (gl.TRIANGLES, this.#indices, gl.UNSIGNED_SHORT, 0);
   }
}

class test
{
   constructor ()
   {
      return new Promise ( (resolve, reject) =>
      {
         //resolve(this);
         setTimeout (resolve, 5, this);
      });
   }
   doHello() {console.log("salut");}
   async perform()
   {
      let a = x => x * x;
      let t = await new test();
      t.doHello ();
      new test().then((a) => {console.log("tested");});
      console.log("testing");
   }
}

async function main()
{
   let p1 = [1,2,3], p2 = [5,6,8], p3 = [1,2,3];
   console.log("Deltav "        + JSON.stringify(p1) + ", " + JSON.stringify (p2) + " = " + JSON.stringify (deltav (p1, p2))  );
   console.log("Mulv      "     + JSON.stringify(p1) + ", " + JSON.stringify (p2) + " = " + JSON.stringify (mulv   (p1, p2))  );
   console.log("Dotv      "     + JSON.stringify(p1) + ", " + JSON.stringify (p2) + " = " + dotv (p1, p2)  );
   console.log("shrink "        + 3                  + ", " + JSON.stringify (p2) + " = " + shrink ( 3, ... p2)  );
   console.log("resize "        + 3                  + ", " + JSON.stringify (p2) + " = " + resize ( 3, ... p2)  );
   console.log("normv  "                                    + JSON.stringify (p2) + " = " + JSON.stringify (normv  (p2))  );
   console.log("normv  + hypot"                             + JSON.stringify (p2) + " = " + JSON.stringify (Math.hypot(... normv  (p2)) )  );
   let [x, y, z] = p2;
   console.log("Dotv      "     + JSON.stringify(p1) + ", [x, y, z]=" + JSON.stringify ([x, y, z]) + " = " + dotv (p1, [x, y, z])  );

   let vao = await new HeightMap ("HeightMapButuceni", "./heightmap/butuceni.png");

   let gl = vao.gl;
   console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
   vao.useProgram();


   let fieldOfViewRadians    = rad (60);
   let modelXRotationRadians = rad (0);
   let modelYRotationRadians = rad (0);


   requestAnimationFrame(drawScene);

   // Draw the scene.
   let then = 0;
   function drawScene(time)
   {
      let ttime = time;
      time *= 0.001;
      let deltaTime = time - then;
      then = time;

      vao.useProgram();

      gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);
      //gl.enable   (gl.CULL_FACE);
      gl.enable   (gl.DEPTH_TEST);
      gl.clear    (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Compute the projection matrix
      let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      let projectionMatrix = m4.perspective (fieldOfViewRadians, aspect, 1, 2000);
   
      let cameraPosition = [0, 0,   2];
      let up             = [0, 1,   0];
      let target         = [0, 0,   0];
   
      // Compute the camera's matrix using look at.
      let cameraMatrix = m4.lookAt(cameraPosition, target, up);
   
      // Make a view matrix from the camera matrix.
      let viewMatrix = m4.inverse(cameraMatrix);
   
      let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
      // Animate the rotation
      modelXRotationRadians +=  -0.4 * deltaTime;
      modelYRotationRadians +=  -0.7 * deltaTime;
      let matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
      matrix = m4.yRotate(matrix, modelYRotationRadians);


      let model       = m4.identity();
      let view        = m4.inverse(cameraMatrix);
      let projection  = projectionMatrix;
      vao.model      = model;
      vao.view       = view;
      vao.projection = projection;
      vao.color      = new Float32Array([1, 0, 0, 1]);
        //glm::mat4 model = glm::translate(glm::mat4(1.0), pos);
        //model = glm::rotate(model, lastFrame, glm::vec3(0.0f, 1.0f, 0.0f));
        //glm::mat4 view = camera.view();
        //glm::mat4 projection = glm::perspective(glm::radians(camera.zoom), (float)windowWidth / windowHeight, 0.1f, 100.0f);

        //gl.clear (0.f, 0.f, 1.f, 1.0f);
        //gl.clear(gl.GL_COLOR_BUFFER_BIT | gl.GL_DEPTH_BUFFER_BIT);
        //gl.enable(gl.GL_BLEND);
        //gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

      //set model      (mtx) {this.gl.uniformMatrix4fv(this.modelLocation,      false, mtx);}
      //set view       (mtx) {this.gl.uniformMatrix4fv(this.viewLocation,       false, mtx);}
      //set projection (mtx) {this.gl.uniformMatrix4fv(this.projectionLocation, false, mtx);}
      //fVaObject.u_matrix  = matrix;
      //fVaObject.u_texture = 0; //using texture
      //
      //fVaObject.draw();
      //vao.bindVertexArray();
      vao.draw();
   
      requestAnimationFrame(drawScene);
   }
}

main();
