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

//TODO: make more relevant program: one shader one program
class ShaderStrategy {
   vsBuilder     = new VertexShaderGLSL300SourceBuilder   ();
   fsBuilder     = new FragmentShaderGLSL300SourceBuilder ();
   #precision    = "mediump float";
   #constColor   = {name: "constColor", value: [ 0.0,  0.0,  0.0,  0.1]};
   #constLightDireciton = null;
   #translation = null;
   constructor (vsSource = null, fsSource = null) {
      if      (!vsSource && !fsSource) {} //no source to set
      else if ( vsSource &&  fsSourde) {
         this.vsBuilder.withSource (vsSource);
         this.fsBuilder.withSource (fsSource);
      } else //it can't be half automatic
         throw new Exception ("Sources provided must be both not null, or both null");
   }
   withPrecision  (dvalue = "mediump float") { this.#precision = dvalue; return this; }
   withConstColor (dvalue = [ 0.0,  0.0,  0.0,  0.1], dname = "constColor") {ArrayUtil.validateType (dvalue);  this.#constColor = {name: dname, value: dvalue}; return this; }
   withNoConstColor () { this.#constColor = null; return this; }
   withConstLightDireciton (dvalue = [-1.0, -1.0,  1.0], dname = "lightDirection") {
      ArrayUtil.validateType (dvalue); 
      this.#constLightDireciton  = {name: dname, value: dvalue};
      return this;
   }
   withNoConstLightDireciton () { this.#constLightDireciton = null; return this; }
   withVertexBuffer  (vertexBuffer)  { this.vertexBuffer  = vertexBuffer;  return this; }
   #requireLightDirection ()  { if (!this.#constLightDireciton) this.withConstLightDireciton (); } //TODO: subject to interference with lights uniforms
   withNormalsBuffer (normalsBuffer) {
      this.#requireLightDirection ();
      this.normalsBuffer = normalsBuffer;
      return this;
   }
   withColorsBuffer  (colorsBuffer)  { this.colorsBuffer  = colorsBuffer;  return this.withNoConstColor (); }
   withTransnation4f (translation) {
      this.#translation = translation;
      this.withNoConstTranslation ();
      return this;
   }
   withNoConstTranslation () {
      this.constTranslation = null;
      return this;
   }
   withConstTranslation (vec4) {
      if (this.translation) throw new Error ("Const translation is not compatible with uniform translation");
      this.constTranslation = vec4;
      return this;
   }

   build () {
      if (!this.vertexBuffer)
         throw new Error ("Vertex buffer is required");
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      if ( vsBuilder.source &&  fsBuilder.source)
         return {vertexShaderSource : vsBuilder.source, fragmentShaderSource : fsBuilder.source};
      if ( vsBuilder.source || fsBuilder.source)
         throw new Exception ("Sources provided must be both not null, or both null");
      return this.buildCandidate ();
   }
   getStrategy () {
      if (!this.vertexBuffer) throw new Error("No strategy without vertex buffer");
      if (this.vertexBuffer      && this.colorsBuffer) return "0100";
      if (this.#constColor)
      {
         if (this.#translation      && this.#constColor)  return "0003";
         if (this.normalsBuffer     && this.#constColor)  return "0010";
         if (this.constTranslation  && this.#constColor)  return "0002";
         if (this.vertexBuffer      && this.#constColor)  return "0001";
      }
      //if (this.#constColor)                           return "0000";
   }
   //all that is can be declared (not null) is declared, no strategy here
   addDeclarations() {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      console.assert (this.vertexBuffer, "Precision in Fragment Shader is required: call withPrecision");
      console.assert (this.vertexBuffer, "Vertex Buffer is required: call withVertexBuffer");
      fsBuilder.addHead (`precision ${this.#precision};`);
      fsBuilder.addHead (`out vec4 fragColor;`);
      vsBuilder.addHead (`layout (location = ${this.vertexBuffer.attribLocation}) in ${this.vertexBuffer.decl};`);
      if (this.#constColor) { 
         let colorStr = ArrayUtil.buildFloatStrings (this.#constColor.value).join (", ");
         fsBuilder.addHead (`const vec4 ${this.#constColor.name} = vec4 (${colorStr});`);
      }
      if (this.normalsBuffer) {
         vsBuilder.addHead (`layout (location = ${this.normalsBuffer.attribLocation}) in ${this.normalsBuffer.decl};`);
         vsBuilder.addHead (`out ${this.normalsBuffer.declVary};`);
         fsBuilder.addHead (`in  ${this.normalsBuffer.declVary};`);
      }
      if (this.colorsBuffer) {
         vsBuilder.addHead (`layout (location = ${this.colorsBuffer.attribLocation}) in ${this.colorsBuffer.decl};`);
         vsBuilder.addHead (`out ${this.colorsBuffer.declVary};`);
         fsBuilder.addHead (`in  ${this.colorsBuffer.declVary};`);         
      }
      if (this.#constLightDireciton)
      {
         let strOut = ArrayUtil.buildFloatStrings(this.#constLightDireciton.value).join(", ");
         fsBuilder.addHead (`const vec3 ${this.#constLightDireciton.name} = normalize (vec3(${strOut}));`);
      }
      if (this.#translation) {
         vsBuilder.addHead (`uniform vec4 ${this.#translation.name};`);
      }
   }
   strategy_0100 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];

      vsBuilder.addMain  (`   gl_Position = ${this.vertexBuffer.vec4()};`);
      vsBuilder.addMain  (`   ${this.colorsBuffer.defaultVaryAssign};`);
 
      fsBuilder.addMain  (`   fragColor = ${this.colorsBuffer.nameVary};`);
   }
   strategy_0010 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];

      vsBuilder.addMain  (`   gl_Position = ${this.vertexBuffer.vec4()};`);
      vsBuilder.addMain  (`   ${this.normalsBuffer.defaultVaryAssign};`);

      fsBuilder.addMain  (`   float prod = -dot (${this.#constLightDireciton.name}, normalize (${this.normalsBuffer.nameVary}) );`);
      fsBuilder.addMain  (`   fragColor = vec4 (${this.#constColor.name}.rgb * prod,  1.0);`);
   }
   strategy_0003 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      vsBuilder.addMain  (`   gl_Position = vec4(${this.#translation.name}) + ${this.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   strategy_0002 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      //this.addDeclarations();
      let strPosOut = `${ArrayUtil.buildFloatStrings (this.constTranslation).join (", ")}`;
      vsBuilder.addMain  (`   gl_Position = vec4(${strPosOut}) + ${this.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   strategy_0001 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      //this.addDeclarations();
      vsBuilder.addMain  (`   gl_Position = ${this.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   getColor () {
      return this.#constColor;
   }
   strategy_0000 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      fsBuilder.addMain (`   fragColor = vec4 (${this.#constColor.name});`);
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

   constructor (canvas) {
      //if (canvas instanceof HTMLCanvasElement
      let gl   = canvas instanceof HTMLCanvasElement ? canvas.getContext('webgl2'): canvas;
      this.gl  = gl;
      this.vao = gl.createVertexArray();
   }

   #uniforms = [];
   withTransnation4f (data = null, name = "translate") {
      this.translate = {data:data, name: name, location: null, type: "4f"};
      this.strategy.withTransnation4f (this.translate);
      this.#uniforms.push (this.translate);
      return this;
   }
   translate4f  (x, y, z, f) { this.gl.uniform4f  (this.translate.location, x, y, z, f); }
   translate4fv (data)       { this.gl.uniform4fv (this.translate.location, data); }
   withConstColor (dvalue = [ 0.0,  0.0,  0.0,  0.1], dname = "constColor") { ArrayUtil.validateType (dvalue); this.strategy.withConstColor(dvalue, dname); return this; }
   withConstLightDireciton (dvalue = [-1.0, -1.0,  1.0], dname = "constLightDirection") {
      ArrayUtil.validateType (dvalue);
      this.strategy.withConstLightDireciton(dvalue, dname); return this;
   }
   #withVertices (data, arrayType, dimension) {
      let gl = this.gl;
      gl.bindVertexArray(this.vao);
      if(this.vertexBuffer) throw new Error ("withVertices can be called only once. Call updateVertices* instead.");
      let arrayBuffer = this.#createBuffer("vertices", data, arrayType, dimension);
      this.strategy.withVertexBuffer(arrayBuffer);
      this.vertexBuffer = arrayBuffer;
      return this;
   }
   #updateArrayBuffer (arrayBuffer, data, arrayType = Float32Array) {
      this.gl.bindVertexArray(this.vao);
      arrayBuffer.bufferData (data, arrayType); //TODO: yet might actually fail     
   }
   updateVertices(data, arrayType = Float32Array) {
      console.assert (!(value.length % this.dimension), `vertices length ${data.length} is not ${this.dimension}D`);
      console.assert (this.vertexBufferarrayBuffer, "vertex buffer not initialized. Call withVertices first");
      this.#updateArrayBuffer (this.vertexBufferarrayBuffer, data, arrayType);
   }
   withVertices1d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 1); }
   withVertices2d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 2); }
   withVertices3d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 3); }
   withVertices4d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 4); }

   #withNormals (data, arrayType, dimension) {
      let gl = this.gl;
      gl.bindVertexArray(this.vao);
      if(this.normalsBuffer) throw new Error ("withNormals can be called only once. Call updateNormals* instead.");
      let arrayBuffer = this.#createBuffer ("normals", data, arrayType, dimension);
      this.strategy.withNormalsBuffer(arrayBuffer);
      this.normalsBuffer = arrayBuffer;
      return this;
   }
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
      this.#updateArrayBuffer (this.normalsBuffer, data, arrayType);
   }

   #withColors (data, arrayType, dimension) {
      let gl = this.gl;
      gl.bindVertexArray(this.vao);
      if(this.colorsBuffer) throw new Error ("withColors can be called only once. Call updateColors* instead.");
      let arrayBuffer = this.#createBuffer ("colors", data, arrayType, dimension);
      this.strategy.withColorsBuffer(arrayBuffer);
      this.colorsBuffer = arrayBuffer;
      return this;
   }

   updateColors(value, arrayType = Float32Array) {
      let [colorsBuffer, vertexBuffer] = [this.colorsBuffer, this.vertexBuffer];
      console.assert (colorsBuffer.dimensionOk, `Color count ${colorsBuffer.length} is not ${colorsBuffer.dimension}D`);
      console.assert (vertexBuffer.count == colorsBuffer.count, `Color count ${colorsBuffer.count}, but vertex count is ${vertexBuffer.count}` );

      this.gl.bindVertexArray(this.vao);
      let data = ArrayUtil.toArrayType (value, arrayType);
      this.colorsBuffer.bufferData (data); //might actually not work
   }

   withNormals3d(data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 3); }
   withNormals4d(data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 4); }
   withColors3d (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 3); }
   withColors4d (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 4); }

   withConstTranslation (vec4) {
      this.strategy.withConstTranslation (vec4);
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

   drawTriangles (start = 0) { this.drawArrays (this.gl.TRIANGLES, start, this.vertexBuffer.count); }
   drawArrays (drawType, start, vertsCount) {
      let gl = this.gl;
      this.bind();
      gl.drawArrays       (drawType, start, vertsCount);
   }
}