{
let canvas = document.currentScript.parentElement;

let func = () =>
{
   let shape = new GlShapev1 (canvas).withVertices2d(
                     [ 0.0, -0.5,   -0.5, 0.3,   -0.5, -0.6,
                       0.0, -0.5,    0.8, 0.4,   -0.4,  0.5 ]);

   let gl = shape.gl;
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   shape.drawTriangles();
};

document.addEventListener('DOMContentLoaded', func);
}