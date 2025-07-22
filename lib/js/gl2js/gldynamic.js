"use strict";

//this is meant to generate shaders dynamically
//to be used in conjunction with glcanvas.js

class GlShape2Dv1
{
   #built = false;
   vertexShaderSource   = "#version 300 es";
   fragmentShaderSource = "#version 300 es";
   locationCount = 0;
   #vertices = null;
   constructor (canvas) {
      this.gl = canvas.getContext('webgl2');
   }
   set vertices (value) {
      if (value instanceof Array) value = new Float32Array(value);
      if (value instanceof Float32Array) this.#vertices = value;
      else throw new Exception ("type unknown for vertices");
   }
   buildProgram () {
      if (this.#built) return;
      //let locationCount = this.locationCount;
      if (this.#vertices)
      {
         this.vertexShaderSource += "\nlayout (location = " + this.locationCount + ") in vec2 coordinates;";
      }
      this.vertexShaderSource += "\nvoid main(void)" +
                      "\n{";
      if (this.#vertices)
      {
         this.vertexShaderSource += "\n   gl_Position = vec4(coordinates, 0.0, 1.0);";
      }
      this.vertexShaderSource   += "\n}\n";
      this.fragmentShaderSource +=
         "\nprecision mediump float;"                +
         "\nout vec4 outColor;"                      +
         "\nvoid main(void)"                         +
         "\n{"                                       +
         "\n   outColor = vec4(0.0, 0.0, 0.0, 0.1);" +
         "\n}\n";
      console.log (this.vertexShaderSource);
      console.log (this.fragmentShaderSource);

      let gl = this.gl;
      let vertexShader   = gl.createShader (gl.VERTEX_SHADER);
      gl.shaderSource  (vertexShader,   this.vertexShaderSource);
      gl.compileShader (vertexShader);
      let fragmentShader = gl.createShader (gl.FRAGMENT_SHADER);
      gl.shaderSource  (fragmentShader, this.fragmentShaderSource);
      gl.compileShader (fragmentShader);

      this.program = gl.createProgram ();
      gl.attachShader (this.program, vertexShader);
      gl.attachShader (this.program, fragmentShader);
      gl.linkProgram  (this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
         console.log("PROGRAM ERROR: " +  gl.getProgramInfoLog(this.program));
      this.#built = true;

      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      // Create a new buffer object
      let vertex_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.#vertices, gl.STATIC_DRAW);

      let coordAttribLocation = 0;
      gl.vertexAttribPointer     (coordAttribLocation, 2, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
      gl.enableVertexAttribArray (coordAttribLocation); //Enable the attribute

      gl.bindVertexArray (null);
      gl.useProgram (null);

   }
   drawTriangles () {
      //this.buildProgram ();
      let start = 0, vertsCount = this.#vertices.length / 2;
      this.drawArrays (this.gl.TRIANGLES, start, vertsCount);
   }
   drawArrays (drawType, start, vertsCount) {
      this.buildProgram ();
      let gl = this.gl;
      gl.useProgram       (this.program);
      gl.bindVertexArray  (this.vao);
      gl.drawArrays       (drawType, start, vertsCount);
   }
}
