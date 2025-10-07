
class SimpleDraw extends GlVAObject
{
   #vertices = [ 0.0, -0.5,   -0.5, 0.3,   -0.5, -0.6,
                 0.0, -0.5,    0.8, 0.4,   -0.4,  0.5];
   constructor(context)
   {
      super(context);
      this.init();
   }
   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#vertices));
      this.coord = this.vertex_buffer.attrib ("coordinates", 2, gl.FLOAT);
   }
   drawVao()
   {
      let gl = this.gl;
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      // gl.POINTS gl.TRIANGLE_STRIP gl.LINE_STRIP gl.LINE_LOOP gl.TRIANGLE_FAN
   }
}

let glmain = () =>
{
   let simpleDraw = new SimpleDraw('draw');
   let gl = simpleDraw.gl;
   simpleDraw.useProgram ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   simpleDraw.draw();
};
document.addEventListener('DOMContentLoaded', glmain);