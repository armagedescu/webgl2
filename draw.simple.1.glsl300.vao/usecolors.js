{
let canvas = document.currentScript.parentElement;

class UseColors extends GlVAObject
{
   #vertices = [ 0.0, 0.0, 0.0,    -1.0, 0.4, -1.0,   -0.5, -0.6,  -1.0,   // -1.0, 0.4, 2.0,  -0.5, -0.6,  2.0,
                 0.0, 0.0, 0.0,     0.4, 0.4,  2.0,   -0.4,  0.5,  -0.0  ];
   #colors   = [ 0.0, 1.0, 0.0, 1.0,      0.0, 1.0, 0.0, 1.0,       0.0, 1.0, 0.0, 1.0,
                 1.0, 0.0, 0.0, 1.0,      1.0, 0.0, 0.0, 1.0,       1.0, 0.0, 0.0, 1.0];
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
      this.coord = this.vertex_buffer.attrib ("coordinates",  3, gl.FLOAT);

      this.color_buffer  = this.arrayBuffer(new Float32Array(this.#colors));
      this.color = this.color_buffer.attrib  ("forFragColor", 4, gl.FLOAT);
   }
   drawVao()
   {
      let gl = this.gl;
      gl.drawArrays(gl.TRIANGLES, 0, this.#vertices.length / 3);
   }
}

let glmain = () =>
{
   let useColors = new UseColors (canvas);
   let gl = useColors.gl;
   useColors.useProgram();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT); // Clear the color buffer bit

   useColors.draw();
};
document.addEventListener('DOMContentLoaded', glmain);
}