{
let canvas = document.currentScript.parentElement;

class TriangleFan extends GlVAObject
{

   #verts    = [0.8, 0.8, 0];
   #norms    = [0.0, 0.0, 1.0];
   #nh = null; #ns = null; #dr = null;
   constructor(context, nh = 1, ns = 16, dr = 0.6)//, dnh = 0.2,)
   {
      super(context);
      this.#nh = nh; this.#ns = ns; this.#dr = dr;
      this.initGeometry();
      this.init();
   }
   initGeometry()
   {
      for (let i = 0, ix = 3,iy = 4,iz = 5; i <= this.#ns; i++, ix += 3,iy += 3,iz += 3)
      {
          [this.#verts [ix], this.#verts [iy], this.#verts [iz]] = [this.#dr * Math.cos(2 * Math.PI * i / this.#ns),   this.#dr * Math.sin(2 * Math.PI * i / this.#ns),   -1];
          [this.#norms [ix], this.#norms [iy], this.#norms [iz]] = [0, 1, 1];
      }
   }

   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#verts));
      this.coord = this.vertex_buffer.attrib ("coordinates",  3, gl.FLOAT);

      this.norms_buffer  = this.arrayBuffer(new Float32Array(this.#norms));
      this.noord = this.norms_buffer.attrib  ("inputNormal", 3, gl.FLOAT);
   }
   drawVao()
   {
      let gl = this.gl;
      gl.drawArrays(gl.TRIANGLE_FAN, 0, this.#ns + 2);
   }
}


let func = () =>
{
   let triangleFan = new TriangleFan(canvas); //nh = 1, ns = 16, dr = 0.6;// dnh = 0.2,
   let gl   = triangleFan.gl;
   triangleFan.useProgram();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   triangleFan.draw();
};
document.addEventListener('DOMContentLoaded', func);
}