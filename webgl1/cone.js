{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let prog = buildGlProgram(canvas);
   let gl   = prog.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   let nh = 1, ns = 16, dnh = 0.2, dr = 0.6;

   let verts    = [0.8,0.8,0];
   let indices  = [0];
   for (let i = 0, ix = 3,iy = 4,iz = 5; i <= ns; i++, ix += 3,iy += 3,iz += 3)
   {
       verts   [ix]    =   dr * Math.cos(2 * Math.PI * i / ns);
       verts   [iy]    =   dr * Math.sin(2 * Math.PI * i / ns);
       verts   [iz]    =   -1;//<-- tip of the cone
   }
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

   let shaderProgram = prog.shaderProgram;
   let coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);

   let norms    = [0.0, 0.0, 1.0];

   for (let i = 0, ix = 3,iy = 4,iz = 5; i <= ns; i++, ix += 3,iy += 3,iz += 3)
   {
       norms[ix] = 0;//verts[ix];
       norms[iy] = 1;//verts[iy];
       norms[iz] = 1;//verts[iz];
       //indices [i + 1] =  i + 1;
   }
   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (shaderProgram, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord)
   
   /* ==========translation======================================*/

   gl.drawArrays(gl.TRIANGLE_FAN, 0, ns + 2);


};
document.addEventListener('DOMContentLoaded', func);
}