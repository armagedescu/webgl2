{
"use strict";
let canvas = document.currentScript.parentElement;

function buildConeHeart (nh, ns, dr)
{
   if (ns & 1) ns++;

   let verts    = [];
   let norms    = [];

   for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < ns; i++,     ix += 9,iy += 9,iz += 9)
   {
      dr      =  2 *  i      * (1/ns); // <-- increase from 0 to 2 (PI)
      let drd =  2 * (i + 1) * (1/ns); // <-- increase from 0 to 2 (PI)
      if (dr  > 1) dr  = 2 - dr;  //<-- decrease when greater than PI
      if (drd > 1) drd = 2 - drd; //<-- decrease when greater than PI
      let ps = [[0.0,                                             0.0,                                            -1.0], //<--points in direction of us
                [(dr /nh) * Math.cos(2 * Math.PI *   i    / ns ), (dr /nh) * Math.sin(2 * Math.PI *  i    / ns),  -1 + 1/nh],
                [(drd/nh) * Math.cos(2 * Math.PI *  (i+1) / ns ), (drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns),  -1 + 1/nh]];
                //[(drd/nh) * Math.cos(2 * Math.PI *  (i+2) / ns ), (drd/nh) * Math.sin(2 * Math.PI * (i+2) / ns),  -1 + 1/nh]];
      let cr =  cross3pl (ps[0], ps[1], ps[2]);
      //let cr1 = cross3pl (ps[0], ps[2], ps[3]);
      let cr1 = cross3pl (ps[1], ps[2], ps[0]); //must be the same as before, for all triangle
      
      [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
      [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
      [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[2];

      [norms[ix],     norms[iy],     norms[iz]]     = [0, 0, 0];
      [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr;
      [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr1;
   }

   //1 triangle = 3 points * 3 coordinates
   for (let h = 1, ix = ns*9, iy = ns*9 + 1, iz = ns*9 + 2;    h < nh; h++)
   {
      for (let i = 0;    i < ns; i++,       ix += 9,iy += 9,iz += 9)
      {
         dr      =  2 *  i      * (1/ns);
         let drd =  2 * (i + 1) * (1/ns);
         if (dr  > 1) dr  = 2 - dr;  //<-- decrease when greater than PI
         if (drd > 1) drd = 2 - drd; //<-- decrease when greater than PI

         let ps = [[( h   *dr /nh) * Math.cos(2 * Math.PI *  i   /ns), ( h   *dr /nh) * Math.sin(2 * Math.PI *  i    / ns), -1 +  h   *1/nh],  // 1  4
                   [( h   *drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ( h   *drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -1 +  h   *1/nh],  //    6
                   [((h+1)*dr /nh) * Math.cos(2 * Math.PI *  i   /ns), ((h+1)*dr /nh) * Math.sin(2 * Math.PI *  i    / ns), -1 + (h+1)*1/nh],  // 2
                   [((h+1)*drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -1 + (h+1)*1/nh]]; // 3  5

         let cr = cross3pl (ps[0], ps[2], ps[3]);

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[2];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr;
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr;
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr;

         ix += 9;iy += 9;iz += 9;
         cr = cross3pl (ps[0], ps[3], ps[1]);

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr;
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr;
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr;

      }
   }
   let expectedVertsLength =  ns * 3 * 3 + ns * 6 * 3 *(nh - 1);
   console.assert (verts.length == expectedVertsLength);
   return {verts: new Float32Array(verts), norms: new Float32Array(norms)};
}

let glmain = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let gl = glCanvas.gl;
   glCanvas.useProgram ();

   let nh = 3, ns = 100, dr = 1.0;
   //let nh = 3, ns = 12, dr = 1.0;
   geometry = buildConeHeart (nh, ns, dr);
 

   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, geometry.verts, gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);


   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, geometry.norms, gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (glCanvas.program, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);


   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   //gl.enable(gl.CULL_FACE);
   gl.clear (gl.COLOR_BUFFER_BIT);
   gl.drawArrays(gl.TRIANGLES, 0, geometry.verts.length / 3);

};
document.addEventListener('DOMContentLoaded', glmain);
}