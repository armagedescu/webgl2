{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let glCanvas = new GlCanvas('draw');
   let gl = glCanvas.gl;



   let vertices = new Float32Array([ 0.0, -0.5,   -0.5, 0.3,   -0.5, -0.6,
                                     0.0, -0.5,    0.8, 0.4,   -0.4,  0.5 ]);

   glCanvas.useProgram ();

   // Create a new buffer object
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   gl.vertexAttribPointer     (coord, 2, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
   gl.enableVertexAttribArray (coord); //Enable the attribute

   glCanvas.useProgram ();
   gl.clearColor (0.5, 0.5, 0.5, 0.9);
   gl.enable     (gl.DEPTH_TEST);
   gl.clear      (gl.COLOR_BUFFER_BIT);

   gl.drawArrays (gl.TRIANGLES, 0, 6);
   // gl.POINTS gl.TRIANGLE_STRIP gl.LINE_STRIP gl.LINE_LOOP gl.TRIANGLE_FAN

};
document.addEventListener('DOMContentLoaded', func);
}