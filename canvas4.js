var func = () =>
{
	let canvas, gl;
	
	         /*=================Creating a canvas=========================*/
         canvas = document.getElementById('mycanvas4');
         gl = canvas.getContext('experimental-webgl'); 
		          gl.clearColor(0.5, 0.5, 0.5, 0.9);
         gl.enable(gl.DEPTH_TEST);
   
         gl.clear(gl.COLOR_BUFFER_BIT);
         gl.viewport(0,0,canvas.width,canvas.height);
 
         /*===========Defining and storing the geometry==============*/
		//	
         //// Pass the buffer data
         //gl.bindBuffer(gl.ARRAY_BUFFER, null);  
         //   
         ///*========================Shaders============================*/
            
         //vertex shader source code 
         var vertCode =
            'attribute vec4 coordinates;' + 
            'uniform vec4 translation;'+
            'void main(void) {' +
               '  gl_Position = coordinates + translation;' +
            '}';
            
         //Create a vertex shader program object and compile it              
         var vertShader = gl.createShader(gl.VERTEX_SHADER);
         gl.shaderSource(vertShader, vertCode);
         gl.compileShader(vertShader);
            
   
         //fragment shader source code
         var fragCode =
            'void main(void) {' +
               '   gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);' +
            '}';

         //Create a fragment shader program object and compile it            
         var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
         gl.shaderSource(fragShader, fragCode);
         gl.compileShader(fragShader);
            
         //Create and use combiened shader program
         var shaderProgram = gl.createProgram();
         gl.attachShader(shaderProgram, vertShader);
         gl.attachShader(shaderProgram, fragShader);
         gl.linkProgram(shaderProgram);
   
         gl.useProgram(shaderProgram);
   
         /* ===========Associating shaders to buffer objects============*/
      
         //gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);    
         var coordinatesVar = gl.getAttribLocation(shaderProgram, "coordinates");
         var vertices = [
            -0.5,0.5,0.0, 	
            -0.5,-0.5,0.0, 	
            0.5,-0.5,0.0,   
         ];
            
        //Create an empty buffer object and store vertex data            
        var vertex_buffer = gl.createBuffer(); 
		
        //Create a new buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);   
		
        //bind it to the current buffer			
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); 

         gl.vertexAttribPointer(coordinatesVar, 3, gl.FLOAT, false, 0, 0);   
         gl.enableVertexAttribArray(coordinatesVar); 
   
         /* ==========translation======================================*/
         var Tx = 0.5, Ty = 0.5, Tz = 0.0;
         var translation = gl.getUniformLocation(shaderProgram, 'translation');
         gl.uniform4f(translation, Tx, Ty, Tz, 0.0);
 
         /*=================Drawing the riangle and transforming it========================*/ 

         gl.drawArrays(gl.TRIANGLES, 0, 3);
	return;
   canvas = document.getElementById('mycanvas4');
   gl = canvas.getContext('experimental-webgl');
   //gl = canvas.getContext('webgl');
   gl.clearColor(0.5, 0.5, 0.5, 0.9);              // Clear the canvas
   gl.enable(gl.DEPTH_TEST);                       // Enable the depth test
   gl.clear (gl.COLOR_BUFFER_BIT);                 // Clear the color buffer bit
   gl.viewport(0, 0, canvas.width, canvas.height); // Set the view port

   /* Step3: Create and compile Shader programs */
   // Vertex shader source code
   var vertCode = 'attribute vec4 coordinates;\n' +
                  'attribute vec4 translation;\n' +
                  'void main(void)\n'+
                  '{\n' +
                  '//   gl_Position = vec4(coordinates, 0.0, 1.0);\n' + // [0, 0] = center
                  '   gl_Position = coordinates + translation;\n' + // [0, 0] = center
				  '   //gl_PointSize = 10.0;\n' +
                  '}';
   var vertShader = gl.createShader(gl.VERTEX_SHADER);  //Create a vertex shader object
   gl.shaderSource(vertShader, vertCode);  //Attach vertex shader source code
   gl.compileShader(vertShader);  //Compile the vertex shaderl
   //Fragment shader source code
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

   var vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.8, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   // Create a new buffer object
   var vertex_buffer = gl.createBuffer();

   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   var coord = gl.getAttribLocation (shaderProgram, "coordinates"); //Get the attribute location            
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
   gl.enableVertexAttribArray (coord); //Enable the attribute
            /* ==========translation======================================*/
         var Tx = 0.5, Ty = 0.5, Tz = 0.0;
         var translation = gl.getUniformLocation(shaderProgram, 'translation');
         gl.uniform4f(translation, Tx, Ty, Tz, 0.0);
   /* Step5: Drawing the required object (triangle) */
   gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw the triangle
   //gl.drawArrays(gl.POINTS, 0, 6); // Draw the triangle
   //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6); // Draw the triangle
   //gl.drawArrays(gl.LINE_STRIP, 0, 6); // Draw the triangle
   //gl.drawArrays(gl.LINE_LOOP, 0, 6); // Draw the triangle
   //gl.drawArrays(gl.TRIANGLE_FAN, 0, 6); // Draw the triangle
};
document.addEventListener('DOMContentLoaded', func);