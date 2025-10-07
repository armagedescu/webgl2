{
let canvas = document.currentScript.parentElement;

function buildCone (nh, ns)
{
   let verts    = [];
   let norms    = [];
   let smooth = true;
   let sm  = smooth ? 1 : 0;
   let sm1 = smooth ? 2 : 0;
   let dr = 1.0;

   for (let i = 0,  [ix, iy, iz] = [0, 1, 2];    i < ns; i++,     ix += 9,iy += 9,iz += 9)
   {
      let ps = [[0.0,                                            0.0,                                          (-1.0)], //<--points in direction of us
                [(dr/nh) * Math.cos(2 * Math.PI *      i / ns ), (dr/nh) * Math.sin(2 * Math.PI *     i / ns), (-1 + 1/nh)],
                [(dr/nh) * Math.cos(2 * Math.PI *  (i+1) / ns ), (dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), (-1 + 1/nh)],
                [(dr/nh) * Math.cos(2 * Math.PI *  (i+2) / ns ), (dr/nh) * Math.sin(2 * Math.PI * (i+2) / ns), (-1 + 1/nh)]];
      let cr = [[0, 0, 0], cross3pl (ps[0], ps[1], ps[2]), cross3pl (ps[0], ps[2], ps[3])];
      [verts[ix],     verts[iy],     verts[iz]]     = ps[0]; //tip
      [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[1];
      [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[2];

      [norms[ix],     norms[iy],     norms[iz]]     = cr[0]; //tip
      [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[sm];
      [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[sm1];
      //console.log (`1: ${cross3pl (ps[0], ps[1], ps[2])}  2:${cross3pl (ps[0], ps[2], ps[3])}`);
   }

   //1 triangle = 3 points * 3 coordinates
   for (let h = 1, [ix, iy, iz] = [ns*9, ns*9 + 1, ns*9 + 2];    h < nh; h++)
   {
      for (let i = 0;    i < ns; i++,       ix += 9,iy += 9,iz += 9)
      {
         let ps = [[     (h*dr/nh) * Math.cos(2 * Math.PI *     i/ns),     (h*dr/nh) * Math.sin(2 * Math.PI *     i / ns), -1 +     h*1/nh],  //[0] 1  4
                   [     (h*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns),     (h*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -1 +     h*1/nh],  //[1]    6
                   [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI *     i/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI *     i / ns), -1 + (h+1)*1/nh],  //[2] 2
                   [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -1 + (h+1)*1/nh],  //[3] 3  5

                 //[     (h*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns),     (h*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -1 +     h*1/nh],  //[1]    6
                   [     (h*dr/nh) * Math.cos(2 * Math.PI * (i+2)/ns),     (h*dr/nh) * Math.sin(2 * Math.PI * (i+2) / ns), -1 +     h*1/nh],  //[4] for cross product
                 //[ ((h+1)*dr/nh) * Math.cos(2 * Math.PI * (i+1)/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI * (i+1) / ns), -1 + (h+1)*1/nh],  //[3] 3  5
                   [ ((h+1)*dr/nh) * Math.cos(2 * Math.PI * (i+2)/ns), ((h+1)*dr/nh) * Math.sin(2 * Math.PI * (i+2) / ns), -1 + (h+1)*1/nh]]; //[5] for cross product

         let cr = [cross3pl (ps[0], ps[2], ps[3]), cross3pl (ps[2], ps[3], ps[0]), cross3pl (ps[5], ps[1], ps[3])];

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[2];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[3];

         [norms[ix],     norms[iy],     norms[iz]]     = cr[0];
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[sm];
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[sm1];

         ix += 9;iy += 9;iz += 9;
         //cr = [cross3pl (ps[0], ps[3], ps[1]), cross3pl (ps[5], ps[4], ps[1]), cross3pl (ps[4], ps[1], ps[5])];
         cr = [cross3pl (ps[0], ps[3], ps[1]), cross3pl (ps[1], ps[5], ps[4]), cross3pl (ps[5], ps[4], ps[1])];

         [verts[ix],     verts[iy],     verts[iz]]     = ps[0];
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = ps[3];
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = ps[1];

         [norms[ix],     norms[iy],     norms[iz]]     = cr[0];
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = cr[sm];
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = cr[sm1];

      }
   }
   const trng = 3, v3d = 3, pat3d = trng * 2;
   let expectedLength = ns * trng * v3d + ns * pat3d * (nh - 1) * v3d;
   console.assert(verts.length == expectedLength, `verts length ${verts.length}  == ${expectedLength}`);
   return {verts : new Float32Array (verts), norms : new Float32Array (norms)};
}

let glmain = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let gl = glCanvas.gl;
   glCanvas.useProgram ();

   let nh = 5, ns = 40;
   //let nh = 2, ns = 4;
   let geometry = buildCone (nh, ns);
   //console.log (geometry.verts.length);


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
   gl.clear (gl.COLOR_BUFFER_BIT);
   gl.drawArrays(gl.TRIANGLES, 0, geometry.verts.length / 3);

};
document.addEventListener('DOMContentLoaded', glmain);
}