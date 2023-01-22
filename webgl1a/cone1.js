{
let canvas = document.currentScript.parentElement;

class Cone1 extends GlVAObject
{
   #verts    = [];
   #norms    = [];
   #nh = null;
   #ns = null;
   #dt = 0;
   constructor(context, nh = 1, ns = 20)
   {
      super(context);
      this.initGeometry(nh, ns);
      this.init();
   }
   initGeometry(nh, ns)
   {
      this.#nh = nh;
      this.#ns = ns;
      this.#verts    = [];
      this.#norms    = [];
      let  dr = 0.6;

      for (let i = 0, ix = 0,iy = 1,iz = 2; i < this.#ns; i++, ix += 9,iy += 9,iz += 9)
      {
          this.#verts[ix] = 0.0;
          this.#verts[iy] = 0.0;
          this.#verts[iz] = 0.7; //<-- tip pointint to us
          this.#verts[ix + 3] =  dr * Math.cos(2 * Math.PI * i / this.#ns);
          this.#verts[iy + 3] =  dr * Math.sin(2 * Math.PI * i / this.#ns);
          this.#verts[iz + 3] =  0.0;
          this.#verts[ix + 6] =  dr * Math.cos(2 * Math.PI * (i+1) / this.#ns);
          this.#verts[iy + 6] =  dr * Math.sin(2 * Math.PI * (i+1) / this.#ns);
          this.#verts[iz + 6] =  0.0;
   
          this.#norms[ix]     =  this.#verts[ix + 3];
          this.#norms[iy]     =  this.#verts[iy + 3];
          this.#norms[iz]     =  0.7;
          this.#norms[ix + 3] =  this.#verts[ix + 3];
          this.#norms[iy + 3] =  this.#verts[iy + 3];
          this.#norms[iz + 3] =  0.7;
          this.#norms[ix + 6] =  this.#verts[ix + 3];
          this.#norms[iy + 6] =  this.#verts[iy + 3];
          this.#norms[iz + 6] =  0.7;
   
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
      gl.drawArrays(gl.TRIANGLES, 0, this.#ns * 3);
   }
}

let func = () =>
{
   let cone1 = new Cone1(canvas);
   let gl = cone1.gl;
   cone1.useProgram ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   cone1.draw();

};
document.addEventListener('DOMContentLoaded', func);
}