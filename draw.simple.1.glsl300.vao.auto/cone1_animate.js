"use strict";
{

let canvas = document.currentScript.parentElement;

class Cone1Animate1 extends GlVAObject
{
   #verts    = [];
   #norms    = [];
   #nh = null;
   #ns = null;
   #oldTime = 0;
   #dt = 0;
   constructor(context, nh = 1, ns = 5)
   {
      super(context);
      this.initGeometry(nh, ns);
      this.init();
   }
   initGeometry(nh, ns)
   {
      this.#nh = nh;
      this.#ns = ns;
      let  dr = 0.6;

      for (let i = 0, ix = 0,iy = 1,iz = 2; i < this.#ns; i++, ix += 9,iy += 9,iz += 9)
      {
          [this.#verts[ix],     this.#verts[iy],     this.#verts[iz]]     = [0.0, 0.0, -0.7] ;//<-- tip of the cone, points to us
          [this.#verts[ix + 3], this.#verts[iy + 3], this.#verts[iz + 3]] = [dr * Math.cos(2 * Math.PI * i / this.#ns),       dr * Math.sin(2 * Math.PI * i / this.#ns),      0] ;
          [this.#verts[ix + 6], this.#verts[iy + 6], this.#verts[iz + 6]] = [dr * Math.cos(2 * Math.PI * (i+1) / this.#ns),   dr * Math.sin(2 * Math.PI * (i+1) / this.#ns),  0] ;

          [this.#norms[ix],     this.#norms[iy],     this.#norms[iz]]     = [0, 0, 0] ;//<-- tip of the cone, points to us
          [this.#norms[ix + 3], this.#norms[iy + 3], this.#norms[iz + 3]] = [this.#verts[ix + 3],   this.#verts[iy + 3],  -0.7] ;
          [this.#norms[ix + 6], this.#norms[iy + 6], this.#norms[iz + 6]] = [this.#verts[ix + 6],   this.#verts[iy + 6],  -0.7] ;
      }

   }
   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.#verts));
      this.coord = this.vertex_buffer.attrib ("coordinates",  3, gl.FLOAT);

      this.norms_buffer  = this.arrayBuffer(new Float32Array(this.#norms));
      this.noord = this.norms_buffer.attrib  ("inputNormal", 3, gl.FLOAT);

      this.lightDirection = gl.getUniformLocation(this.program, 'lightDirection');
   }
   set t(t) { this.#dt = t - this.#oldTime; }
   drawVao()
   {
      let gl = this.gl;
      //this.#dt = 0;
      let lightx =  Math.cos (this.#dt * 0.002);
      let lighty =  Math.sin (this.#dt * 0.002);
      gl.uniform2f(this.lightDirection, lightx, lighty);
      //gl.uniform2fv(this.lightDirection, [Math.cos (0 * 0.002),  Math.sin (0 * 0.002)]);
      gl.drawArrays(gl.TRIANGLES, 0, this.#ns * 3);
   }
}
function getCone (nhe, nse, type = Float32Array)
{
   let nh = nhe;
   let ns = nse;
   let verts = []; //new Float32Array ();
   let norms = []; //new Float32Array ();
   let dr = 0.6;

   for (let i = 0, ix = 0,iy = 1,iz = 2; i < ns; i++, ix += 9,iy += 9,iz += 9)
   {
         //verts[ix] = 0.0; //<-- tip of the cone ???
         [verts[ix],     verts[iy],     verts[iz]]     = [0.0, 0.0, 0.7] ;//<-- tip of the cone, points to us
         [verts[ix + 3], verts[iy + 3], verts[iz + 3]] = [dr * Math.cos(2 * Math.PI * i     / ns),   dr * Math.sin(2 * Math.PI * i     / ns),  0.0] ;
         [verts[ix + 6], verts[iy + 6], verts[iz + 6]] = [dr * Math.cos(2 * Math.PI * (i+1) / ns),   dr * Math.sin(2 * Math.PI * (i+1) / ns),  0.0] ;

         [norms[ix],     norms[iy],     norms[iz]]     = [0, 0, 0] ;//<-- tip of the cone, points to us
         [norms[ix + 3], norms[iy + 3], norms[iz + 3]] = [verts[ix + 3],   verts[iy + 3],  -0.7] ; //z always points to us
         [norms[ix + 6], norms[iy + 6], norms[iz + 6]] = [verts[ix + 6],   verts[iy + 6],  -0.7] ; //z always points to us
   }
   return {verts:new type(verts), norms:new type(norms)};
}

let vs =
`
#version 300 es
layout (location = 0) in vec3 vertices;
layout (location = 1) in vec3 normals;
out vec3 normalsVary;
void main(void)
{
   gl_Position = vec4(vertices, 1);
   normalsVary=normals;
}`;


let fs = 
`
#version 300 es
precision mediump float;
out vec4 fragColor;
const vec4 constColor = vec4 (0.0, 1.0, 0.0, 1.0);
in  vec3 normalsVary;
const vec3 constLightDirection = vec3(1.0, 0.0, 1.0);
void main(void)
{
   float prod = -dot (normalize(constLightDirection),  normalize(normalsVary) );
   fragColor = vec4 (constColor.rgb * prod,  1.0);
}`;

let func = () =>
{
   let gl;
   let geo = getCone(1, 5);
   let shape = new GlShapev1 (canvas)
      .withConstColor ([0.0, 1.0, 0.0, 1.0])
      .withVertices3d (geo.verts)
      .withNormals3d  (geo.norms)
      .withConstLightDireciton ([Math.cos (0 * 0.002),  Math.sin (0 * 0.002), 1])
      .withShaderSources (vs, fs);
   gl = shape.gl;
   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   shape.logStrategyShaders ("cone1_animate.js");
   shape.drawTriangles ();
   return;

   let cone1Animate1 = new Cone1Animate1(canvas);  
   gl = cone1Animate1.gl;
   let animate = (time) =>
   {
      cone1Animate1.useProgram ();
      gl.clearColor(0.5, 0.5, 0.5, 0.9);
      gl.enable(gl.DEPTH_TEST);
      gl.clear (gl.COLOR_BUFFER_BIT);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      cone1Animate1.t = time;
      cone1Animate1.draw();

      window.requestAnimationFrame(animate);
   }
   animate(0);

};
document.addEventListener('DOMContentLoaded', func);
}