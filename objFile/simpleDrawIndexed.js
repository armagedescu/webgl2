{
let canvas = document.currentScript.parentElement;

class SimpleDrawIndexed extends GlVAObject
{
   #verts     = [ 0.5, -0.5,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
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

      let idxBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.#indices), gl.STATIC_DRAW);
   }

   drawVao()
   {
      let gl = this.gl;
      gl.drawElements (gl.TRIANGLES, this.#indices.length, gl.UNSIGNED_INT, 0);
   }
}

let func = () =>
{

   let simpleDrawIndexed = new SimpleDrawIndexed (canvas);
   let gl = simpleDrawIndexed.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   simpleDrawIndexed.draw();
 
};
document.addEventListener('DOMContentLoaded', func);
}