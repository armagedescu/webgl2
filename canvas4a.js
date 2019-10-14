var func = () =>
{// https://www.khronos.org/webgl/wiki/Tutorial
   let canvas, gl;
   canvas = document.getElementById('mycanvas4a');
   gl = canvas.getContext('experimental-webgl');
   //gl = canvas.getContext('webgl');
   gl.clearColor(0.5, 0.5, 0.5, 0.9);              // Clear the canvas
   gl.enable(gl.DEPTH_TEST);                       // Enable the depth test
   //gl.clear (gl.COLOR_BUFFER_BIT);                 // Clear the color buffer bit
   gl.viewport(0, 0, canvas.width, canvas.height); // Set the view port

   var vertCode = 'attribute vec4 coordinates; //in js getAttribLocation \n' +
                  'void main(void)\n'+
                  '{\n' +
                  '   gl_Position = coordinates; //vec4(coordinates,  1.0);\n' +
                  '}';
   var vertShader = gl.createShader(gl.VERTEX_SHADER);  //Create a vertex shader object
   gl.shaderSource(vertShader, vertCode);  //Attach vertex shader source code
   gl.compileShader(vertShader);  //Compile the vertex shaderl
   var fragCode =  'void main(void)\n' +
                   '{\n' +
                   '   gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);\n' +
                   '}';
   var fragShader = gl.createShader(gl.FRAGMENT_SHADER); // Create fragment shader object
   gl.shaderSource(fragShader, fragCode); // Attach fragment shader source code
   gl.compileShader(fragShader);  // Compile the fragment shader
   // Create a shader program object to store combined shader program
   var shaderProgram = gl.createProgram();
   gl.attachShader (shaderProgram, vertShader);  // Attach a vertex shader
   gl.attachShader (shaderProgram, fragShader); // Attach a fragment shader
   gl.linkProgram  (shaderProgram); // Link both programs
   gl.useProgram   (shaderProgram); // Use the combined shader program object


   /* Step2: Define the geometry and store it in buffer objects */

   //var normals = [   2.0,  1.0,  0.8,     2.0,  1.0, 0.8,      2.0,  1.0, 0.8,
   //                 -1.0, -0.8, 0.36,    -1.0, -0.8, 0.36,    -1.0, -0.8, 0.36 ];
   //var normalBuffer = gl.createBuffer();
   //gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   ////gl.bindBuffer(gl.ARRAY_BUFFER, normals);
   //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

   // Create a new buffer object
   var vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];
   var vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   var coord = gl.getAttribLocation (shaderProgram, "coordinates"); //attribute vec4 coordinates           
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);    //point an attribute to the currently bound VBO
   gl.enableVertexAttribArray (coord); //Enable the attribute
   /* ==========translation======================================*/

   gl.drawArrays(gl.TRIANGLES, 0, 6);


};
document.addEventListener('DOMContentLoaded', func);