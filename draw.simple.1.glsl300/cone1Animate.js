{
let canvas = document.currentScript.parentElement;


function getCone (nhe, nse, type = Float32Array)
{
   let nh = nhe;
   let ns = nse;
   let verts = [];
   let norms = [];
   let dr = 0.6;

   for (let i = 0, ix = 0,iy = 1,iz = 2; i < ns; i++, ix += 9,iy += 9,iz += 9)
   {
         //verts[ix] = 0.0; //<-- tip of the cone ???
         [verts[ix],     verts[iy],     verts[iz]]     = [0.0, 0.0, -0.7] ;//<-- tip of the cone, points to us
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = [dr * Math.cos(2 * Math.PI * i     / ns),   dr * Math.sin(2 * Math.PI * i     / ns),  0.0] ;
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = [dr * Math.cos(2 * Math.PI * (i+1) / ns),   dr * Math.sin(2 * Math.PI * (i+1) / ns),  0.0] ;

         [norms[ix],     norms[iy],     norms[iz]]     = [0, 0, 0] ;//<-- tip of the cone, points to us
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = [verts[ix + 3],   verts[iy + 3],  -0.7] ; //z always points to us
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = [verts[ix + 6],   verts[iy + 6],  -0.7] ; //z always points to us
   }
   return {verts:new type(verts), norms:new type(norms)};
}

let glmain = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let gl = glCanvas.gl;

   let nh = 1, ns = 5, dr = 0.6;
   let geometry = getCone (nh, ns);

   glCanvas.useProgram ();
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, geometry.verts, gl.STATIC_DRAW);
   gl.vertexAttribPointer     (0, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (0);

   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, geometry.norms, gl.STATIC_DRAW);
   gl.vertexAttribPointer     (1, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (1);
   

   let lightDirection = gl.getUniformLocation(glCanvas.program, 'lightDirection');

   let animate = (time) =>
   {
      glCanvas.useProgram ();
      
      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      //gl.enable(gl.DEPTH_TEST);
      gl.clear (gl.COLOR_BUFFER_BIT);

      gl.uniform3fv(lightDirection, [Math.cos (time * 0.002),  Math.sin (time * 0.002), 1]); //<-- change direction of light

      //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, geometry.verts.length / 3);

      window.requestAnimationFrame(animate);
   }
   animate(0);

};
document.addEventListener('DOMContentLoaded', glmain);
}