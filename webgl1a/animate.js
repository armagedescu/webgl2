{
let canvas = document.currentScript.parentElement;

class Animate1 extends GlVAObject
{
   #vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                 0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];
   #dt = 0;
   #timeOld = 0;
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

      this.translation = gl.getUniformLocation(this.program, 'translation');
   }
   set t(timeNew) { this.#dt = timeNew - this.#timeOld; }

   drawVao()
   {
      let gl = this.gl;

      let Tx = 0.5  * Math.cos(this.#dt*0.005);
      let Ty = 0.5 *  Math.sin(this.#dt*0.005);
      let Tz = 0.5 *  Math.sin(this.#dt*0.005);

      gl.uniform4f(this.translation, Tx, Ty, Tz, 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
   }
}

let func = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let animate1 = new Animate1(glCanvas.program);
   let gl = animate1.gl;

   let animate = (time) =>
   {
      animate1.useProgram ();
      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.enable(gl.DEPTH_TEST);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  animate1.t = time;
	  animate1.draw();

      window.requestAnimationFrame(animate);
   }
   animate(0);
};
document.addEventListener('DOMContentLoaded', func);
}