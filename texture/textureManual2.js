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
