"use strict";

//this is meant to generate shaders dynamically
//to be used in conjunction with:
//                                glmath.js
//                                glcanvas.js

//const WebGL2S = WebGL2RenderingContext; //create alias for WebGL2RenderingContext, defined in glcanvas.js
//wrapper to gl.ARRAY_BUFFER
class GlArrayBuffer {
   #attribLocation = 0;
   #buffer = null; //can be overwritten by this build/bufferData/withData
   constructor (gl, name, attribLocation, data) {
      this.gl                 = gl;
      this.#buffer            = data;
      this.#attribLocation    = attribLocation;
      this.bufferId           = null;
      this.glDrawType         = WebGL2S.STATIC_DRAW;
      this.name               = name; //name of buffer in shader
   }
   withDrawType(glDrawType) {this.glDrawType = glDrawType; return this;}
   withData    (data)       {this.#buffer    = data;       return this;}
   build (data) {
      let gl = this.gl;
      this.bufferId = gl.createBuffer ();
      this.bindBuffer ();
      if (data) this.#buffer = data;
      if (this.#buffer) //bufferData can be called latter
         this.bufferData (this.#buffer);
      return this.bufferId;
   }
   bufferData(data) {
      let gl = this.gl;
      if(data) this.#buffer = data;
      this.bindBuffer ();
      gl.bufferData   (gl.ARRAY_BUFFER, this.#buffer, this.glDrawType);
   }
   //size 1..4 (vec1..vec4), type FLOAT/INT..., normalized 0..1/-1..1 for unsigned/signed BYTE SHORT no effect on float
   //stride: start of struct, offset address relative to and in struct
   attrib (size, type, normalized = false, stride = 0, offset = 0)
   {
      console.assert (this.#attribLocation != null, "vertex location must exist!");
      let gl = this.gl;
      this.bindBuffer ();
      this.vertexAttribPointer   (size, type, normalized, stride, offset);
      gl.enableVertexAttribArray (this.#attribLocation); // auto enable
      return this.#attribLocation;
   }
   get decl () {
      return `vec${this.size} ${this.name}`;
   }
   vec4 (c) {
      if (this.size == 4) return this.name;
      let defs = [0, 0, 0, c == null ? 1 : c].slice(this.size);
      return `vec4(${this.name}, ${defs.join(", ")})`;
   }
   vertexAttribPointer (size, type, normalized = false, stride = 0, offset = 0) {
      this.size = size;
      this.type = type;
      this.normalized = normalized;
      this.stride = stride;
      this.offset = offset;
      this.bindBuffer ();
      console.assert  (this.#attribLocation != null);
      this.gl.vertexAttribPointer (this.#attribLocation, size, type, normalized, stride, offset);
   }
   bindBuffer  () { let gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId); }
   get attribLocation () {return this.#attribLocation;}
}

class ShaderGLSL300SourceBuilder {
   #headStart   = "#version 300 es";
   #headDefs    = [];
   #mainDefs    = [];
   #mainStart   = "void main(void)\n" +
                  "{";
   #mainEnd     = "}\n";
   #source = null;

   constructor () {}

   addHead     (str) { this.#headDefs.push    (... ArrayUtil.toArray(str)); }
   addMain     (str) { this.#mainDefs.push    (... ArrayUtil.toArray(str)); }
   insertHead  (str) { this.#headDefs.unshift (... ArrayUtil.toArray(str)); }
   insertMain  (str) { this.#mainDefs.unshift (... ArrayUtil.toArray(str)); }

   build () {
      if (this.#source) return this.#source; //if source is explicitly assigned
      let source = "";
      source += this.#headStart;
      for (let head of this.#headDefs)
         source += "\n" + head;
      source += "\n" + this.#mainStart;
      for (let main of this.#mainDefs)
         source += "\n" + main;
      source += "\n" + this.#mainEnd;
      this.reset(); //to be able to get intermediary snapthots, build alwais starts from scratch
      return source;
   }

   set source (val) {this.#source = val;}
   get snapshot () {return this.build();} //get current source candidate
   reset() {
      this.#headDefs = [];
      this.#mainDefs = [];
   }
}

class VertexShaderGLSL300SourceBuilder   extends ShaderGLSL300SourceBuilder {
   constructor (){super();}
   withVertexBuffer (vertexBuffer) {
      this.vertexBuffer = vertexBuffer;
      return this;
   }
   withStaticTranslation (vec4) {
      this.staticTranslation = vec4;
      return this;
   }
   build () {
      super.addHead (`layout (location = ${this.vertexBuffer.attribLocation}) in ${this.vertexBuffer.decl};`);
      let strPosOut = `   gl_Position = ${this.vertexBuffer.vec4()}`;
      if (this.staticTranslation)
         strPosOut += ` + ${ArrayUtil.buildFloatStrings (this.staticTranslation).join (", ")}`;
      super.addMain (strPosOut + ";");
      return super.build();
   }
}
class FragmentShaderGLSL300SourceBuilder extends ShaderGLSL300SourceBuilder {
   #precision = "precision mediump float;"
   #defaultColor = {name: "outColor", value: [0.0, 0.0, 0.0, 0.1]}; //variable name/value
   constructor (){super();}
   withDefaultColor (value, name) {
      if (value) this.#defaultColor.value = value;
      if (name)  this.#defaultColor.name  = name;
      return this;
   }
   withNoDefaultColor () {
      this.#defaultColor = null;
      return this;
   }
   withPrecision (precision) {
      this.#precision = precision;
      return this;
   }
   build ()
   {
      this.insertHead (this.#precision);
      if (this.#defaultColor)
      {
         this.addHead (`out vec4  ${this.#defaultColor.name};`);
         let colorStr = ArrayUtil.buildFloatStrings (this.#defaultColor.value).join (", ");
         this.addMain (`   ${this.#defaultColor.name} = vec4 (${colorStr});`);
      }
      return super.build();
   }
}
class GlProgramLinker {

}
class GlShapev1
{
   size = null; //length
   static size1D = 1;
   static size2D = 2;
   static size3D = 3;
   static size4D = 4;
   locationCount = 0;
   #vertices = null;
   vsBuilder = new VertexShaderGLSL300SourceBuilder   ();
   fsBuilder = new FragmentShaderGLSL300SourceBuilder ().withDefaultColor ();

   constructor (canvas) {
      let gl   = canvas.getContext('webgl2');
      this.gl  = gl;
      this.vao = gl.createVertexArray();
      //super(gl);
   }
   #withVertices (value, arrayType) {
      let gl = this.gl;
      gl.bindVertexArray(this.vao);
      this.#vertices =this.#toArrayType (value, arrayType);
      if (!this.vertexBuffer) {
         console.log ("here");
         this.vertexBuffer = new GlArrayBuffer (gl, "vertices", this.locationCount++).withData(this.#vertices);
         this.vertexBuffer.build ();
         this.vertexBuffer.attrib (this.size, gl.FLOAT);
         this.vsBuilder.withVertexBuffer(this.vertexBuffer);
      }
      this.vertexBuffer.bufferData (this.#vertices);
      this.updateVertices (value, arrayType);
      return this;
   }
   updateVertices(value, arrayType = Float32Array) {
      console.assert (!(this.#vertices.length % this.size), `vertices length ${this.#vertices.length} is not ${this.size}D`);
      gl.bindVertexArray(this.vao);
      this.#vertices = this.#toArrayType (value, arrayType);
      this.vertexBuffer.bufferData (this.#vertices); //might actually not work
   }
   setSize (size) {
      if (this.size == null) this.size = size;
      if (this.size != size) throw new Exception (`Requested ${size}D operation on ${this.size}D Graphics, size can be set only once.`);      
   }
   withVertices1d(value, arrayType = Float32Array) {
      this.setSize (GlShapev1.size1D);
      return this.#withVertices (value, arrayType);
   }
   withVertices2d(value, arrayType = Float32Array) {
      this.setSize (GlShapev1.size2D);
      return this.#withVertices (value, arrayType);
   }
   withVertices3d(value, arrayType = Float32Array) {
      this.setSize (GlShapev1.size3D);
      return this.#withVertices (value, arrayType);
   }
   withVertices4d(value, arrayType = Float32Array) {
      this.setSize (GlShapev1.size4D);
      return this.#withVertices (value, arrayType);
   }

   #toArrayType (value, arrayType) {
      if (value instanceof arrayType) return value;
      return new arrayType(value);
   }
   set vertices (value) {
      if (value instanceof Array) value = new Float32Array(value);
      if (value instanceof Float32Array) this.#vertices = value;
      else throw new Exception ("type unknown for vertices");
   }
   withStaticTranslation (vec4) {
      this.vsBuilder.withStaticTranslation(vec4);
      return this;
   }

   buildProgram () {
      let gl = this.gl;

      this.linkProgram ();
      this.drawReroute();
      //unuse everything
      gl.bindVertexArray (null);
      gl.useProgram      (null);

   }
   linkProgram () {
      if (this.program) return; //program might be set externally
      console.log (this.vsBuilder.build());
      console.log (this.fsBuilder.build());

      let cprogram = new GlProgram (this.gl);
      cprogram.addVertexShader   (this.vsBuilder.build());
      cprogram.addFragmentShader (this.fsBuilder.build());
      this.program = cprogram.linkProgram ();
      return this.program;
   }
   drawReroute() { //don't build before drawing
      this.drawTriangles = this.#drawTrianglesJustDraw;
      this.drawArrays    = this.#drawArraysJustDraw;
   }
   drawTriangles = this.#drawTrianglesAutoBuild; //build + drawTrianglesJustDraw, then drawReroute()
   drawArrays    = this.#drawArraysAutoBuild;    //build + drawArraysJustDraw, then drawReroute()
   //never call these directly:
   #drawTrianglesAutoBuild () {
      this.buildProgram ();
      this.#drawTrianglesJustDraw ();
   }
   #drawArraysAutoBuild (drawType, start, vertsCount) {
      this.buildProgram ();
      this.#drawArraysJustDraw (drawType, start, vertsCount);
   }
   #drawTrianglesJustDraw = () => {
      let start = 0, vertsCount = this.#vertices.length / this.size;
      this.drawArrays (this.gl.TRIANGLES, start, vertsCount);
   }

   #drawArraysJustDraw = (drawType, start, vertsCount) => {
      let gl = this.gl;
      gl.useProgram       (this.program);
      gl.bindVertexArray  (this.vao);
      gl.drawArrays       (drawType, start, vertsCount);
   }
}