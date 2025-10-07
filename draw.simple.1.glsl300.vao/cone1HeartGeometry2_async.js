{
let canvas = document.currentScript.parentElement;

class HeartGeometry2 extends GlVAObject
{
   #verts    = [];
   #norms    = [];
   #nh = null;
   #ns = null;
   #p  = null;
   constructor(context, nh = 2, ns = 40)
   {
      super(context);
      this.initGeometry(nh, ns);
      this.init();
      this.#p = new Promise (   (resolve, reject) => { setTimeout( resolve, 2000, this ); }   );
   }
   async ready ()
   {
      await this.#p.then (o => {});
	   return this;
   }
   initGeometry(nh, ns)
   {
      if(ns & 1) ns++;
      this.#nh = nh;
      this.#ns = ns;
      this.#verts    = [];
      this.#norms    = [];
      let PI_2 = 2 * Math.PI;      //2 * Pi
      let FI_S = 2 * Math.PI / this.#ns; //angular size of one sector
      let R_S  = 2 / this.#ns;           //Radius = FI normalized (FI / PI)
      let D_H  = 1 / this.#nh;

      for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < this.#ns; i++,     ix += 9,iy += 9,iz += 9)
      {
         let ps, cr;
         if (i < this.#ns / 2)
         {
            let fi1 = i   * FI_S;
            let fi2 = fi1 + FI_S; //next fi
            
            let rc1 = i   * R_S; //<-- radius coeficient
            let rc2 = rc1 + R_S; //<-- next radius coeficient

            let r1 = rc1 / nh; //<-- radius
            let r2 = rc2 / nh; //<-- next radius

            ps = [[0.0,                  0.0,                  -(1.0)], //<--points in direction of us
                  [r1 * Math.cos(fi1),   r1 * Math.sin(fi1),   -(1 - D_H)],
                  [r2 * Math.cos(fi2),   r2 * Math.sin(fi2),   -(1 - D_H)]];

            cr = [[0,   0,   0],
                  [(Math.sin(fi1) + fi1 * Math.cos(fi1)),  -(Math.cos(fi1) - fi1 * Math.sin(fi1)),   -(1 + fi1)],
                  [(Math.sin(fi2) + fi2 * Math.cos(fi2)),  -(Math.cos(fi2) - fi2 * Math.sin(fi2)),   -(1 + fi2)]];
         } else
         {
            let i2 = i - this.#ns / 2;
            let fi1 = -i2   * FI_S;
            let fi2 =  fi1  - FI_S;

            let rc1 = i2  * R_S; //<-- radius coeficients
            let rc2 = rc1 + R_S; //<-- radius coeficients

            let r1 = rc1 / nh; //<-- radius
            let r2 = rc2 / nh; //<-- radius

            ps =     [[0.0,                  0.0,                  -(1.0)], //<--points to us
                      [r2 * Math.cos(fi2),   r2 * Math.sin(fi2),   -(1 - D_H)],
                      [r1 * Math.cos(fi1),   r1 * Math.sin(fi1),   -(1 - D_H)]];

            cr = [[ 0,  0,  0],
                  [-(Math.sin(fi2) + fi2 * Math.cos(fi2)), (Math.cos(fi2) - fi2 * Math.sin(fi2)), -(1 + fi2)],
                  [-(Math.sin(fi1) + fi1 * Math.cos(fi1)), (Math.cos(fi1) - fi1 * Math.sin(fi1)), -(1 + fi1)]];
         }
         [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = ps[0];
         [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = ps[1];
         [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = ps[2];

         [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = cr[0];
         [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = cr[1];
         [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = cr[2];
      }

      //1 triangle = 3 points * 3 coordinates
      for (let h = 1, ix = ns*9, iy = ns*9 + 1, iz = ns*9 + 2;    h < nh; h++)
      {
         let h1n = h/nh, h2n = (h+1)/nh; //<-- start and stop height
         for (let i = 0;    i < ns; i++,       ix += 9,iy += 9,iz += 9)
         {
            let ps, cr;
            if (i < ns / 2)
            {
               let fi1 = i   * FI_S;
               let fi2 = fi1 + FI_S;

               let rc1 = i   * R_S; //<-- radius coeficients
               let rc2 = rc1 + R_S; //<-- radius coeficients
               //if (rc1 > 1) rc1 = 2 - rc1; //<-- decreases when passes Pi
               //if (rc2 > 1) rc2 = 2 - rc2; //<-- decreases when passes Pi
               let r11 = rc1 * h1n; //<-- radius
               let r12 = rc2 * h1n; //<-- radius
               let r21 = rc1 * h2n; //<-- radius
               let r22 = rc2 * h2n; //<-- radius

               ps = [[r11 * Math.cos(fi1),  r11 * Math.sin(fi1),  -(1 - h1n)],  // <-- points [1] []    [1]   [4]
                     [r12 * Math.cos(fi2),  r12 * Math.sin(fi2),  -(1 - h1n)],  // <-- points [ ] []    [ ]   [6]
                     [r21 * Math.cos(fi1),  r21 * Math.sin(fi1),  -(1 - h2n)],  // <-- points [3] []    [2]   [ ]
                     [r22 * Math.cos(fi2),  r22 * Math.sin(fi2),  -(1 - h2n)]]; // <-- points [2] []    [3]   [5]
               
               cr = [[(Math.sin(fi1) + fi1 * Math.cos(fi1)),  -(Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                     [(Math.sin(fi2) + fi2 * Math.cos(fi2)),  -(Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)],
                     [(Math.sin(fi1) + fi1 * Math.cos(fi1)),  -(Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                     [(Math.sin(fi2) + fi2 * Math.cos(fi2)),  -(Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)]
                    ];

            } else
            {
               let i2 = i - this.#ns / 2;
               let fi1 = -i2 * FI_S;
               let fi2 = fi1 - FI_S;

               let rc1 = i2  * R_S; //<-- radius coeficients
               let rc2 = rc1 + R_S; //<-- radius coeficients
               //if (rc1 > 1) rc1 = 2 - rc1; //<-- decreases when passes Pi
               //if (rc2 > 1) rc2 = 2 - rc2; //<-- decreases when passes Pi
               let r11 = rc1 * h1n; //<-- radius
               let r12 = rc2 * h1n; //<-- radius
               let r21 = rc1 * h2n; //<-- radius
               let r22 = rc2 * h2n; //<-- radius

               ps = [[r11 * Math.cos(fi1),  r11 * Math.sin(fi1),  -(1 - h1n)],  // <-- points [1]   [4]
                     [r12 * Math.cos(fi2),  r12 * Math.sin(fi2),  -(1 - h1n)],  // <-- points [ ]   [6]
                     [r21 * Math.cos(fi1),  r21 * Math.sin(fi1),  -(1 - h2n)],  // <-- points [2]   [ ]
                     [r22 * Math.cos(fi2),  r22 * Math.sin(fi2),  -(1 - h2n)]]; // <-- points [3]   [5]
               
               cr = [[-(Math.sin(fi1) + fi1 * Math.cos(fi1)),  (Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                     [-(Math.sin(fi2) + fi2 * Math.cos(fi2)),  (Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)],
                     [-(Math.sin(fi1) + fi1 * Math.cos(fi1)),  (Math.cos(fi1) - fi1 * Math.sin(fi1)),  -(1 + fi1)],
                     [-(Math.sin(fi2) + fi2 * Math.cos(fi2)),  (Math.cos(fi2) - fi2 * Math.sin(fi2)),  -(1 + fi2)]
                    ];

            }

            [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = ps[0];
            [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = ps[2];
            [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = ps[3];

            [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = cr[0];
            [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = cr[2];
            [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = cr[3];

            ix += 9;iy += 9;iz += 9;

            [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = ps[0];
            [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = ps[1];
            [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = ps[3];

            [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = cr[0];
            [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = cr[1];
            [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = cr[3];

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


let glmain = async () =>
{
   new HeartGeometry2(canvas).ready().then(vao => //nh = 2, ns = 40;
   {
      let gl = vao.gl;
      vao.useProgram ();

      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.enable(gl.DEPTH_TEST);
      //gl.enable(gl.CULL_FACE);
      gl.clear (gl.COLOR_BUFFER_BIT);
      vao.draw();
   } );
};
document.addEventListener('DOMContentLoaded', glmain);
}