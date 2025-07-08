{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let glCanvas  = new GlCanvas(canvas);
   let gl        = glCanvas.gl;

   const [tipvert, tipnorm] = [[0.8, 0.8, 0.0],  [0.0, 0.0, 1.0]], norm = [0, 1, 1];
   let [verts, norms]      = [tipvert, tipnorm];

   const ns = 16, dr = 0.6; //number of sectors and radius
   for (let i = 0, ix = 3, iy = 4, iz = 5;   i <= ns;   i++, ix += 3, iy += 3, iz += 3)
   {
      [verts [ix], verts [iy], verts [iz],  norms [ix], norms [iy], norms [iz]] =
         [... sect2coord (dr, i / ns), -1,          ...norm]; //z = -1, directed away from us
   }

   //initialize buffers
   glCanvas.useProgram ();
   let vertexBuffer = gl.createBuffer ();
   gl.bindBuffer (gl.ARRAY_BUFFER, vertexBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (verts), gl.STATIC_DRAW);

   gl.vertexAttribPointer     (0, 3, gl.FLOAT, false, 0, 0); //0 = gl.getAttribLocation (program, "coordinates")
   gl.enableVertexAttribArray (0);

   let normalBuffer = gl.createBuffer ();
   gl.bindBuffer (gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (norms), gl.STATIC_DRAW);

   gl.vertexAttribPointer     (1, 3, gl.FLOAT, false, 0, 0); //1 = gl.getAttribLocation (program, "inputNormal")
   gl.enableVertexAttribArray (1);

   //draw triangle fan
   gl.clearColor (0.5, 0.5, 0.5, 0.9);
   gl.enable     (gl.DEPTH_TEST);
   gl.clear      (gl.COLOR_BUFFER_BIT);

   gl.drawArrays(gl.TRIANGLE_FAN, 0, ns + 2);
};
document.addEventListener('DOMContentLoaded', func);
}