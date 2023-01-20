{

class Translate extends GlVAObject
{
   #vertices =  [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                  0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];

   constructor(context)
   {
      if (context instanceof GlProgram)
        super(context);
      else
        throw "GlHeartCoat:GlSurface constructor: unknown context";
      this.init();
   }
   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#vertices));
      this.coord = this.vertex_buffer.attrib ("coordinates",  3, gl.FLOAT);

   }
   drawVao()
   {
      let gl = this.gl;
      gl.drawArrays(gl.TRIANGLES, 0, 6);
   }
}

let func = () =>
{
   let canvas = document.getElementById('translate');

   let glCanvas = new GlCanvas(canvas);
   let translate = new Translate(glCanvas.program);


   let prog = translate.program;
   let gl = translate.gl;
   translate.useProgram ();
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   translate.draw ();

};
document.addEventListener('DOMContentLoaded', func);
}