{
let canvas = document.currentScript.parentElement;
let func = () =>
{

   let prog = buildGlProgram(canvas);
   let gl = prog.gl;
   let shaderProgram = prog.shaderProgram;
   gl.useProgram   (shaderProgram);

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   //gl.clear (gl.COLOR_BUFFER_BIT); // Clear the color buffer bit

   let vertices = [ 0.0, 0.0, 0.0,    -1.0, 0.4, -1.0,   -0.5, -0.6,  -1.0,// -1.0, 0.4, 2.0,  -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,     0.4, 0.4,  2.0,   -0.4,  0.5,  -0.0  ];
   // Create a new buffer object
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);
   /* ==========translation======================================*/

   let colors = [ 0.0, 1.0, 0.0, 1.0,      0.0, 1.0, 0.0, 1.0,       0.0, 1.0, 0.0, 1.0,
                  1.0, 0.0, 0.0, 1.0,      1.0, 0.0, 0.0, 1.0,       1.0, 0.0, 0.0, 1.0];
   //let colors = [ 0.0, 1.0, 0.0,      0.0, 1.0, 0.0,       0.0, 1.0, 0.0,
   //               1.0, 0.0, 0.0,      1.0, 0.0, 0.0,       1.0, 0.0, 0.0];
   let colorBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (shaderProgram, "forFragColor");
   gl.vertexAttribPointer     (noord, 4, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord)

   gl.clear(gl.COLOR_BUFFER_BIT);// | gl.DEPTH_BUFFER_BIT);
   //gl.uniform4f(translation, Tx, Ty, Tz, 0.0);
   gl.drawArrays(gl.TRIANGLES, 0, 6);


};
document.addEventListener('DOMContentLoaded', func);
}