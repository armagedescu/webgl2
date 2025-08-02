{
let canvas = document.currentScript.parentElement;

let func = () =>
{
   let triangle1 = new GlShapev1 (canvas)
               .withVertices3d ([ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0 ])
               .withTransnation4f ();
   //triangle1.logStrategyShaders ("animate2.js:");
   let triangle2 = new GlShapev1 (triangle1.gl)
               .withProgram (triangle1)
               .withVertices3d ([ 0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ])
               .withTransnation4f ();
   let gl = triangle1.gl;

   let animate = (time) =>
   {
      triangle1.bind();
      triangle1.translate4f (0.5 *  Math.cos(time * 0.005), 0.5 *  Math.sin(time * 0.005), 0.5 *  Math.sin(time * 0.005), 0.0);
      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.enable(gl.DEPTH_TEST);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      for (shape of [triangle1, triangle2])
         shape.drawTriangles ();

      window.requestAnimationFrame(animate);
   }
   animate(0);
};
document.addEventListener('DOMContentLoaded', func);
}