{
let canvas = document.currentScript.parentElement;

function buildGeometry ()
{
   let vertices  = [ 0.5, -0.5,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
   ////to be changed to
   //let vertices  = [ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
   let indices   = [0, 1, 2, 0, 2, 3];
   return {verts:new Float32Array (vertices), indices: new Uint32Array(indices)};
}

let glmain = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let gl = glCanvas.gl;

   let geometry = buildGeometry();
   glCanvas.useProgram ();
   // Create a new buffer object
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, geometry.verts, gl.STATIC_DRAW);
   let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   gl.vertexAttribPointer     (coord, 2, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
   gl.enableVertexAttribArray (coord); //Enable the attribute

   let idxBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   gl.drawElements (gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_INT, 0);

};
document.addEventListener('DOMContentLoaded', glmain);
}