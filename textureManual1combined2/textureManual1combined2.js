"use strict";

class Maual2TexVaObject extends GlVAObject
{
   #vertices  = new Float32Array( //this is 3D
              [
                 -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5, -0.5, -0.5,     -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
                 -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,     -0.5,  0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
                 -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,     -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
                 -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,     -0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
                 -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5, -0.5,     -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
                  0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5,  0.5,      0.5, -0.5,  0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5
              ]);
   #texCoords = new Float32Array( //this is 2D
              [
                 0, 0,   0, 1,   1, 0,      0, 1,   1, 1,   1, 0,
                 0, 0,   0, 1,   1, 0,      1, 0,   0, 1,   1, 1,
                 0, 0,   0, 1,   1, 0,      0, 1,   1, 1,   1, 0,
                 0, 0,   0, 1,   1, 0,      1, 0,   0, 1,   1, 1,
                 0, 0,   0, 1,   1, 0,      0, 1,   1, 1,   1, 0,
                 0, 0,   0, 1,   1, 0,      1, 0,   0, 1,   1, 1,
              ]);
   constructor (context, shaders)
   {
      super (context, shaders);
      this.init ();
   }

   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#vertices));
      this.coord = this.vertex_buffer.attrib ("a_position",  3, gl.FLOAT);

      this.tex_buffer  = this.arrayBuffer(new Float32Array(this.#texCoords));
      this.tex_coord = this.tex_buffer.attrib  ("a_texcoord", 2, gl.FLOAT);

      this.matrixLocation   = gl.getUniformLocation (this.program, "u_matrix");
      this.textureLocation  = gl.getUniformLocation (this.program, "u_texture");
   }
   set u_matrix  (mtx) {this.gl.uniformMatrix4fv(this.matrixLocation, false, mtx);}
   set u_texture (t)   {this.gl.uniform1i(this.textureLocation, t);}
   drawVao ()
   {
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
   }
}

