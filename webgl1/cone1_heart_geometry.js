{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let glProgram = glCanvas.glProgram;
   let gl = glProgram.gl;
   glProgram.useProgram ();
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);
   gl.clear (gl.COLOR_BUFFER_BIT);

   let nh = 3, ns = 100, dr = 1.0;
   if (ns & 1) ns++;

   let verts    = [];
   let norms    = [];

   for (let i = 0,   ix = 0, iy = 1, iz = 2;    i < ns; i++,     ix += 9,iy += 9,iz += 9)
   {
      dr      =  2 *  i      * (1/ns); // <-- increase from 0 to 2 (PI)
	  let drd =  2 * (i + 1) * (1/ns); // <-- increase from 0 to 2 (PI)
      if (dr  > 1) dr  = 2 - dr;  //<-- decrease when greater than PI
      if (drd > 1) drd = 2 - drd; //<-- decrease when greater than PI
	  let ps = [{x:0.0,                                             y:0.0,                                           z:(1.0)}, //<--points in direction of us
	            {x:(dr /nh) * Math.cos(2 * Math.PI *   i    / ns ), y:(dr /nh) * Math.sin(2 * Math.PI *  i    / ns), z:(1 - 1/nh)},
	            {x:(drd/nh) * Math.cos(2 * Math.PI *  (i+1) / ns ), y:(drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), z:(1 - 1/nh)}];
	  let cr = cross3v(ps[0], ps[1], ps[2]);
      verts[ix]     =  ps[0].x;
      verts[iy]     =  ps[0].y;
      verts[iz]     =  ps[0].z;
      verts[ix + 3] =  ps[1].x;
      verts[iy + 3] =  ps[1].y;
      verts[iz + 3] =  ps[1].z;
      verts[ix + 6] =  ps[2].x;
      verts[iy + 6] =  ps[2].y;
      verts[iz + 6] =  ps[2].z;

      norms[ix]     =  cr.x;
      norms[iy]     =  cr.y;
      norms[iz]     =  cr.z;
      norms[ix + 3] =  cr.x;
      norms[iy + 3] =  cr.y;
      norms[iz + 3] =  cr.z;
      norms[ix + 6] =  cr.x;
      norms[iy + 6] =  cr.y;
      norms[iz + 6] =  cr.z;
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

		  let ps = [{x: ( h   *dr /nh) * Math.cos(2 * Math.PI *  i   /ns), y:( h   *dr /nh) * Math.sin(2 * Math.PI *  i    / ns), z:1 -  h   *1/nh},  // 1  4
		            {x: ( h   *drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), y:( h   *drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), z:1 -  h   *1/nh},  //    6
		            {x: ((h+1)*dr /nh) * Math.cos(2 * Math.PI *  i   /ns), y:((h+1)*dr /nh) * Math.sin(2 * Math.PI *  i    / ns), z:1 - (h+1)*1/nh},  // 2
		            {x: ((h+1)*drd/nh) * Math.cos(2 * Math.PI * (i+1)/ns), y:((h+1)*drd/nh) * Math.sin(2 * Math.PI * (i+1) / ns), z:1 - (h+1)*1/nh}]; // 3  5

          let cr = cross3v(ps[0], ps[2], ps[3]);

          verts[ix]     =  ps[0].x;
          verts[iy]     =  ps[0].y;
          verts[iz]     =  ps[0].z;
          verts[ix + 3] =  ps[2].x;
          verts[iy + 3] =  ps[2].y;
          verts[iz + 3] =  ps[2].z;
          verts[ix + 6] =  ps[3].x;
          verts[iy + 6] =  ps[3].y;
          verts[iz + 6] =  ps[3].z;

          norms[ix]     =  cr.x;
          norms[iy]     =  cr.y;
          norms[iz]     =  cr.z;
          norms[ix + 3] =  cr.x;
          norms[iy + 3] =  cr.y;
          norms[iz + 3] =  cr.z;
          norms[ix + 6] =  cr.x;
          norms[iy + 6] =  cr.y;
          norms[iz + 6] =  cr.z;

		  ix += 9;iy += 9;iz += 9;
		  cr = cross3v(ps[0], ps[3], ps[1]);

          verts[ix]     =  ps[0].x;
          verts[iy]     =  ps[0].y;
          verts[iz]     =  ps[0].z;
          verts[ix + 3] =  ps[1].x;
          verts[iy + 3] =  ps[1].y;
          verts[iz + 3] =  ps[1].z;
          verts[ix + 6] =  ps[3].x;
          verts[iy + 6] =  ps[3].y;
          verts[iz + 6] =  ps[3].z;

          norms[ix]     =  cr.x;
          norms[iy]     =  cr.y;
          norms[iz]     =  cr.z;
          norms[ix + 3] =  cr.x;
          norms[iy + 3] =  cr.y;
          norms[iz + 3] =  cr.z;
          norms[ix + 6] =  cr.x;
          norms[iy + 6] =  cr.y;
          norms[iz + 6] =  cr.z;

      }
   }


   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (glProgram.program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);


   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (glProgram.program, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);

   gl.drawArrays(gl.TRIANGLES, 0, ns * 3 + ns * 6 * (nh - 1));

};
document.addEventListener('DOMContentLoaded', func);
}