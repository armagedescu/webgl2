{
"use strict";
let canvas = document.currentScript.parentElement;
//TODO: Make elevated lib for text texture creation

class Maual2TexVaObject extends GlVAObject
{
   //similar variant to full canvas cover rectangle
   //#texVerts  = new Float32Array([ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,         1.0, -1.0,   -1.0,  1.0,   -1.0, -1.0]);
   //#texCoords = new Float32Array([   1,    0,      1,   1,      0,    1,           1,    0,      0,    1,      0,    0]);
   // full canvas cover rectangle
   //#vertices is 2D XY  //#texCoords is 2D fully
   #vertices    = new Float32Array([-1.0,  -1.0,   1.0, -1.0,   -1.0, 1.0,        -1.0,  1.0,    1.0, -1.0,    1.0,  1.0]);
   #texCoords   = new Float32Array([   0,     0,     1,    0,      0,   1,           0,    1,      1,    0,      1,    1]);
   constructor (context, shaders)
   {
      super (context, shaders);
      this.init ();
   }

   init ()
   {
      const gl = this.gl;
      this.bindVertexArray();

      this.vertex_buffer = this.arrayBuffer  (new Float32Array(this.#vertices));
      this.coord         = this.vertex_buffer.attrib ("a_position",  2, gl.FLOAT);

      this.tex_buffer    = this.arrayBuffer (new Float32Array(this.#texCoords));
      this.tex_coord     = this.tex_buffer.attrib  ("a_texcoord", 2, gl.FLOAT);

      this.textureLocation  = gl.getUniformLocation (this.program, "u_texture");
      console.log ("u_texture location: ", this.textureLocation);
   }
   set u_texture (t)   {this.gl.uniform1i        (this.textureLocation, t);}

   drawVao ()
   {
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.#vertices.length / 2);
   }
}

class GlDataCanvTexture2D
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
      const gl = this.gl;
      const alignment = 1;
      gl.pixelStorei (gl.UNPACK_ALIGNMENT, alignment);

      // set the filtering so we don't need mips and it's not filtered
      gl.texParameteri(this.type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(this.type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(this.type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(this.type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.pixelStorei    (gl.UNPACK_FLIP_Y_WEBGL, true);
	   this.texImage2D ();
   }
   texImage2D ()
   {
      const gl = this.gl;
      const level          = 0;
      const internalFormat = gl.RGBA;
      const format         = gl.RGBA;
      const type           = gl.UNSIGNED_BYTE;
      
      this.bindTexture ();
      gl.texImage2D     (gl.TEXTURE_2D, level, internalFormat, format, type, this.data);
   }
   bindTexture()
   {
      this.gl.bindTexture(this.type, this.texture);
   }
}
function main()
{
   let vaObject = new Maual2TexVaObject (canvas);
   let gl = vaObject.gl;

   vaObject.useProgram();

   let textCanvas = makeTextCanvas("Hello!", 100, 26);  // private lib api
   // Create Text Texture from Canvas/Img.... Element
   let textTexture = new GlDataCanvTexture2D (gl, textCanvas);

   gl.enable   (gl.CULL_FACE);
   vaObject.useProgram();

   gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);

   //textTexture.bindTexture (); // Bind the texture before drawing

   vaObject.u_texture = textTexture.texture; //textureRgb.texture; //TODO: ??? Consider textureRgb.texture; //?

   vaObject.draw();

}

document.addEventListener("DOMContentLoaded", main);

}