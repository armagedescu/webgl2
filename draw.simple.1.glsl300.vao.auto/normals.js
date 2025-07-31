{
let canvas = document.currentScript.parentElement;
let func = () =>
{
   let shape = new GlShapev1 (canvas)
         .withConstColor ([0.0, 1.0, 0.0, 1.0])
         .withVertices3d (
               [ 0.0,  0.0,  0.0,  -1.0, 0.4, -2.0,   -0.5, -0.6, -2.0,
                 0.0,  0.0,  0.0,   0.4, 0.4, -2.0,   -0.4,  0.5,  0.0  ])
         .withNormals3d  (
               [ 1.0,  1.0, -1.0,   1.0, 1.0, -1.0,    1.0,  1.0, -1.0,
                 1.0,  0.0, -1.0,   1.0, 0.0, -1.0,    1.0,  0.0, -1.0  ]);
   //shape.logStrategyShaders ("normals.js");
   let gl = shape.gl;
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   shape.drawTriangles();
};
document.addEventListener('DOMContentLoaded', func);
}