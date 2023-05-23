{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let glCanvas  = new GlCanvas(canvas);
   let glProgram = glCanvas.glProgram;
   let gl = glCanvas.gl;
   glProgram.useProgram   ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   let nh = 1, ns = 16, dnh = 0.2, dr = 0.6;

   let verts    = [0.8, 0.8, 0];
   let norms    = [0, 0, 0];//[0.0, 0.0, 1.0];
   for (let i = 0, ix = 3,iy = 4,iz = 5; i <= ns; i++, ix += 3,iy += 3,iz += 3)
   {
       [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * i / ns),   dr * Math.sin(2 * Math.PI * i / ns),   -1];
       [norms [ix], norms [iy], norms [iz]] = [0, 1, 1];
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
   gl.enableVertexAttribArray (noord)
   
   /* ==========translation======================================*/

   gl.drawArrays(gl.TRIANGLE_FAN, 0, ns + 2);


};
document.addEventListener('DOMContentLoaded', func);
}