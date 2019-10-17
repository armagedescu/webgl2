{
let canvas = document.currentScript.parentElement;
var func = () =>
{
   let gl;
   let prog = buildGlProgram(canvas);
   gl = prog.gl; //canvas.getContext('experimental-webgl');
   //gl = canvas.getContext('webgl');
   gl.clearColor(0.5, 0.5, 0.5, 0.9);              // Clear the canvas
   gl.enable(gl.DEPTH_TEST);                       // Enable the depth test
   gl.clear (gl.COLOR_BUFFER_BIT);                 // Clear the color buffer bit
   //gl.viewport(0, 0, canvas.width, canvas.height); // Set the view port
   //
   //var vertCode = 'attribute vec4 coordinates; //in js getAttribLocation \n' +
   //               'uniform   vec4 translation; //in js getUniformLocation \n' +
   //               'void main(void)\n'+
   //               '{\n' +
   //               '   gl_Position = coordinates + translation;\n' +
   //               '}';
   //var vertShader = gl.createShader(gl.VERTEX_SHADER);  //Create a vertex shader object
   //gl.shaderSource(vertShader, vertCode);  //Attach vertex shader source code
   //gl.compileShader(vertShader);  //Compile the vertex shaderl
   //var fragCode =  'void main(void)\n' +
   //                '{\n' +
   //                '   gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);\n' +
   //                '}';
   //var fragShader = gl.createShader(gl.FRAGMENT_SHADER); // Create fragment shader object
   //gl.shaderSource(fragShader, fragCode); // Attach fragment shader source code
   //gl.compileShader(fragShader);  // Compile the fragment shader
   //// Create a shader program object to store combined shader program
   //var shaderProgram = gl.createProgram();
   //gl.attachShader (shaderProgram, vertShader);  // Attach a vertex shader
   //gl.attachShader (shaderProgram, fragShader); // Attach a fragment shader
   //gl.linkProgram  (shaderProgram); // Link both programs
   //gl.useProgram   (shaderProgram); // Use the combined shader program object


   /* Step2: Define the geometry and store it in buffer objects */

   var vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   // Create a new buffer object
   var vertex_buffer = gl.createBuffer();

   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   var coord = gl.getAttribLocation (prog.shaderProgram, "coordinates"); //Get the attribute location            
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);    //point an attribute to the currently bound VBO
   gl.enableVertexAttribArray (coord); //Enable the attribute
   /* ==========translation======================================*/
   var Tx = 0.5, Ty = 0.5, Tz = 0.0; //translation
   var translation = gl.getUniformLocation(prog.shaderProgram, 'translation');

   var time_old = 0;
   let animate = function(time)
   {

      var dt = time - time_old;
	  Tx = 0.5  * Math.cos(dt*0.005);
	  Ty = 0.5 *  Math.sin(dt*0.005);
	  Tz = 0.5 *  Math.sin(dt*0.005);

	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform4f(translation, Tx, Ty, Tz, 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      //gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      window.requestAnimationFrame(animate);
   }
   animate(0);
};
document.addEventListener('DOMContentLoaded', func);
}