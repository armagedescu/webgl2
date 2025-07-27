{
let canvas = document.currentScript.parentElement;

class Normals extends GlVAObject
{
   //system is left handed
   #vertices = [ 0.0,  0.0,  0.0,  -1.0, 0.4, -2.0,   -0.5, -0.6, -2.0,
                 0.0,  0.0,  0.0,   0.4, 0.4, -2.0,   -0.4,  0.5,  0.0  ];
   #normals =  [ 1.0,  1.0, -1.0,   1.0, 1.0, -1.0,    1.0,  1.0, -1.0,
                 1.0,  0.0, -1.0,   1.0, 0.0, -1.0,    1.0,  0.0, -1.0  ];
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
      this.coord = this.vertex_buffer.attrib ("coordinates", 3, gl.FLOAT);

      this.color_buffer  = this.arrayBuffer(new Float32Array(this.#normals));
      this.color = this.color_buffer.attrib  ("inputNormal", 3, gl.FLOAT);
   }
   drawVao()
   {
      let gl = this.gl;
      gl.drawArrays(gl.TRIANGLES, 0, 6);
   }
}

let func = () =>
{
   let normals = new Normals(canvas);
   let gl = normals.gl;
   normals.useProgram ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   normals.draw();
};
document.addEventListener('DOMContentLoaded', func);
}