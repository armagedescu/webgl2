{
let canvas = document.currentScript.parentElement;
var func = () =>
{
   let gl;
   let prog = buildGlProgram(canvas);
   gl = prog.gl;
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   var vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   var vertex_buffer = gl.createBuffer();

   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   var coord = gl.getAttribLocation (prog.shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);
   //var Tx = 0.5, Ty = 0.5, Tz = 0.0;
   let translation = gl.getUniformLocation(prog.shaderProgram, 'translation');

   var time_old = 0;
   let animate = function(time)
   {

      let dt = time - time_old;
      let Tx = 0.5  * Math.cos(dt*0.005);
      let Ty = 0.5 *  Math.sin(dt*0.005);
      let Tz = 0.5 *  Math.sin(dt*0.005);

      gl.uniform3f(translation, Tx, Ty, Tz);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      window.requestAnimationFrame(animate);
   }
   animate(0);
};
document.addEventListener('DOMContentLoaded', func);
}