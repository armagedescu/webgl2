var func = () =>
{
   let canvas, gl;
   canvas = document.getElementById('mycanvas3');
   let prog = buildGlProgram(canvas);
   gl = prog.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   //gl.viewport(0, 0, canvas.width, canvas.height);

   shaderProgram = prog.shaderProgram;

   var vertices = [ 0.0, -0.5,   -0.5, 0.3,   -0.5, -0.6,
                    0.0, -0.5,    0.8, 0.4,   -0.4,  0.5];

   // Create a new buffer object
   var vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   var coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 2, gl.FLOAT, false, 0, 0);    //point an attribute to the currently bound VBO
   gl.enableVertexAttribArray (coord); //Enable the attribute

   gl.drawArrays(gl.TRIANGLES, 0, 6);
   // gl.POINTS gl.TRIANGLE_STRIP gl.LINE_STRIP gl.LINE_LOOP gl.TRIANGLE_FAN

};
document.addEventListener('DOMContentLoaded', func);