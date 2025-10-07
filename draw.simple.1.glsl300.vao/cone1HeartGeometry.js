{
let canvas = document.currentScript.parentElement;

class HeartGeometry1 extends GlVAObject
{
   #verts    = [];
   #norms    = [];
   #nh = null;
   #ns = null;
   constructor(context, nh = 2, ns = 40)
   {
      super(context);
      this.initGeometry(nh, ns);
      this.init();
   }
   initGeometry(nh, ns)
   {
      if (ns & 1) ns++;
      this.#nh = nh;
      this.#ns = ns;
      this.#verts    = [];
      this.#norms    = [];

      let dr = 1.0;
      
      for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < this.#ns; i++,     ix += 9,iy += 9,iz += 9)
      {
         dr      =  2 *  i      * (1/this.#ns); // <-- increase from 0 to 2 (PI)
         let drd =  2 * (i + 1) * (1/this.#ns); // <-- increase from 0 to 2 (PI)
         if (dr  > 1) dr  = 2 - dr;  //<-- decrease when greater than PI
         if (drd > 1) drd = 2 - drd; //<-- decrease when greater than PI
         let ps = [[0.0,                                             0.0,                                           (1.0)], //<--points in direction of us
                   [(dr /nh) * Math.cos(2 * Math.PI *   i    / ns ), (dr /nh) * Math.sin(2 * Math.PI *  i    / ns), (1 - 1/nh)],
                   [(drd/nh) * Math.cos(2 * Math.PI *  (i+1) / ns ), (drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), (1 - 1/nh)]];
         let cr = cross3p (ps[0], ps[1], ps[2]);
         [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = ps[0];
         [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = ps[1];
         [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = ps[2];

         [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = cr;
         [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = cr;
         [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = cr;

      }

      //1 triangle = 3 points * 3 coordinates
      for (let h = 1, ix = ns*9, iy = ns*9 + 1, iz = ns*9 + 2;    h < nh; h++)
      {
         for (let i = 0;    i < ns; i++,       ix += 9,iy += 9,iz += 9)
         {
            dr      =  2 *  i      * (1/this.#ns);
            let drd =  2 * (i + 1) * (1/this.#ns);
            if (dr  > 1) dr  = 2 - dr;  //<-- decrease when greater than PI
            if (drd > 1) drd = 2 - drd; //<-- decrease when greater than PI

            let ps = [[( h   *dr /nh) * Math.cos(2 * Math.PI *  i   /ns), ( h   *dr /nh) * Math.sin(2 * Math.PI *  i    / ns), 1 -  h   *1/nh],  // 1  4
                      [( h   *drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ( h   *drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), 1 -  h   *1/nh],  //    6
                      [((h+1)*dr /nh) * Math.cos(2 * Math.PI *  i   /ns), ((h+1)*dr /nh) * Math.sin(2 * Math.PI *  i    / ns), 1 - (h+1)*1/nh],  // 2
                      [((h+1)*drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), 1 - (h+1)*1/nh]]; // 3  5

            let cr = cross3p (ps[0], ps[2], ps[3]);

            [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = ps[0];
            [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = ps[2];
            [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = ps[3];

            [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = cr;
            [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = cr;
            [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = cr;

            ix += 9;iy += 9;iz += 9;
            cr = cross3p (ps[0], ps[3], ps[1]);

            [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = ps[0];
            [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = ps[1];
            [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = ps[3];

            [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = cr;
            [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = cr;
            [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = cr;

         }
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
      gl.drawArrays(gl.TRIANGLES, 0, this.#ns * 3 + this.#ns * 6 * (this.#nh - 1));
   }
}

let glmain = () =>
{
   let heartGeometry1  = new HeartGeometry1(canvas, 3, 100);
   let gl = heartGeometry1.gl;
   heartGeometry1.useProgram ();
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);
   gl.clear (gl.COLOR_BUFFER_BIT);
   heartGeometry1.draw();

};
document.addEventListener('DOMContentLoaded', glmain);
}