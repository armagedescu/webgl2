{
let canvas = document.currentScript.parentElement;

class Cone1Geometry extends GlVAObject
{
   #verts    = [];
   #norms    = [];
   #nh = null;
   #ns = null;
   constructor(context, nh = 2, ns = 40)
   {
      if (context instanceof GlProgram)
        super(context);
      else
        throw "GlHeartCoat:GlSurface constructor: unknown context";
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

      for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < this.#ns; i++,     ix += 9,iy += 9,iz += 9)
      {
         let ps = [{x:0.0,                                            y:0.0,                                          z:(1.0)}, //<--points in direction of us
                   {x:(dr/nh) * Math.cos(2 * Math.PI *      i / this.#ns ), y:(dr/this.#nh) * Math.sin(2 * Math.PI *     i / this.#ns), z:(1 - 1/this.#nh)},
                   {x:(dr/nh) * Math.cos(2 * Math.PI *  (i+1) / this.#ns ), y:(dr/this.#nh) * Math.sin(2 * Math.PI * (i+1) / this.#ns), z:(1 - 1/this.#nh)}];
         let cr = cross3v(ps[0], ps[1], ps[2]);
         this.#verts[ix]     =  ps[0].x;
         this.#verts[iy]     =  ps[0].y;
         this.#verts[iz]     =  ps[0].z;
         this.#verts[ix + 3] =  ps[1].x;
         this.#verts[iy + 3] =  ps[1].y;
         this.#verts[iz + 3] =  ps[1].z;
         this.#verts[ix + 6] =  ps[2].x;
         this.#verts[iy + 6] =  ps[2].y;
         this.#verts[iz + 6] =  ps[2].z;
      
         this.#norms[ix]     =  cr.x;
         this.#norms[iy]     =  cr.y;
         this.#norms[iz]     =  cr.z;
         this.#norms[ix + 3] =  cr.x;
         this.#norms[iy + 3] =  cr.y;
         this.#norms[iz + 3] =  cr.z;
         this.#norms[ix + 6] =  cr.x;
         this.#norms[iy + 6] =  cr.y;
         this.#norms[iz + 6] =  cr.z;
      }
      
      //1 triangle = 3 points * 3 coordinates
      for (let h = 1, ix = this.#ns*9, iy = this.#ns*9 + 1, iz = this.#ns*9 + 2;    h < this.#nh; h++)
      {
         for (let i = 0;    i < this.#ns; i++,       ix += 9,iy += 9,iz += 9)
         {
             let ps = [{x:     (h*dr/this.#nh) * Math.cos(2 * Math.PI *     i/this.#ns), y:    (h*dr/this.#nh) * Math.sin(2 * Math.PI *     i / this.#ns), z:1 -     h*1/this.#nh},  // 1  4
                       {x:     (h*dr/this.#nh) * Math.cos(2 * Math.PI * (i+1)/this.#ns), y:    (h*dr/this.#nh) * Math.sin(2 * Math.PI * (i+1) / this.#ns), z:1 -     h*1/this.#nh},  //    6
                       {x: ((h+1)*dr/this.#nh) * Math.cos(2 * Math.PI *     i/this.#ns), y:((h+1)*dr/this.#nh) * Math.sin(2 * Math.PI *     i / this.#ns), z:1 - (h+1)*1/this.#nh},  // 2
                       {x: ((h+1)*dr/this.#nh) * Math.cos(2 * Math.PI * (i+1)/this.#ns), y:((h+1)*dr/this.#nh) * Math.sin(2 * Math.PI * (i+1) / this.#ns), z:1 - (h+1)*1/this.#nh}]; // 3  5
      
             let cr = cross3v(ps[0], ps[2], ps[3]);
      
             this.#verts[ix]     =  ps[0].x;
             this.#verts[iy]     =  ps[0].y;
             this.#verts[iz]     =  ps[0].z;
             this.#verts[ix + 3] =  ps[2].x;
             this.#verts[iy + 3] =  ps[2].y;
             this.#verts[iz + 3] =  ps[2].z;
             this.#verts[ix + 6] =  ps[3].x;
             this.#verts[iy + 6] =  ps[3].y;
             this.#verts[iz + 6] =  ps[3].z;
      
             this.#norms[ix]     =  cr.x;
             this.#norms[iy]     =  cr.y;
             this.#norms[iz]     =  cr.z;
             this.#norms[ix + 3] =  cr.x;
             this.#norms[iy + 3] =  cr.y;
             this.#norms[iz + 3] =  cr.z;
             this.#norms[ix + 6] =  cr.x;
             this.#norms[iy + 6] =  cr.y;
             this.#norms[iz + 6] =  cr.z;
      
             ix += 9;iy += 9;iz += 9;
             cr = cross3v(ps[0], ps[3], ps[1]);
      
             this.#verts[ix]     =  ps[0].x;
             this.#verts[iy]     =  ps[0].y;
             this.#verts[iz]     =  ps[0].z;
             this.#verts[ix + 3] =  ps[1].x;
             this.#verts[iy + 3] =  ps[1].y;
             this.#verts[iz + 3] =  ps[1].z;
             this.#verts[ix + 6] =  ps[3].x;
             this.#verts[iy + 6] =  ps[3].y;
             this.#verts[iz + 6] =  ps[3].z;
      
             this.#norms[ix]     =  cr.x;
             this.#norms[iy]     =  cr.y;
             this.#norms[iz]     =  cr.z;
             this.#norms[ix + 3] =  cr.x;
             this.#norms[iy + 3] =  cr.y;
             this.#norms[iz + 3] =  cr.z;
             this.#norms[ix + 6] =  cr.x;
             this.#norms[iy + 6] =  cr.y;
             this.#norms[iz + 6] =  cr.z;
      
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
	  //gl.drawArrays(gl.TRIANGLES, 0,     ns * 3 +       ns * 6 *       (nh - 1));
      gl.drawArrays(gl.TRIANGLES, 0, this.#ns * 3 + this.#ns * 6 * (this.#nh - 1));
   }
}

let func = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let cone1Geometry = new Cone1Geometry (glCanvas.program);
   let prog = cone1Geometry.program;
   let gl = cone1Geometry.gl;
   cone1Geometry.useProgram   ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   cone1Geometry.draw   ();


};
document.addEventListener('DOMContentLoaded', func);
}