class GlDataBWTexture2D
{
   constructor (gl, data)
   {
      this.gl = gl;
      this.data = data;
      this.texture = gl.createTexture ();
      this.type = gl.TEXTURE_2D;
      this.bindTexture ();
      this.init ();
   }
   init ()
   {
      let gl = this.gl;
      const alignment = 1;
      gl.pixelStorei (gl.UNPACK_ALIGNMENT, alignment);

      // set the filtering so we don't need mips and it's not filtered
      gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(this.type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(this.type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.texImage2D ();
   }
   texImage2D ()
   {
      let gl = this.gl;
      const level = 0;
      const internalFormat = gl.LUMINANCE;
      const width = 3;
      const height = 2;
      const border = 0;
      const format = gl.LUMINANCE;
      const type = gl.UNSIGNED_BYTE;
      
      this.bindTexture (); //gl.TEXTURE_2D, texture);
      gl.texImage2D  (this.type, level, internalFormat, width, height, border, format, type, this.data);
   }
   bindTexture()
   {
      this.gl.bindTexture(this.type, this.texture);
   }
}

class FVaObject extends GlVAObject
{
   #vertices  = null;
   #texCoords = new Float32Array([ //this is 2D
           0, 0,  0, 1,  1, 0,    0, 1,  1, 1,  1, 0, // left column front
           0, 0,  0, 1,  1, 0,    0, 1,  1, 1,  1, 0, // top rung front
           0, 0,  0, 1,  1, 0,    0, 1,  1, 1,  1, 0, // middle rung front
           0, 0,  1, 0,  0, 1,    0, 1,  1, 0,  1, 1, // left column back
           0, 0,  1, 0,  0, 1,    0, 1,  1, 0,  1, 1, // top rung back
           0, 0,  1, 0,  0, 1,    0, 1,  1, 0,  1, 1, // middle rung back
           0, 0,  1, 0,  1, 1,    0, 0,  1, 1,  0, 1, // top
           0, 0,  1, 0,  1, 1,    0, 0,  1, 1,  0, 1, // top rung right
           0, 0,  0, 1,  1, 1,    0, 0,  1, 1,  1, 0, // under top rung
           0, 0,  1, 1,  0, 1,    0, 0,  1, 0,  1, 1, // between top rung and middle
           0, 0,  1, 1,  0, 1,    0, 0,  1, 0,  1, 1, // top of middle rung
           0, 0,  1, 1,  0, 1,    0, 0,  1, 0,  1, 1, // right of middle rung
           0, 0,  0, 1,  1, 1,    0, 0,  1, 1,  1, 0, // bottom of middle rung.        
           0, 0,  1, 1,  0, 1,    0, 0,  1, 0,  1, 1, // right of bottom
           0, 0,  0, 1,  1, 1,    0, 0,  1, 1,  1, 0, // bottom
           0, 0,  0, 1,  1, 1,    0, 0,  1, 1,  1, 0  // left side
         ]);
   #positions = [ //this is 3D
         //0    1   2      3    4   5      6    7   8        9   10  11     12   13  14     15   16  17
           0,   0,  0,     0, 150,  0,    30,   0,  0,       0, 150,  0,    30, 150,  0,    30,   0,  0, //  0 left column front
          30,   0,  0,    30,  30,  0,   100,   0,  0,      30,  30,  0,   100,  30,  0,   100,   0,  0, //  1 top rung front
          30,  60,  0,    30,  90,  0,    67,  60,  0,      30,  90,  0,    67,  90,  0,    67,  60,  0, //  2 middle rung front
           0,   0, 30,    30,   0, 30,     0, 150, 30,       0, 150, 30,    30,   0, 30,    30, 150, 30, //  3 left column back
          30,   0, 30,   100,   0, 30,    30,  30, 30,      30,  30, 30,   100,   0, 30,   100,  30, 30, //  4 top rung back
          30,  60, 30,    67,  60, 30,    30,  90, 30,      30,  90, 30,    67,  60, 30,    67,  90, 30, //  5 middle rung back
           0,   0,  0,   100,   0,  0,   100,   0, 30,       0,   0,  0,   100,   0, 30,     0,   0, 30, //  6 top
         100,   0,  0,   100,  30,  0,   100,  30, 30,     100,   0,  0,   100,  30, 30,   100,   0, 30, //  7 top rung right
          30,  30,  0,    30,  30, 30,   100,  30, 30,      30,  30,  0,   100,  30, 30,   100,  30,  0, //  8 under top rung
          30,  30,  0,    30,  60, 30,    30,  30, 30,      30,  30,  0,    30,  60,  0,    30,  60, 30, //  9 between top rung and middle
          30,  60,  0,    67,  60, 30,    30,  60, 30,      30,  60,  0,    67,  60,  0,    67,  60, 30, // 10 top of middle rung
          67,  60,  0,    67,  90, 30,    67,  60, 30,      67,  60,  0,    67,  90,  0,    67,  90, 30, // 11 right of middle rung
          30,  90,  0,    30,  90, 30,    67,  90, 30,      30,  90,  0,    67,  90, 30,    67,  90,  0, // 12 bottom of middle rung.
          30,  90,  0,    30, 150, 30,    30,  90, 30,      30,  90,  0,    30, 150,  0,    30, 150, 30, // 13 right of bottom              
           0, 150,  0,     0, 150, 30,    30, 150, 30,       0, 150,  0,    30, 150, 30,    30, 150,  0, // 14 bottom
           0,   0,  0,     0,   0, 30,     0, 150, 30,       0,   0,  0,     0, 150, 30,     0, 150,  0  // 15 left side
         ];
   constructor (context, shaders)
   {
      super (context, shaders);
      this.initGeometry ();
      this.init ();
   }

   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#vertices));
      this.coord = this.vertex_buffer.attrib ("a_position",  3, gl.FLOAT);

      this.tex_buffer  = this.arrayBuffer(new Float32Array(this.#texCoords));
      this.tex_coord = this.tex_buffer.attrib  ("a_texcoord", 2, gl.FLOAT);


      this.matrixLocation   = gl.getUniformLocation (this.program, "u_matrix");
      this.textureLocation  = gl.getUniformLocation (this.program, "u_texture");
   }
   set u_matrix  (mtx) {this.gl.uniformMatrix4fv(this.matrixLocation, false, mtx);}
   set u_texture (t)   {this.gl.uniform1i(this.textureLocation, t);}
   drawVao () { this.gl.drawArrays(this.gl.TRIANGLES, 0, 16 * 6); }
   initGeometry ()
   {
      let matrix = m4.identity();// m4.xRotation(Math.PI);
      matrix = m4.translate(m4.identity(), -50, -75, -15);
      //matrix = m4.translate(m4.identity(), -50 / 20, -75 / 20, -15 / 20);

      this.#vertices = new Float32Array (this.#positions.length);
      for (let ii = 0; ii < this.#positions.length; ii += 3) {
        let vector = m4.transformVector(matrix, [this.#positions[ii + 0], this.#positions[ii + 1], this.#positions[ii + 2], 1]);
        vector[0] /= 125;
        vector[1] /= 125;
        vector[2] /= 125;
        this.#vertices[ii + 0] = vector[0];
        this.#vertices[ii + 1] = vector[1];
        this.#vertices[ii + 2] = vector[2];
      }
   }
}

class GlImageTexture2D
{
   constructor(gl, data)
   {
      this.gl = gl;
      this.data = data;
      this.texture = gl.createTexture ();
      this.type = gl.TEXTURE_2D;
      this.bindTexture ();
      this.init ();
   }
   init ()
   {
      this.image = makeImg (this.data);
      this.bindTexture ();
      this.image.addEventListener('load', () =>
         {
            this.bindTexture ();
            this.texImage2D();
            this.gl.generateMipmap (this.type);
         });
   }
   texImage2D()
   {
      let gl = this.gl;
      gl.texImage2D     (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
   }
   bindTexture(){this.gl.bindTexture(this.type, this.texture);}
}

function main()
{
   let vaObject = new Maual2TexVaObject ("CubeBWTextureMap"); //, ["vertex-shader-3d", "fragment-shader-3d"]);
   let gl = vaObject.gl;

   let program = vaObject.program;
   vaObject.useProgram();

   // Create a texture.
   let texture = new GlDataBWTexture2D (gl, new Uint8Array([128, 64, 128,    0, 192, 0])); //gl.createTexture();

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

      vaObject.useProgram();

      texture.data[1] = (ttime % 1280) * 0.2;
      texture.texImage2D ();

      gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable   (gl.CULL_FACE);
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
      modelXRotationRadians += -0.4 * deltaTime;
      modelYRotationRadians += -0.7 * deltaTime;
      let matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
      matrix = m4.yRotate(matrix, modelYRotationRadians);

      vaObject.u_matrix  = matrix;
      vaObject.u_texture = 0;

      vaObject.draw();

      requestAnimationFrame(drawScene);
   }
}

main();

function main2()
{
//       makeExperiments();

   let fVaObject = new FVaObject ("FSimpleObjectWidhTexture");
   let gl = fVaObject.gl;

   let program = fVaObject.program;
   fVaObject.useProgram();

   let texture = new GlImageTexture2D (gl, "./textureManual1combined2/f-texture.png");

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
   
      fVaObject.useProgram();





      gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable   (gl.CULL_FACE);
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
   
      fVaObject.u_matrix  = matrix;
      fVaObject.u_texture = 0; //using texture
   
      fVaObject.draw();
   
      requestAnimationFrame(drawScene);
   }
}
main2();