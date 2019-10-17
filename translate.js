var func = () =>
{
   let canvas, gl;
   canvas = document.getElementById('translate');
   
   let prog = buildGlProgram(canvas);
   gl = prog.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   //gl.clear (gl.COLOR_BUFFER_BIT); // Clear the color buffer bit

   var vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   // Create a new buffer object
   var vertex_buffer = gl.createBuffer();

   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   let shaderProgram = prog.shaderProgram;
   var coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);
   /* ==========translation======================================*/
   var Tx = 0.5, Ty = 0.5, Tz = 0.0; //translation
   var translation = gl.getUniformLocation(shaderProgram, 'translation');  //uniform   vec4 translation

   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   gl.uniform4f(translation, Tx, Ty, Tz, 0.0);
   gl.drawArrays(gl.TRIANGLES, 0, 6);


};
document.addEventListener('DOMContentLoaded', func);