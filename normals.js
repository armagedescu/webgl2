{
let canvas = document.currentScript.parentElement;
let func = () =>
{// https://www.khronos.org/webgl/wiki/Tutorial
 //https://www.mathematik.uni-marburg.de/~thormae/lectures/graphics1/code/WebGLShaderNormalTrans/ShaderNormalTrans.html
   let gl;

   let prog = buildGlProgram(canvas);
   gl = prog.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   /* Step2: Define the geometry and store it in buffer objects */

   let vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   let shaderProgram = prog.shaderProgram;
   let coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);

   let normals = [
                    //1,  1,  1,    1,  1,  1,    1,  1,  1,               
                       1,    1,     1,      -1,   -1,    1,    1,  1,  1,               
					-2.0, -1.0,  -0.8,     2.0,  1.0,  0.8,
                    -1.0, -0.8,  0.36,    -1.0, -0.8, 0.36,    -1.0, -0.8, 0.36 
				 ];
   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   ////gl.bindBuffer(gl.ARRAY_BUFFER, normals);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (shaderProgram, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord)
   
   /* ==========translation======================================*/

   gl.drawArrays(gl.TRIANGLES, 0, 6);


};
document.addEventListener('DOMContentLoaded', func);
}