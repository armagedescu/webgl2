{
let canvas = document.currentScript.parentElement;

class SimpleDrawIndexed extends GlVAObject
{
   #verts     = [ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
   #texCoords = [ 1,    1,      1,   0,      0,    0,     0,    1  ];

   #indices   = [0, 1, 2, 0, 2, 3];

   constructor(context)
   {
      super(context);
      this.initGeometry();
      this.init();
   }
   initGeometry() {}
   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#verts));
      this.coord = this.vertex_buffer.attrib ("coordinates",  2, gl.FLOAT);

      this.tex_buffer  = this.arrayBuffer(new Float32Array(this.#texCoords));
      this.tex_coord = this.tex_buffer.attrib  ("a_texcoord", 2, gl.FLOAT);

      this.textureLocation  = gl.getUniformLocation (this.program, "u_texture");

      let idxBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.#indices), gl.STATIC_DRAW);
   }
   set u_texture (t)   {this.gl.uniform1i(this.textureLocation, t);}

   drawVao()
   {
      let gl = this.gl;
      gl.drawElements (gl.TRIANGLES, this.#indices.length, gl.UNSIGNED_INT, 0);
   }
}



let func = async () =>
{

   let simpleDrawIndexed = new SimpleDrawIndexed (canvas);
   let gl = simpleDrawIndexed.gl;

   let texture = new GlTexture2D (gl, loadImg ("./texture/f-texture.png"));
   texture._then ((tex) =>
   {
      simpleDrawIndexed.useProgram();
      gl.enable   (gl.CULL_FACE);
      //simpleDrawIndexed.u_texture = 0; //using texture
      simpleDrawIndexed.draw();
   });

};

document.addEventListener('DOMContentLoaded', func);
}