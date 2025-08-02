{
let canvas = document.currentScript.parentElement;

let func = () =>
{
   let shape = new GlShapev1 (canvas)
               .withVertices3d ([ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                                  0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ])
               .withTransnation4f (); //[0.5, 0.5, 0.0, 0.0]
   //shape.logStrategyShaders ("animate.js:");

   let gl = shape.gl;

   let animate = (time) =>
   {
      shape.bind();
      shape.translate4f (0.5 *  Math.cos(time * 0.005), 0.5 *  Math.sin(time * 0.005), 0.5 *  Math.sin(time * 0.005), 0.0);
      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.enable(gl.DEPTH_TEST);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      shape.drawTriangles();

      window.requestAnimationFrame(animate);
   }
   animate(0);
};
document.addEventListener('DOMContentLoaded', func);
}