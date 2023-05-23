{
let canvas = document.currentScript.parentElement;

class Cone extends GlVAObject
{
   #verts    = [];
   #norms    = [];
   #nh = null;
   #ns = null;
   constructor(context, nh = 2, ns = 40, smooth = true)
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
      let  dr = 1.0;
      //let  sm = smooth ? 3 : 6;

      for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < this.#ns; i++,     ix += 9,iy += 9,iz += 9)
      {
         let ps = [[0.0,                                            0.0,                                          (1.0)], //<--points in direction of us
                   [(dr/nh) * Math.cos(2 * Math.PI *      i / ns ), (dr/nh) * Math.sin(2 * Math.PI *     i / ns), (1 - 1/nh)],
                   [(dr/nh) * Math.cos(2 * Math.PI *  (i+1) / ns ), (dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), (1 - 1/nh)]];
         let cr = cross3p (ps[0], ps[1], ps[2]);

         [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = ps[0];
         [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = ps[1];
         [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = ps[2];

         [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = [0, 0, 0];
         [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = cr;
         [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = cr;
      }
      
      //1 triangle = 3 points * 3 coordinates
      for (let h = 1, ix = this.#ns*9, iy = this.#ns*9 + 1, iz = this.#ns*9 + 2;    h < this.#nh; h++)
      {
         for (let i = 0;    i < this.#ns; i++,       ix += 9,iy += 9,iz += 9)
         {
            let ps = [[     (h*dr/nh) * Math.cos(2 * Math.PI *     i/ns),     (h*dr/nh) * Math.sin(2 * Math.PI *     i / ns), 1 -     h*1/nh],  // 1  4
                      [     (h*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns),     (h*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), 1 -     h*1/nh],  //    6
                      [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI *     i/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI *     i / ns), 1 - (h+1)*1/nh],  // 2
                      [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), 1 - (h+1)*1/nh]]; // 3  5

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

let func = () =>
{
   let cone = new Cone (canvas);
   let gl = cone.gl;
   cone.useProgram   ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   cone.draw   ();


};
document.addEventListener('DOMContentLoaded', func);
}