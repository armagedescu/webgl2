{
let canvas = document.currentScript.parentElement;

class Animate extends GlVAObject
{
   #vertices = [ 0.0, 0.0, 0.0,  -1.0, 0.4, 2.0,   -0.5, -0.6,  2.0,
                 0.0, 0.0, 0.0,   0.4, 0.4, 2.0,   -0.4,  0.5, -0.0  ];
   #dt = 0;
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

      this.translation = gl.getUniformLocation(this.program, 'translation');
   }
   set t(timeNew) { this.#dt = timeNew; }

   drawVao()
   {
      let gl = this.gl;

      let fi = this.#dt * 0.005;
	  let t = [0.5 *  Math.cos(fi),  0.5 *  Math.sin(fi),  0.5 *  Math.sin(fi)];

      gl.uniform3f(this.translation, ... t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
   }
}

let glmain = () =>
{
   let animate = new Animate(canvas);
   let gl = animate.gl;

   let animateMain = (time) =>
   {
      animate.useProgram ();
      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.enable(gl.DEPTH_TEST);
      gl.clear (gl.COLOR_BUFFER_BIT);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      animate.t = time;
	  animate.draw();

      window.requestAnimationFrame(animateMain);
   }
   animateMain(0);
};
document.addEventListener('DOMContentLoaded', glmain);
}