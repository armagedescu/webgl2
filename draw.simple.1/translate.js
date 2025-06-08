{
let func = () =>
{
   let canvas = document.getElementById('translate');

   let glCanvas = new GlCanvas(canvas);
   let gl = glCanvas.gl;
   glCanvas.useProgram ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   let vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                    0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (glCanvas.program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);

   gl.drawArrays(gl.TRIANGLES, 0, 6);


};
document.addEventListener('DOMContentLoaded', func);
}