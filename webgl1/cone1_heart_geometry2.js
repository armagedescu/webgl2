{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let glWrapper = new GlWrapper(canvas);
   let prog = glWrapper.context;
   let gl = prog.gl;
   let shaderProgram = prog.shaderProgram;
   gl.useProgram (shaderProgram);

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   //gl.enable(gl.CULL_FACE);
   gl.clear (gl.COLOR_BUFFER_BIT);

   let nh = 2, ns = 40;
   if (ns & 1) ns++;

   let verts    = [];
   let norms    = [];
   let tgs = 0;

   let PI_2 = 2 * Math.PI;      //2 * Pi
   let FI_S = 2 * Math.PI / ns; //angular size of one sector
   let R_S  = 2 / ns;           //Radius = FI normalized (FI / PI)
   let D_H  = 1 / nh;


   for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < ns; i++,     ix += 9,iy += 9,iz += 9)
   {
      let ps, cr;
	  if (i < ns/2)
	  {
         let fi1 = i   * FI_S;
         let fi2 = fi1 + FI_S; //next fi
	     
         let rc1 = i   * R_S; //<-- radius coeficient
         let rc2 = rc1 + R_S; //<-- next radius coeficient

         let r1 = rc1 / nh; //<-- radius
         let r2 = rc2 / nh; //<-- next radius
	     
         ps = [{x:0.0,                  y:0.0,                  z:(1.0)}, //<--points in direction of us
               {x:r1 * Math.cos(fi1),   y:r1 * Math.sin(fi1),   z:(1 - D_H)},
               {x:r2 * Math.cos(fi2),   y:r2 * Math.sin(fi2),   z:(1 - D_H)}];
         let crz = cross3v(ps[0], ps[1], ps[2]);

         cr = [{x : 0,   y :0,   z : 0},
               {x : (Math.sin(fi1) + fi1 * Math.cos(fi1)),   y : -(Math.cos(fi1) - fi1 * Math.sin(fi1)),   z : 1 + fi1},
               {x : (Math.sin(fi2) + fi2 * Math.cos(fi2)),   y : -(Math.cos(fi2) - fi2 * Math.sin(fi2)),   z : 1 + fi2}];

	  } else
	  {
		 i2 = i - ns / 2;
         let fi1 = -i2   * FI_S;
         let fi2 =  fi1  - FI_S;
	     
         let rc1 = i2  * R_S; //<-- radius coeficients
         let rc2 = rc1 + R_S; //<-- radius coeficients

         let r1 = rc1 / nh; //<-- radius
         let r2 = rc2 / nh; //<-- radius
	     
         ps =     [{x:0.0,                  y:0.0,                  z:(1.0)}, //<--points in direction of us
                   {x:r2 * Math.cos(fi2),   y:r2 * Math.sin(fi2),   z:(1 - D_H)},
				   {x:r1 * Math.cos(fi1),   y:r1 * Math.sin(fi1),   z:(1 - D_H)}];

         cr = [{x: 0, y: 0, z: 0},
		       {x:-(Math.sin(fi2) + fi2 * Math.cos(fi2)), y:(Math.cos(fi2) - fi2 * Math.sin(fi2)), z: 1 + fi2},
               {x:-(Math.sin(fi1) + fi1 * Math.cos(fi1)), y:(Math.cos(fi1) - fi1 * Math.sin(fi1)), z: 1 + fi1}];
	  }
      verts[ix]     =  ps[0].x;
      verts[iy]     =  ps[0].y;
      verts[iz]     =  ps[0].z;
      verts[ix + 3] =  ps[1].x;
      verts[iy + 3] =  ps[1].y;
      verts[iz + 3] =  ps[1].z;
      verts[ix + 6] =  ps[2].x;
      verts[iy + 6] =  ps[2].y;
      verts[iz + 6] =  ps[2].z;

      norms[ix]     =  cr[0].x;
      norms[iy]     =  cr[0].y;
      norms[iz]     =  cr[0].z;
      norms[ix + 3] =  cr[1].x;
      norms[iy + 3] =  cr[1].y;
      norms[iz + 3] =  cr[1].z;
      norms[ix + 6] =  cr[2].x;
      norms[iy + 6] =  cr[2].y;
      norms[iz + 6] =  cr[2].z;
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

            ps = [{x: r11 * Math.cos(fi1),  y: r11 * Math.sin(fi1),  z: 1 - h1n},  // <-- points [1] []    [1]   [4]
                  {x: r12 * Math.cos(fi2),  y: r12 * Math.sin(fi2),  z: 1 - h1n},  // <-- points [ ] []    [ ]   [6]
                  {x: r21 * Math.cos(fi1),  y: r21 * Math.sin(fi1),  z: 1 - h2n},  // <-- points [3] []    [2]   [ ]
                  {x: r22 * Math.cos(fi2),  y: r22 * Math.sin(fi2),  z: 1 - h2n}]; // <-- points [2] []    [3]   [5]

            //let cr = cross3v(ps[0], ps[2], ps[3]);
            //cr = [cross3v(ps[0], ps[2], ps[3])];

            cr = [{x:(Math.sin(fi1) + fi1 * Math.cos(fi1)), y:-(Math.cos(fi1) - fi1 * Math.sin(fi1)), z:1+fi1}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:(Math.sin(fi1) + fi1 * Math.cos(fi1)), y:-(Math.cos(fi1) - fi1 * Math.sin(fi1)), z:1+fi1}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:(Math.sin(fi2) + fi2 * Math.cos(fi2)), y:-(Math.cos(fi2) - fi2 * Math.sin(fi2)), z:1+fi2}, //{x:wrap(1/Math.cos(fi2)), y:wrap(1/Math.sin(fi2)), z:2},
                  {x:(Math.sin(fi1) + fi1 * Math.cos(fi1)), y:-(Math.cos(fi1) - fi1 * Math.sin(fi1)), z:1+fi1}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:(Math.sin(fi2) + fi2 * Math.cos(fi2)), y:-(Math.cos(fi2) - fi2 * Math.sin(fi2)), z:1+fi2}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:(Math.sin(fi2) + fi2 * Math.cos(fi2)), y:-(Math.cos(fi2) - fi2 * Math.sin(fi2)), z:1+fi2}, //{x:wrap(1/Math.cos(fi2)), y:wrap(1/Math.sin(fi2)), z:2},
                 ];
         } else
         {
            i2 = i - ns / 2;
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

            ps = [{x: r11 * Math.cos(fi1),  y: r11 * Math.sin(fi1),  z: 1 - h1n},  // <-- points [1]   [4]
                  {x: r12 * Math.cos(fi2),  y: r12 * Math.sin(fi2),  z: 1 - h1n},  // <-- points [ ]   [6]
                  {x: r21 * Math.cos(fi1),  y: r21 * Math.sin(fi1),  z: 1 - h2n},  // <-- points [2]   [ ]
                  {x: r22 * Math.cos(fi2),  y: r22 * Math.sin(fi2),  z: 1 - h2n}]; // <-- points [3]   [5]

            //let cr = cross3v(ps[0], ps[2], ps[3]);
            //cr = [cross3v(ps[0], ps[2], ps[3])];

		    cr = [{x:-(Math.sin(fi1) + fi1 * Math.cos(fi1)), y:(Math.cos(fi1) - fi1 * Math.sin(fi1)), z:1+fi1}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:-(Math.sin(fi1) + fi1 * Math.cos(fi1)), y:(Math.cos(fi1) - fi1 * Math.sin(fi1)), z:1+fi1}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:-(Math.sin(fi2) + fi2 * Math.cos(fi2)), y:(Math.cos(fi2) - fi2 * Math.sin(fi2)), z:1+fi2}, //{x:wrap(1/Math.cos(fi2)), y:wrap(1/Math.sin(fi2)), z:2},
		          {x:-(Math.sin(fi1) + fi1 * Math.cos(fi1)), y:(Math.cos(fi1) - fi1 * Math.sin(fi1)), z:1+fi1}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:-(Math.sin(fi2) + fi2 * Math.cos(fi2)), y:(Math.cos(fi2) - fi2 * Math.sin(fi2)), z:1+fi2}, //{x:wrap(1/Math.cos(fi1)), y:wrap(1/Math.sin(fi1)), z:2},
                  {x:-(Math.sin(fi2) + fi2 * Math.cos(fi2)), y:(Math.cos(fi2) - fi2 * Math.sin(fi2)), z:1+fi2}, //{x:wrap(1/Math.cos(fi2)), y:wrap(1/Math.sin(fi2)), z:2},
                 ];
         }


         verts[ix]     =  ps[0].x;
         verts[iy]     =  ps[0].y;
         verts[iz]     =  ps[0].z;
         verts[ix + 3] =  ps[2].x;
         verts[iy + 3] =  ps[2].y;
         verts[iz + 3] =  ps[2].z;
         verts[ix + 6] =  ps[3].x;
         verts[iy + 6] =  ps[3].y;
         verts[iz + 6] =  ps[3].z;

         norms[ix]     =  cr[0].x;
         norms[iy]     =  cr[0].y;
         norms[iz]     =  cr[0].z;
         norms[ix + 3] =  cr[1].x;
         norms[iy + 3] =  cr[1].y;
         norms[iz + 3] =  cr[1].z;
         norms[ix + 6] =  cr[2].x;
         norms[iy + 6] =  cr[2].y;
         norms[iz + 6] =  cr[2].z;

         ix += 9;iy += 9;iz += 9;
         //cr = [cross3v(ps[0], ps[3], ps[1])];

         verts[ix]     =  ps[0].x;
         verts[iy]     =  ps[0].y;
         verts[iz]     =  ps[0].z;
         verts[ix + 3] =  ps[1].x;
         verts[iy + 3] =  ps[1].y;
         verts[iz + 3] =  ps[1].z;
         verts[ix + 6] =  ps[3].x;
         verts[iy + 6] =  ps[3].y;
         verts[iz + 6] =  ps[3].z;

         norms[ix]     =  cr[3].x;
         norms[iy]     =  cr[3].y;
         norms[iz]     =  cr[3].z;
         norms[ix + 3] =  cr[4].x;
         norms[iy + 3] =  cr[4].y;
         norms[iz + 3] =  cr[4].z;
         norms[ix + 6] =  cr[5].x;
         norms[iy + 6] =  cr[5].y;
         norms[iz + 6] =  cr[5].z;

      }
   }


   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);


   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (shaderProgram, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);

   gl.drawArrays(gl.TRIANGLES, 0, ns * 3 + ns * 6 * (nh - 1));

};
document.addEventListener('DOMContentLoaded', func);
}