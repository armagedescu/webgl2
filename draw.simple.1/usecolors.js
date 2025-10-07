{
let canvas = document.currentScript.parentElement;


function buildGeometry ()
{
   return   {  verts: new Float32Array (
                  [  0.0, 0.0, 0.0,          -1.0, 0.4, -1.0,          -0.5, -0.6,  -1.0, // -1.0, 0.4, 2.0,  -0.5, -0.6,  2.0,
                     0.0, 0.0, 0.0,           0.4, 0.4,  2.0,          -0.4,  0.5,  -0.0  ]),
               colors: new Float32Array (
                  [  0.0, 1.0, 0.0, 1.0,      0.0, 1.0, 0.0, 1.0,       0.0, 1.0, 0.0, 1.0,
                     1.0, 0.0, 0.0, 1.0,      1.0, 0.0, 0.0, 1.0,       1.0, 0.0, 0.0, 1.0]  )
            };
}


let glmain = () =>
{
   let glCanvas  = new GlCanvas(canvas);
   let gl = glCanvas.gl;

   let geometry = buildGeometry ();


   glCanvas.useProgram   ();
   // Create a new buffer object
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, geometry.verts, gl.STATIC_DRAW);
   let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);


   let colorBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (glCanvas.program, "forFragColor");
   gl.vertexAttribPointer     (noord, 4, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord)


   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear(gl.COLOR_BUFFER_BIT);// | gl.DEPTH_BUFFER_BIT);
   gl.drawArrays(gl.TRIANGLES, 0, geometry.verts.length / 3);


};
document.addEventListener('DOMContentLoaded', glmain);
}