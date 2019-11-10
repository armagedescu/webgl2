{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let prog = buildGlProgram(canvas);
   let gl = prog.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   let nh = 1, ns = 20, dnh = 0.2, dr = 1.0;

   let verts    = [];
   let norms    = [];
   let tgs = 0;
   for (let i = 0, ix = 0,iy = 1,iz = 2; i <= ns; i++, ix += 9,iy += 9,iz += 9)
   {
	   let p1 = {x:0.0,                                     y:0.0,                                     z:1.0}; //<--points in direction of us
	   let p2 = {x:dr * Math.cos(2 * Math.PI * i / ns),     y:dr * Math.sin(2 * Math.PI * i / ns),     z:0.0};
	   let p3 = {x:dr * Math.cos(2 * Math.PI * (i+1) / ns), y:dr * Math.sin(2 * Math.PI * (i+1) / ns), z:0.0};
	   let cr = cross3v(p1, p2, p3);
       verts[ix] = p1.x;
       verts[iy] = p1.y;
       verts[iz] = p1.z;
       verts[ix + 3] =  p2.x;
       verts[iy + 3] =  p2.y;
       verts[iz + 3] =  p2.z;
       verts[ix + 6] =  p3.x;
       verts[iy + 6] =  p3.y;
       verts[iz + 6] =  p3.z;
	
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
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

   let shaderProgram = prog.shaderProgram;
   let coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);


   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (shaderProgram, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);

   gl.drawArrays(gl.TRIANGLES, 0, ns * 3);

};
document.addEventListener('DOMContentLoaded', func);
}