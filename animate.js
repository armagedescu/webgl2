{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let gl;
   let prog = buildGlProgram(canvas);
   gl = prog.gl;
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);

   let vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   // Create a new buffer object
   let vertex_buffer = gl.createBuffer();

   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   var coord = gl.getAttribLocation (prog.shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord); //Enable the attribute
   /* ==========translation======================================*/
   var Tx = 0.5, Ty = 0.5, Tz = 0.0; //translation
   var translation = gl.getUniformLocation(prog.shaderProgram, 'translation');
 
   var time_old = 0;
   let animate = function(time)
   {

      var dt = time-time_old;
	  Tx = 0.5  * Math.cos(dt*0.005);
	  Ty = 0.5 *  Math.sin(dt*0.005);
	  Tz = 0.5 *  Math.sin(dt*0.005);

	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform4f(translation, Tx, Ty, Tz, 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      window.requestAnimationFrame(animate);
   }
   animate(0);
};
document.addEventListener('DOMContentLoaded', func);
}