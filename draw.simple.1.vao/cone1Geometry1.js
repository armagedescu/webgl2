{
let canvas = document.currentScript.parentElement;

class Cone extends GlVAObject
{
   #verts    = [];
   #norms    = [];
   #ns = null;
   #dt = 0;

   constructor(context, ns = 20, smooth = true)
   {
      super(context);
      this.initGeometry(ns, smooth);
      this.init();
   }
   initGeometry(ns, smooth)
   {
      this.#ns = ns;
      this.#verts    = [];
      this.#norms    = [];
      let  dr = 1.0;
      let  sm = smooth ? 3 : 6;

      for (let i = 0, ix = 0,iy = 1,iz = 2; i < this.#ns; i++, ix += 9,iy += 9,iz += 9)
      {
         [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = [0.0, 0.0, -0.7] ;//<-- tip of the cone, points to us
         [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = [dr * Math.cos(2 * Math.PI *  i    / this.#ns),   dr * Math.sin(2 * Math.PI *  i    / this.#ns),  0] ;
         [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = [dr * Math.cos(2 * Math.PI * (i+1) / this.#ns),   dr * Math.sin(2 * Math.PI * (i+1) / this.#ns),  0] ;

         [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = [0, 0, 0]; //<-- tip of the cone, points to us
         [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = [this.#verts[ix + sm],   this.#verts[iy + sm],  -0.7] ;
         [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = [this.#verts[ix +  6],   this.#verts[iy +  6],  -0.7] ;
      }

   }
   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#verts));
      this.coord = this.vertex_buffer.attrib ("coordinates",  3, gl.FLOAT);

      this.norms_buffer  = this.arrayBuffer(new Float32Array(this.#norms));
      this.noord = this.norms_buffer.attrib  ("inputNormal",  3, gl.FLOAT);

   }
   drawVao()
   {
      let gl = this.gl;
      gl.drawArrays(gl.TRIANGLES, 0, this.#verts.length / 3);
   }
}

let glmain = () =>
{
   let cone = new Cone(canvas, 20);//, 123);
   let gl = cone.gl;
   cone.useProgram ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   cone.draw();

};
document.addEventListener('DOMContentLoaded', glmain);
}