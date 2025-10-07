{
let canvas = document.currentScript.parentElement;

let glmain = () =>
{
   let shape = new GlShapev1 (canvas)
      .withConstColor ([0.0, 1.0, 0.0, 1.0])
      .withVertices3d (
            [  0.0, 0.0, 0.0,   -1.0,  0.4,  2.0,    -0.5, -0.3,  2.0,
               0.0, 0.0, 0.0,    0.6, -0.3,  2.0,     0.4,  0.3, -0.0 ])
      .withNormals3d  (
            [ 1.0,  1.0, -1.0,   1.0, 1.0, -1.0,     1.0,  1.0, -1.0,
              1.0,  0.0, -1.0,   1.0, 0.0, -1.0,     1.0,  0.0, -1.0  ]);
   //shape.logStrategyShaders ("normals_and_colors_2progs.js shape normals");

   let shape2 = new GlShapev1 (canvas)
      .withVertices3d (
            [ 0.0, 0.0, 0.0,   -0.3, -0.5,  2.0,     0.5, -0.6,  2.0,
              0.0, 0.0, 0.0,    0.3,  0.4,  2.0,    -0.5,  0.6, -0.0  ])
      //.withColors4d  (
      //      [  0.0, 1.0, 0.0, 1.0,      0.0, 1.0, 0.0, 1.0,       0.0, 1.0, 0.0, 1.0,
      //         1.0, 0.0, 0.0, 1.0,      1.0, 0.0, 0.0, 1.0,       1.0, 0.0, 0.0, 1.0 ]);
      .withColors3d  (
            [  0.0, 1.0, 0.0,      0.0, 1.0, 0.0,      0.0, 1.0, 0.0,
               1.0, 0.0, 0.0,      1.0, 0.0, 0.0,      1.0, 0.0, 0.0]);
   //shape2.logStrategyShaders("normals_and_colors_2progs.js shape2 colors");

   let gl = shape.gl;
   gl.clearColor (0.5, 0.5, 0.5, 0.9);
   gl.enable (gl.DEPTH_TEST);
   gl.clear  (gl.COLOR_BUFFER_BIT);
   
   shape.drawTriangles  (); //full bind here
   shape2.drawTriangles (); //full bind here
};
document.addEventListener('DOMContentLoaded', glmain);
}