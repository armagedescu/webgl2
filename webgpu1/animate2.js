{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let glCanvas  = new GlCanvas (canvas);
   let gl = glCanvas.gl;
   glCanvas.useProgram ();

   let vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   let vertex_buffer = gl.createBuffer ();

   gl.bindBuffer (gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);

   let translation = gl.getUniformLocation (glCanvas.program, 'translation');

   let time_old = 0;
   let animateMain = (time) =>
   {
      let dt = time - time_old;

      glCanvas.useProgram ();
      gl.clearColor (0.5, 0.5, 0.5, 0.9);
      gl.enable (gl.DEPTH_TEST);
      gl.clear  (gl.COLOR_BUFFER_BIT);

	  let fi = dt * 0.005;
	  let t = [0.5 *  Math.cos(fi),  0.5 *  Math.sin(fi),  0.5 *  Math.sin(fi)]
      gl.uniform3f (translation, ... t);

      gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays (gl.TRIANGLES, 0, 6);

      window.requestAnimationFrame (animateMain);
   }
   animateMain(0);
};
document.addEventListener ('DOMContentLoaded', func);
}