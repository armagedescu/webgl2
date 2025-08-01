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
   #name   = null;
   constructor (gl, name, attribLocation, data) {
      this.gl                 = gl;
      this.#buffer            = data;
      this.#attribLocation    = attribLocation;
      this.bufferId           = null;
      this.glDrawType         = WebGL2S.STATIC_DRAW;
      this.#name              = name; //name of buffer in shader
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
   bufferData(data, arrayType = Float32Array) {
      let gl = this.gl;
      if(data) this.#buffer = ArrayUtil.toArrayType(data, arrayType);
      this.bindBuffer ();
      gl.bufferData   (gl.ARRAY_BUFFER, this.#buffer, this.glDrawType);
   }
   get length () {return this.#buffer.length;}
   get count  () {return this.#buffer.length / this.dimension;}
   get dimensionOk    () {if (this.#buffer.length % this.dimension) return false; return true;}
   get dimensionFail  () {!this.dimensionOk;}
   //dimension 1..4 (vec1..vec4), type FLOAT/INT..., normalized 0..1/-1..1 for unsigned/signed BYTE SHORT no effect on float
   //stride: start of struct, offset address relative to and in struct
   attrib (dimension, type, normalized = false, stride = 0, offset = 0)
   {
      console.assert (this.#attribLocation != null, "vertex location must exist!");
      let gl = this.gl;
      this.bindBuffer ();
      this.vertexAttribPointer   (dimension, type, normalized, stride, offset);
      gl.enableVertexAttribArray (this.#attribLocation); // auto enable
      return this.#attribLocation;
   }

   //base name and declaration for in buffers and shared varyings
   get name              () { return   this.#name; } //can be set only in sonstructor
   get nameVary          () { return `${this.name}Vary`; }
   get decl              () { return `vec${this.dimension} ${this.name}`; }
   get declVary          () { return `vec${this.dimension} ${this.nameVary}`; }
   get defaultVaryAssign () { return `${this.nameVary}=${this.name}`;}; //default pass from VertexShader to FragmentShader
   vec4 (c) {
      if (this.dimension == 4) return this.name;
      let defs = [0, 0, 0, c == null ? 1 : c].slice(this.dimension);
      return `vec4(${this.name}, ${defs.join(", ")})`;
   }
   vertexAttribPointer (dimension, type, normalized = false, stride = 0, offset = 0) {
      this.dimension = dimension;
      this.type = type;
      this.normalized = normalized;
      this.stride = stride;
      this.offset = offset;
      this.bindBuffer ();
      console.assert  (this.#attribLocation != null);
      this.gl.vertexAttribPointer (this.#attribLocation, dimension, type, normalized, stride, offset);
   }
   bindBuffer  () { let gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId); }
   get attribLocation () {return this.#attribLocation;}
}

class GlSet {
   precision           = "mediump float";
   vertexBuffer        = null;
   colorsBuffer        = null; //in array buffer
   normalsBuffer       = null; //in array buffer
   translation         = null; //uniform
   constColor          = {name: "constColor", value: [ 0.0,  0.0,  0.0,  0.1]};
   constLightDireciton = null;
   constTranslation    = null;
   constructor (){}
   //TODO: subject to interference with lights uniforms
   requireLightDirection (dvalue = [-1.0, -1.0,  1.0], dname = "lightDirection")  { 
       if (this.constLightDireciton) return ; // this.withConstLightDireciton ();
       ArrayUtil.validateType (dvalue);
       this.constLightDireciton = {name: dname, value: dvalue};
   } //TODO: subject to interference with lights uniforms

}
//TODO: make more relevant program: one shader one program
class ShaderStrategy {
   vsBuilder     = new VertexShaderGLSL300SourceBuilder   ();
   fsBuilder     = new FragmentShaderGLSL300SourceBuilder ();
   constructor (vsSource = null, fsSource = null) {
      if      (!vsSource && !fsSource) {} //no source to set
      else if ( vsSource &&  fsSourde) {
         this.vsBuilder.withSource (vsSource);
         this.fsBuilder.withSource (fsSource);
      } else //it can't be half automatic
         throw new Exception ("Sources provided must be both not null, or both null");
      this.glSet = new GlSet();
   }

   build () {
      if (!this.glSet.vertexBuffer)
         throw new Error ("Vertex buffer is required");
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      if ( vsBuilder.source &&  fsBuilder.source)
         return {vertexShaderSource : vsBuilder.source, fragmentShaderSource : fsBuilder.source};
      if ( vsBuilder.source || fsBuilder.source)
         throw new Exception ("Sources provided must be both not null, or both null");
      return this.buildCandidate ();
   }
   getStrategy () {
      if (!this.glSet.vertexBuffer) throw new Error("No strategy without vertex buffer");
      if (this.glSet.vertexBuffer      && this.glSet.colorsBuffer) return "0100";
      if (this.glSet.constColor)
      {
         if (this.glSet.translation       && this.glSet.constColor)  return "0003";
         if (this.glSet.normalsBuffer     && this.glSet.constColor)  return "0010";
         if (this.glSet.constTranslation  && this.glSet.constColor)  return "0002";
         if (this.glSet.vertexBuffer      && this.glSet.constColor)  return "0001";
      }
      //if (this.#constColor)                           return "0000";
   }
   //all that is can be declared (not null) is declared, no strategy here
   addDeclarations() {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder];
      let glSet = this.glSet;
      console.assert (glSet.precision, "Precision in Fragment Shader is required: call withPrecision");
      console.assert (glSet.vertexBuffer,    "Vertex Buffer is required: call withVertexBuffer");
      fsBuilder.addHead (`precision ${glSet.precision};`);
      fsBuilder.addHead (`out vec4 fragColor;`);
      vsBuilder.addHead (`layout (location = ${glSet.vertexBuffer.attribLocation}) in ${glSet.vertexBuffer.decl};`);
      if (glSet.constColor) { 
         let colorStr = ArrayUtil.buildFloatStrings (glSet.constColor.value).join (", ");
         fsBuilder.addHead (`const vec4 ${glSet.constColor.name} = vec4 (${colorStr});`);
      }
      if (glSet.normalsBuffer) {
         vsBuilder.addHead (`layout (location = ${glSet.normalsBuffer.attribLocation}) in ${glSet.normalsBuffer.decl};`);
         vsBuilder.addHead (`out ${glSet.normalsBuffer.declVary};`);
         fsBuilder.addHead (`in  ${glSet.normalsBuffer.declVary};`);
      }
      if (glSet.colorsBuffer) {
         vsBuilder.addHead (`layout (location = ${glSet.colorsBuffer.attribLocation}) in ${glSet.colorsBuffer.decl};`);
         vsBuilder.addHead (`out ${glSet.colorsBuffer.declVary};`);
         fsBuilder.addHead (`in  ${glSet.colorsBuffer.declVary};`);         
      }
      if (glSet.constLightDireciton)
      {
         let strOut = ArrayUtil.buildFloatStrings(glSet.constLightDireciton.value).join(", ");
         fsBuilder.addHead (`const vec3 ${glSet.constLightDireciton.name} = normalize (vec3(${strOut}));`);
      }
      if (glSet.translation) {
         vsBuilder.addHead (`uniform vec4 ${glSet.translation.name};`);
      }
   }
   strategy_0100 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      let glSet = this.glSet;

      vsBuilder.addMain  (`   gl_Position = ${glSet.vertexBuffer.vec4()};`);
      vsBuilder.addMain  (`   ${glSet.colorsBuffer.defaultVaryAssign};`);
 
      fsBuilder.addMain  (`   fragColor = ${glSet.colorsBuffer.nameVary};`);
   }
   strategy_0010 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      let glSet = this.glSet;

      vsBuilder.addMain  (`   gl_Position = ${glSet.vertexBuffer.vec4()};`);
      vsBuilder.addMain  (`   ${glSet.normalsBuffer.defaultVaryAssign};`);

      fsBuilder.addMain  (`   float prod = -dot (${glSet.constLightDireciton.name}, normalize (${glSet.normalsBuffer.nameVary}) );`);
      fsBuilder.addMain  (`   fragColor = vec4 (${glSet.constColor.name}.rgb * prod,  1.0);`);
   }
   strategy_0003 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      let glSet = this.glSet;
      vsBuilder.addMain  (`   gl_Position = vec4(${glSet.translation.name}) + ${glSet.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   strategy_0002 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      let glSet = this.glSet;
      let strPosOut = `${ArrayUtil.buildFloatStrings (glSet.constTranslation).join (", ")}`;
      vsBuilder.addMain  (`   gl_Position = vec4(${strPosOut}) + ${glSet.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   strategy_0001 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      vsBuilder.addMain  (`   gl_Position = ${this.glSet.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   getColor () {
      return this.glSet.constColor;
   }
   strategy_0000 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      fsBuilder.addMain (`   fragColor = vec4 (${this.glSet.constColor.name});`);
   }
   buildCandidate () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      for (let builder of [vsBuilder, fsBuilder] ) builder.reset();

      this.addDeclarations(); //don't call inside strategy
      switch (this.getStrategy ()) {
      //case "0000": this.strategy_0000 (); break; not directly usable
      case "0001": this.strategy_0001 (); break;
      case "0002": this.strategy_0002 (); break;
      case "0003": this.strategy_0003 (); break;
      case "0010": this.strategy_0010 (); break;
      case "0100": this.strategy_0100 (); break;
      }

      return {vertexShaderSource : this.vsBuilder.buildCandidate(), fragmentShaderSource : this.fsBuilder.buildCandidate()};
   }
   get snapshot          () {return this.build();}           //get current working source at current state
   get snapshotCandidate () {return this.buildCandidate ();} //get current source candidate, for manually adjusted code
}
class ShaderGLSL300SourceBuilder {
   #headStart    = "#version 300 es";
   #headDefs     = [];
   #mainDefs     = [];
   #mainStart    = "void main(void)\n" +
                   "{";
   #mainEnd      = "}\n";
   #source = null;

   constructor () {}
   withSource (source) {this.#source = source; return this;}

   addHead     (str) { this.#headDefs.push    (... ArrayUtil.toArray(str)); }
   addMain     (str) { this.#mainDefs.push    (... ArrayUtil.toArray(str)); }
   insertHead  (str) { this.#headDefs.unshift (... ArrayUtil.toArray(str)); }
   insertMain  (str) { this.#mainDefs.unshift (... ArrayUtil.toArray(str)); }

   build () {
      if (this.#source) return this.#source; //if source is explicitly assigned
      return this.buildCandidate ();
   }
   buildCandidate () {
      let source = "";
      source += this.#headStart;
      source += "\n" + this.#headDefs.join ("\n");
      source += "\n" + this.#mainStart;
      source += "\n" + this.#mainDefs.join ("\n");
      source += "\n" + this.#mainEnd;
      this.reset(); //to be able to get intermediary snapthots, build alwais starts from scratch
      return source;
   }

   set source (val) {this.#source = val;}
   get snapshot          () {return this.build();}           //get current working source at current state
   get snapshotCandidate () {return this.buildCandidate ();} //get current source candidate, for manually adjusted code
   reset() {
      this.#headDefs = [];
      this.#mainDefs = [];
   }
}
//Same builder, just different classes, yet identic
class VertexShaderGLSL300SourceBuilder   extends ShaderGLSL300SourceBuilder {   constructor () { super(); }   }
class FragmentShaderGLSL300SourceBuilder extends ShaderGLSL300SourceBuilder {   constructor () { super(); }   }
class ShaderProgramBuilder {
   #gl = null;
   #programExternal = null;
   #shaderSources   = null;
   #uniforms        = null;
   #program         = null;
   get gl () {return this.#gl;}
   constructor (gl) { this.#gl = gl; }
   withProgramExternal (programExternal) { this.#programExternal = programExternal; return this; }
   //required format{vertexShaderSource: "vsSource", fragmentShaderSource: "vsSource"}
   withShaderSources (shaderSources) {
      if (this.#programExternal != null) return this; 
      this.#shaderSources = shaderSources;
      return this;
   }
   //required format [{location: null, name: "name" ...}, ...]
   withUniforms (uniforms) {
      this.#uniforms = uniforms;
      return this;
   }
   //build program and get uniforms locations
   buildProgram () {
      let gl = this.gl;
      if (this.#program != null) return; //everything is already done
      this.#buildInternal ();
      this.#getUniformLocations ();
      gl.useProgram      (null);
      return this.#program;
   }
   #buildInternal () {
      let gl = this.gl;
      this.#program = this.#programExternal;
      if (this.program != null) return this.#program;
      let cprogram = new GlProgram (gl);
      let shaderSources = this.#shaderSources;
      
      cprogram.addVertexShader   (shaderSources.vertexShaderSource);
      cprogram.addFragmentShader (shaderSources.fragmentShaderSource);

      this.#program = cprogram.linkProgram ();
      return this.#program;
   }
   #getUniformLocations () {
      if (!this.#uniforms) return; //nothing to do
      let gl = this.gl;
      gl.useProgram (this.#program);
      for (let uniform of this.#uniforms)
         uniform.location = gl.getUniformLocation(this.#program, uniform.name);
      this.#uniforms = null; //never deal with it again
   }

}

// this wraps OpenGL VAO, VBO, Uniforms
class GlShapev1
{
   locationCount = 0;

   strategy = new ShaderStrategy ();
   glSet = this.strategy.glSet;
   #uniforms = [];

   constructor (canvas) {
      //if (canvas instanceof HTMLCanvasElement
      let gl   = canvas instanceof HTMLCanvasElement ? canvas.getContext('webgl2'): canvas;
      this.gl  = gl;
      this.vao = gl.createVertexArray();
   }

   withNoConstColor () { this.glSet.constColor = null; return this; }
   withPrecision  (dvalue = "mediump float") { this.glSet.precision = dvalue; return this; }
   withTransnation4f (data = null, name = "translate") {
      this.glSet.translation = {data:data, name: name, location: null, type: "4f"};
      this.glSet.constTranslation = null;
      this.#uniforms.push (this.glSet.translation);
      return this;
   }
   translate4f  (x, y, z, f) { this.gl.uniform4f  (this.glSet.translation.location, x, y, z, f); }
   translate4fv (data)       { this.gl.uniform4fv (this.glSet.translation.location, data); }
   withConstColor (dvalue = [ 0.0,  0.0,  0.0,  0.1], dname = "constColor") { ArrayUtil.validateType (dvalue); this.glSet.constColor = {name: dname, value: dvalue}; return this; }
   withConstLightDireciton (dvalue = [-1.0, -1.0,  1.0], dname = "constLightDirection") {
      ArrayUtil.validateType (dvalue);
      this.glSet.constLightDireciton  = {name: dname, value: dvalue};
      return this;
   }
   #withVertices (data, arrayType, dimension) {
      if(this.glSet.vertexBuffer) throw new Error ("withVertices can be called only once. Call updateVertices* instead.");
      let gl = this.gl, glSet = this.glSet;
      gl.bindVertexArray(this.vao);
      let arrayBuffer = this.#createBuffer("vertices", data, arrayType, dimension);
      glSet.vertexBuffer = arrayBuffer;
      return this;
   }
   #updateArrayBuffer (arrayBuffer, data, arrayType = Float32Array) {
      this.gl.bindVertexArray(this.vao);
      arrayBuffer.bufferData (data, arrayType); //TODO: yet might actually fail     
   }
   updateVertices(data, arrayType = Float32Array) {
      console.assert (!(value.length % this.dimension), `vertices length ${data.length} is not ${this.dimension}D`);
      console.assert (this.glSet.vertexBuffer, "vertex buffer not initialized. Call withVertices first");
      this.#updateArrayBuffer (this.glSet.vertexBuffer, data, arrayType);
   }
   withVertices1d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 1); }
   withVertices2d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 2); }
   withVertices3d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 3); }
   withVertices4d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 4); }

   #withNormals (data, arrayType, dimension) {
      if(this.glSet.normalsBuffer) throw new Error ("withNormals can be called only once. Call updateNormals* instead.");
      let gl = this.gl;
      gl.bindVertexArray(this.vao);
      let arrayBuffer = this.#createBuffer ("normals", data, arrayType, dimension);
      this.glSet.requireLightDirection();
      this.glSet.normalsBuffer = arrayBuffer;
      return this;
   }
   //TODO: move it somewhere
   //create any<type> of buffer and initializes with [...data]
   #createBuffer (name, data, arrayType, dimension) {
      let gl = this.gl;
      gl.bindVertexArray(this.vao);
      let arrayBuffer = new GlArrayBuffer (gl, name, this.locationCount++);
      arrayBuffer.build  ();
      arrayBuffer.attrib (dimension, gl.FLOAT);
      this.#updateArrayBuffer (arrayBuffer, data, arrayType);
      return arrayBuffer;
   }
   updateNormals(data, arrayType = Float32Array) {
      this.gl.bindVertexArray (this.vao);
      this.#updateArrayBuffer (this.glSet.normalsBuffer, data, arrayType);
   }

   #withColors (data, arrayType, dimension) {
      if(this.glSet.colorsBuffer) throw new Error ("withColors can be called only once. Call updateColors* instead.");
      let gl = this.gl, glSet = this.glSet;
      gl.bindVertexArray(this.vao);
      let arrayBuffer = this.#createBuffer ("colors", data, arrayType, dimension);
      glSet.constColor   = null; //disable const color
      glSet.colorsBuffer = arrayBuffer;
      return this;
   }

   updateColors(value, arrayType = Float32Array) {
      let [colorsBuffer, vertexBuffer] = [this.glSet.colorsBuffer, this.glSet.vertexBuffer];
      console.assert (colorsBuffer.dimensionOk, `Color count ${colorsBuffer.length} is not ${colorsBuffer.dimension}D`);
      console.assert (vertexBuffer.count == colorsBuffer.count, `Color count ${colorsBuffer.count}, but vertex count is ${vertexBuffer.count}` );

      this.gl.bindVertexArray(this.vao);
      let data = ArrayUtil.toArrayType (value, arrayType);
      this.glSet.colorsBuffer.bufferData (data); //might actually not work
   }

   withNormals3d(data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 3); }
   withNormals4d(data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 4); }
   withColors3d (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 3); }
   withColors4d (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 4); }

   withConstTranslation (vec4) {
      this.glSet.constTranslation = vec4;
      return this;
   }

   #programExternal = null;
   withProgram (program) {
      let gl = this.gl;
      if (program instanceof WebGLProgram) this.#program = program;
      if (program instanceof GlShapev1) this.#program = program.programAuto;
      return this;
   }
   //build program and get uniforms locations
   buildProgram () {
      let gl = this.gl;
      if (this.#program != null) return; //everything is already done
      let programBuilder = new ShaderProgramBuilder (gl)
         .withProgramExternal (this.#programExternal)
         .withShaderSources (this.strategy.build ())
         .withUniforms (this.#uniforms);
      this.#program = programBuilder.buildProgram ();
      return this.#program;
   }

   logStrategyShaders (msg = null)
   {
      let shaderSources = this.strategy.build ();
      if (msg) console.log (`${msg}`);
      console.log (`${shaderSources.vertexShaderSource}\n${shaderSources.fragmentShaderSource}`);
   }
   #program = null;
   get programAuto () {if (this.#program == null) this.buildProgram (); return this.#program;}

   bind() {
      let gl = this.gl;
      gl.useProgram       (this.programAuto);
      gl.bindVertexArray  (this.vao);
   }

   drawTriangles (start = 0) { this.drawArrays (this.gl.TRIANGLES, start, this.glSet.vertexBuffer.count); }
   drawArrays (drawType, start, vertsCount) {
      let gl = this.gl;
      this.bind();
      gl.drawArrays       (drawType, start, vertsCount);
   }
}