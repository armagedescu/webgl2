{
let canvas = document.currentScript.parentElement;

let func = () =>
{
   let shape = new GlShapev1 (canvas)
               .withVertices3d ([ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                                  0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ])
               .withStaticTranslation ([0.5, 0.5, 0.0, 0.0]);
   //shape.logStrategyShaders ("transltate.js:");
   let gl = shape.gl;
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable (gl.DEPTH_TEST);
   gl.clear  (gl.COLOR_BUFFER_BIT);
   shape.drawTriangles();
};

document.addEventListener('DOMContentLoaded', func);
}