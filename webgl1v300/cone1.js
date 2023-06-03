{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let gl = glCanvas.gl;
   glCanvas.useProgram ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   let nh = 1, ns = 20, dr = 0.6;

   let verts    = [];
   let norms    = [];
   for (let i = 0, ix = 0,iy = 1,iz = 2; i < ns; i++, ix += 9,iy += 9,iz += 9)
   {
       [verts[ix],     verts[iy],     verts[iz]]     = [0.0, 0.0, 0.7] ;//<-- tip of the cone, points to us
       [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = [dr * Math.cos(2 * Math.PI * i / ns),       dr * Math.sin(2 * Math.PI * i / ns),      0] ;
       [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = [dr * Math.cos(2 * Math.PI * (i+1) / ns),   dr * Math.sin(2 * Math.PI * (i+1) / ns),  0] ;

       [norms[ix],     norms[iy],     norms[iz]]     = [verts[ix + 3],   verts[iy + 3],  0.7] ;//<-- tip of the cone, points to us
       [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = [verts[ix + 3],   verts[iy + 3],  0.7] ;
       [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = [verts[ix + 6],   verts[iy + 6],  0.7] ;

   }
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);


   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (glCanvas.program, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);

   gl.drawArrays(gl.TRIANGLES, 0, ns * 3);

};
document.addEventListener('DOMContentLoaded', func);
}