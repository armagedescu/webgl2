{
"use strict";
let canvas = document.currentScript.parentElement;

class SquareTexVAO extends GlVAObject
{
   //similar variant to full canvas cover rectangle
   //#texVerts            = new Float32Array([ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,         1.0, -1.0,   -1.0,  1.0,   -1.0, -1.0]);
   //#texCoords           = new Float32Array([   1,    0,      1,   1,      0,    1,           1,    0,      0,    1,      0,    0]);
   // full canvas cover rectangle
   //#vertices is 2D XY  //#texCoords is 2D fully
   #vertices  = new Float32Array([-1.0,  -1.0,  1.0, -1.0,  -1.0, 1.0,          -1.0,  1.0,  1.0, -1.0,  1.0, 1.0]);
   #texCoords = new Float32Array([   0,     0,    1,    0,     0,   1,             0,    1,    1,    0,     1,  1]);

   constructor (context, shaders)
   {
      super (context, shaders);
      this.init ();
   }

   init ()
   {
      const gl = this.gl;
      this.bindVertexArray();

      this.vertex_buffer = this.arrayBuffer  (this.#vertices);
      this.coord         = this.vertex_buffer.attrib ("a_position",  2, gl.FLOAT);

      this.tex_buffer    = this.arrayBuffer  (this.#texCoords);
      this.tex_coord     = this.tex_buffer.attrib  ("a_texcoord", 2, gl.FLOAT);

      this.textureLocation  = gl.getUniformLocation (this.program, "u_texture");
      console.log ("u_texture location: ", this.textureLocation);
   }
   set u_texture (t)   {this.gl.uniform1i        (this.textureLocation, t);}

   drawVao ()
   {
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.#vertices.length / 2); //6 * 6);
   }
}

class GlDataRGBTexture2D
{
   constructor (gl, data)
   {
      this.gl = gl;
      this.data = data;
      this.texture = gl.createTexture ();
      console.log ("Texture RGB: ", this.texture);
      this.type = gl.TEXTURE_2D;
	   this.bindTexture ();
	   this.init ();
   }
   init ()
   {
      const gl = this.gl;
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
      const gl = this.gl;
      const level          = 0;
      const internalFormat = gl.RGB;
      const width          = 3; // pixels
      const height         = 2; // pixels
      const border         = 0;
      const format         = gl.RGB; //RGB
      const type           = gl.UNSIGNED_BYTE;
      
      this.bindTexture ();
      gl.texImage2D  (this.type, level, internalFormat, width, height, border, format, type, this.data);
   }
   bindTexture()
   {
      this.gl.bindTexture(this.type, this.texture);
   }
}
function main()
{
   let vaObject = new SquareTexVAO (canvas);
   let gl = vaObject.gl;

   let program = vaObject.program;
   vaObject.useProgram();

   // Create RGB Texture
   let textureRgb = new GlDataRGBTexture2D (gl, new Uint8Array([128,  64, 128,      0, 255,   0,    128,  64, 128, 
                                                                  0, 255,   0,    128,  64, 128,      0, 255,   0])); //gl.createTexture();


   gl.enable   (gl.CULL_FACE);
   gl.enable   (gl.DEPTH_TEST);
   gl.clear    (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   vaObject.useProgram();

   requestAnimationFrame(drawScene);

   function drawScene(time)
   {
      let txTime = time; //texture time, generating some pulse in the texture

      textureRgb.data[4] = (txTime % 1280)  * 0.2; // Change the second pixel value over time
      textureRgb.texImage2D (); // Update the rgb texture with the new data

      gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);

      //textureRgb.bindTexture (); // Bind the texture before drawing

      vaObject.u_texture = textureRgb.texture; //textureRgb.texture; //TODO: ??? Consider textureRgb.texture; //?

      vaObject.draw();

      requestAnimationFrame(drawScene);
   }
}

document.addEventListener("DOMContentLoaded", main);
//main();
}