"use strict";

//this is meant to generate shaders dynamically
//to be used in conjunction with:
//                                glmath.js
//                                glcanvas.js


class ShaderGLSL300SourceBuilder {
   #headStart   = "#version 300 es";
   #headDefs    = [];
   #mainDefs    = [];
   #mainStart   = "void main(void)\n" +
                  "{";
   #mainEnd     = "}\n";
   source = "";

   constructor(){}

   addHead    (str) { this.#headDefs.push    (... ArrayUtil.toArray(str)); }
   addMain    (str) { this.#mainDefs.push    (... ArrayUtil.toArray(str)); }
   insertHead (str) { this.#headDefs.unshift (... ArrayUtil.toArray(str)); }
   insertMain (str) { this.#mainDefs.unshift (... ArrayUtil.toArray(str)); }

   build () {
      this.source = "";
      this.source += this.#headStart;
      for (let head of this.#headDefs)
         this.source += "\n" + head;
      this.source += "\n" + this.#mainStart;
      for (let main of this.#mainDefs)
         this.source += "\n" + main;
      this.source += "\n" + this.#mainEnd;
      return this.source;
   }
}

class VertexShaderGLSL300SourceBuilder   extends ShaderGLSL300SourceBuilder {
   constructor (){super();}
}
class FragmentShaderGLSL300SourceBuilder extends ShaderGLSL300SourceBuilder {
   precision = "precision mediump float;"
   constructor (){super();}
   withDefaultColor (colorDesc) {
      let colorName = "outColor";
      let color = colorDesc == null ? [0.0, 0.0, 0.0, 0.1] : colorDesc;
      this.addHead (`out vec4  ${colorName};`);
      let colorStr = ArrayUtil.buildFloatStrings (color).join (", ");
      this.addMain (`   ${colorName} = vec4 (${colorStr});`);
      return this;
   }
   build ()
   {
      this.insertHead (this.precision);
      return super.build();
   }
}
class GlShape2Dv1 extends GlApi
{
   locationCount = 0;
   #vertices = null;
   constructor (canvas) {
      let gl = canvas.getContext('webgl2');
      super(gl);
   }
   set vertices (value) {
      if (value instanceof Array) value = new Float32Array(value);
      if (value instanceof Float32Array) this.#vertices = value;
      else throw new Exception ("type unknown for vertices");
   }
   vsBuilder = new VertexShaderGLSL300SourceBuilder   ();
   fsBuilder = new FragmentShaderGLSL300SourceBuilder ().withDefaultColor ();

   buildProgram () {
      //this.fsBuilder.withDefaultColor();

      let gl = this.gl;
      this.vao = gl.createVertexArray(); //VAO
      gl.bindVertexArray(this.vao);

      this.vertexBuffer = new GlArrayBufferInfo (gl, "vertices", this.locationCount++).withBuffer (this.#vertices);
      this.vertexBuffer.build  ();
      this.vertexBuffer.attrib (2, gl.FLOAT);
      if (this.#vertices)
      {
         this.vsBuilder.addHead (`layout (location = ${this.vertexBuffer.attribLocation}) in vec2 ${this.vertexBuffer.name};`);
         this.vsBuilder.addMain (`   gl_Position = vec4(${this.vertexBuffer.name}, 0.0, 1.0);`);
      }
      this.linkProgram ();

      this.drawReroute();

      //unuse everything
      gl.bindVertexArray (null);
      gl.useProgram      (null);

   }
   linkProgram () {
      console.log (this.vsBuilder.build());
      console.log (this.fsBuilder.build());

      let cprogram = new GlProgram (this.gl);
      cprogram.addVertexShader   (this.vsBuilder.source);
      cprogram.addFragmentShader (this.fsBuilder.source);
      this.program = cprogram.linkProgram ();
      return this.program;
   }
   drawReroute() { //don't build before drawing
      this.drawTriangles = this.drawTrianglesJustDraw;
      this.drawArrays    = this.drawArraysJustDraw;
   }
   drawTriangles = this.drawTrianglesAutoBuild;
   drawArrays    = this.drawArraysAutoBuild;
   drawTrianglesJustDraw = () => {
      let start = 0, vertsCount = this.#vertices.length / 2;
      this.drawArrays (this.gl.TRIANGLES, start, vertsCount);
   }
   drawTrianglesAutoBuild () {
      this.buildProgram ();
      this.drawTrianglesJustDraw ();
   }
   drawArraysAutoBuild (drawType, start, vertsCount) {
      this.buildProgram ();
      this.drawArraysJustDraw (drawType, start, vertsCount);
   }

   drawArraysJustDraw = (drawType, start, vertsCount) => {
      let gl = this.gl;
      gl.useProgram       (this.program);
      gl.bindVertexArray  (this.vao);
      gl.drawArrays       (drawType, start, vertsCount);
   }
}
