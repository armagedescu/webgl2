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

   static createAndInitBuffer (gl, location, name, data, arrayType, dimension) {
      let arrayBuffer = new GlArrayBuffer (gl, name, location);
      arrayBuffer.build  ();
      arrayBuffer.attrib (dimension, gl.FLOAT);
      arrayBuffer.bufferData (data, arrayType);
      return arrayBuffer;
   }
   //sets data only. 
   bufferData(data, arrayType = Float32Array) {
      if (!data) return; //this does not require data, it can be set any later
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
   get defaultVaryAssign () { return `${this.nameVary}=${this.name}`; }; //default pass from VertexShader to FragmentShader
   ////TODO: keep into account
   //get normalize     () { return `normalize(${this.name})`}
   //get normalizeVary () { return `normalize(${this.nameVary})`}
   vec4 (c) {
      if (this.dimension == 4) return this.name;
      let defs = [0, 0, 0, c == null ? 1 : c].slice(this.dimension);
      return `vec4(${this.name}, ${defs.join(", ")})`;
   }
   vec4vary (c) {
      if (this.dimension == 4) return this.nameVary;
      let defs = [0, 0, 0, c == null ? 1 : c].slice(this.dimension);
      return `vec4(${this.nameVary}, ${defs.join(", ")})`;
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
   #precision           = "mediump float";
   #vertexBuffer        = null;
   #normalsBuffer       = null; //in array buffer
   #colorsBuffer        = null; //in array buffer
   #constColor          = null;
   #translation         = null; //uniform
   #constTranslation    = null;
   #lightDirection      = null; //uniform
   #constLightDirection = null;
   constructor () {
      Object.preventExtensions(this); //properties can't be added manually
   }
   //TODO: subject to interference with lights uniforms //{name: "constColor", value: [ 0.0,  0.0,  0.0,  0.1]}
   requireColor (dvalue = [ 0.0,  0.0,  0.0,  0.1], dname = "constColor")  { 
       if (this.colorsBuffer)        return; // this.withLightDireciton ();
       if (this.constColor)          return; // this.withConstLightDireciton ();
       ArrayUtil.validateType (dvalue);
       this.constColor = {name: dname, value: dvalue};
   } //TODO: subject to interference with lights uniforms
   //TODO: subject to interference with lights uniforms
   requireLightDirection (dvalue = [0.0, 0.5, 1.0], dname = "lightDirection")  { 
       if (this.lightDirection)      return; // this.withLightDireciton ();
       if (this.constLightDirection) return; // this.withConstLightDireciton ();
       ArrayUtil.validateType (dvalue);
       this.constLightDirection = {name: dname, value: dvalue};
   } //TODO: subject to interference with lights uniforms
   //getters/setters
   get precision           ()    { return this.#precision;    }
   set precision           (val) { this.#precision = val;     }
   get vertexBuffer        ()    { return this.#vertexBuffer; }
   set vertexBuffer        (val) {
      if(this.#vertexBuffer) throw new Error ("vertexBuffer can be set only once. Call updateVertices* to update data.");
      this.#vertexBuffer = val;
   }
   get colorsBuffer        ()    {return this.#colorsBuffer; }
   set colorsBuffer        (val) {
      if (this.#colorsBuffer) throw new Error ("colorsBuffer can be set only once. Call updateColors* to update data.");
      this.#constColor   = null; //disable const color
      this.#colorsBuffer = val;
   }
   get normalsBuffer       ()    { return this.#normalsBuffer; }
   set normalsBuffer       (val) { this.#normalsBuffer = val;  }
   get translation         ()    { return this.#translation;   }
   set translation         (val) {
      if (this.#translation) throw new Error ("translation can be set only once, call translate* to update translation");
      this.#translation      = val; 
      this.#constTranslation = null;
   }
   
   get lightDirection      ()    { return this.#lightDirection;}
   set lightDirection      (val) {
      if (this.lightDirection) throw new Error ("light direction can be added only once. Call lightDirection1/2/3/4fv to update light direction");
      this.#constLightDirection = null;
      this.#lightDirection = val;
   }
   get constColor          ()    { return this.#constColor; }
   set constColor          (val) {
      if (this.#colorsBuffer) throw new Error ("Const color can't be set when color buffer is used");
      if (this.#constColor)   throw new Error ("Const color can be set only once");
      ArrayUtil.validateType (val.value); //throws error on fail
      this.#constColor = val;
   }
   get constLightDirection ()    { return this.#constLightDirection; }
   set constLightDirection (val) {
      if (this.#constLightDirection) throw new Error ("Const light direction can be set only once");
      ArrayUtil.validateType (val.value); //throws error on fail
      this.#constLightDirection = val;
   }
   get constTranslation    ()    { return this.#constTranslation; }
   set constTranslation    (val) { this.#constTranslation = val;  }

}
//TODO: make more relevant program: one shader one program
class ShaderStrategy {
   vsBuilder     = new VertexShaderGLSL300SourceBuilder   ();
   fsBuilder     = new FragmentShaderGLSL300SourceBuilder ();
   constructor (vsSource = null, fsSource = null, glSet) {
      if (!vsSource && !fsSource) {} //no source to be set
      else if ( vsSource &&  fsSource) {
         this.vsBuilder.withSource (vsSource);
         this.fsBuilder.withSource (fsSource);
      } else //it can't be half automatic
         throw new Error ("Sources provided must be both or none");
      this.glSet = glSet;
   }

   setRequirements () {
      let glSet = this.glSet;
      glSet.requireColor ();
      if (glSet.normalsBuffer) glSet.requireLightDirection();
   }
   build () {
      if (!this.glSet.vertexBuffer)
         throw new Error ("Vertex buffer is required");
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      if ( vsBuilder.source &&  fsBuilder.source)
         return {vertexShaderSource : vsBuilder.source, fragmentShaderSource : fsBuilder.source};
      if ( vsBuilder.source || fsBuilder.source)
         throw new Error ("Sources provided must be both not null, or both null");
      this.setRequirements ();
      return this.buildCandidate ();
   }
   getStrategy () {
      let glSet = this.glSet;
      if (!glSet.vertexBuffer) throw new Error("No strategy without vertex buffer");
      if (glSet.vertexBuffer      && glSet.colorsBuffer) return "0100";
      if (glSet.constColor)
      {
         if (glSet.translation       && glSet.constColor)           return "0003";
         //if (glSet.normalsBuffer     && glSet.constLightDirection)  return "0004"; //this has priority over 0010
         if (glSet.normalsBuffer     && glSet.constColor)           return "0010";
         if (glSet.constTranslation  && glSet.constColor)           return "0002";
         if (glSet.vertexBuffer      && glSet.constColor)           return "0001";
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
      if (glSet.constLightDirection)
      {
         let strOut = ArrayUtil.buildFloatStrings(glSet.constLightDirection.value).join(", ");
         fsBuilder.addHead (`const vec3 ${glSet.constLightDirection.name} = vec3(${strOut});`);
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

      fsBuilder.addMain  (`   fragColor = ${glSet.colorsBuffer.vec4vary()};`);
   }
   strategy_0004 () {this.strategy_0010 ();}
   strategy_0010 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      let glSet = this.glSet;

      vsBuilder.addMain  (`   gl_Position = ${glSet.vertexBuffer.vec4()};`);
      vsBuilder.addMain  (`   ${glSet.normalsBuffer.defaultVaryAssign};`);

      fsBuilder.addMain  (`   float prod = -dot (${glSet.constLightDirection.name},  (${glSet.normalsBuffer.nameVary}) );`);
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
      case "0004": this.strategy_0004 (); break;
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
   get source () {return this.#source;}
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
   #uniforms        = [];
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
      this.#uniforms = [... this.#uniforms, ...ArrayUtil.toArray (uniforms)]; //accumulate
      return this;
   }
   //build program and get uniforms locations
   buildProgram () {
      let gl = this.gl;
      if (this.#program != null) return; //everything is already done
      this.#buildInternal ();
      this.#getUniformLocations ();
      gl.useProgram (null);
      return this.#program;
   }
   #buildInternal () {
      let gl = this.gl;
      this.#program = this.#programExternal;
      if (this.#program != null) return this.#program;
      let cprogram = new GlProgram (gl);
      let shaderSources = this.#shaderSources;
      
      cprogram.addVertexShader   (shaderSources.vertexShaderSource);
      cprogram.addFragmentShader (shaderSources.fragmentShaderSource);

      this.#program = cprogram.linkProgram ();
      return this.#program;
   }
   get uniforms () {if (this.#uniforms && this.#uniforms.length) return this.#uniforms; return null;}
   #getUniformLocations () {
      if (!this.uniforms) return; //nothing to do
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

   #strategy        = null;
   glSet            = new GlSet();
   #uniforms        = [];
   #program         = null;
   #programExternal = null;
   #canvas          = null;
   //chain
   #prev            = null;
   #next            = null;
   get prev       () { return  this.#prev; } 
   get next       () { return  this.#next; } 
   get first      () { return  this.#prev ? this.#prev.first() : this; }
   get last       () { return  this.#next ? this.#next.last()  : this; }
   get isLast     () { return !this.#next; }
   get isNotLast  () { return  this.#next; }

   get strategyAuto() {
      if (this.#strategy) return this.#strategy;
      this.#strategy = new ShaderStrategy(null, null, this.glSet);
      return this.#strategy;
   }

   constructor (obj) {
      this.#obj = obj;
   }
   requireCanvas () {
      if (this.#prev || this.#next) throw new Error ("this is part of VAO chain");
      if (this.canvas) throw new Error ("<canvas> already set");
      if (this.gl)     throw new Error ("WebGL2RenderingContext already set");
      this.#obj = document.createElement ("canvas"); //new HTMLCanvasElement?
   }
   //complexity of initialization here
   set #obj(obj) {
      if (this.#prev || this.#next) throw new Error ("this is part of VAO chain");
      if (this.canvas) throw new Error ("<canvas> already set");
      if (this.gl)     throw new Error ("WebGL2RenderingContext already set");
      if (!obj) return;
      let  gl  = null;
      if (obj instanceof HTMLCanvasElement) {
         this.#canvas = obj;
         gl = obj.getContext('webgl2');
      }//: canvas;
      if (obj instanceof WebGL2RenderingContext) { gl = obj; }
      if (obj instanceof GlShapev1) {
         if (obj.isNotLast) throw new Error ("new VAO can be only appended to last VAO in chain");
         gl = obj.gl;
         this.#prev = obj;
         obj.#next = this;
         this.#canvas = obj.canvas;
         this.#programExternal = obj.programAuto;
      }
      this.gl  = gl;
      this.vao = gl.createVertexArray();
   }
   get canvas () {return this.#canvas;}

   withShaderSources (vs, fs) {
      this.#strategy = new ShaderStrategy(vs, fs, this.glSet);
      return this;
   }
   withConstColor    (dvalue = [ 0.0,  0.0,  0.0,  0.1], dname = "constColor") {
      this.glSet.constColor = {name: dname, value: dvalue};
      return this;
   }
   withConstLightDireciton (dvalue = [0.0, 0.5, 1.0], dname = "constLightDirection") {
      this.glSet.constLightDirection  = {name: dname, value: dvalue};
      return this;
   }

   withPrecision     (dvalue = "mediump float") { this.glSet.precision = dvalue; return this; }
   withTransnation4f (data = null, name = "translate") {
      this.glSet.translation = {data:data, name: name, location: null, type: "4f"};
      return this;
   }
   translate4f  (x, y, z, w) { this.gl.uniform4f  (this.glSet.translation.location, x, y, z, w); }
   translate4fv (data)       { this.gl.uniform4fv (this.glSet.translation.location, data); }
   withLightDirection3f (data = null, name = "lightDirection") {
      this.glSet.lightDirection = {data:data, name: name, location: null, type: "3f"};
      return this;
   }
   lightDirection3f  (x, y, z)    { this.gl.uniform3f  (this.glSet.lightDirection.location, x, y, z); }
   lightDirection3fv (data)       { this.gl.uniform3fv (this.glSet.lightDirection.location, data); }

   //don't call directly, called from withVertices1/2/3/4d()
   #withVertices (data, arrayType, dimension) {
      let gl = this.gl, glSet = this.glSet;
      this.bindVertexArray();
      glSet.vertexBuffer = GlArrayBuffer.createAndInitBuffer (gl, this.locationCount++, "vertices", data, arrayType, dimension);
      return this;
   }
   updateVertices(data, arrayType = Float32Array) {
      let vertexBuffer = this.glSet.vertexBuffer;
      console.assert (vertexBuffer, "vertex buffer not initialized. Call withVertices first");
      console.assert (!(data.length % vertexBuffer.dimension), `vertices length ${data.length} is not ${vertexBuffer.dimension}D`);
      this.bindVertexArray();
      vertexBuffer.bufferData (data, arrayType);
   }
   withVertices1d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 1); }
   withVertices2d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 2); }
   withVertices3d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 3); }
   withVertices4d(value, arrayType = Float32Array) { return this.#withVertices (value, arrayType, 4); }

   //don't call directly, called from withNormals1/2/3/4d
   #withNormals (data, arrayType, dimension) {
      if(this.glSet.normalsBuffer) throw new Error ("withNormals can be called only once. Call updateNormals* instead.");
      let gl = this.gl, glSet = this.glSet;
      this.bindVertexArray();
      glSet.normalsBuffer = GlArrayBuffer.createAndInitBuffer (gl, this.locationCount++, "normals", data, arrayType, dimension);

      return this;
   }

   updateNormals(data, arrayType = Float32Array) {
      this.bindVertexArray();
      this.glSet.normalsBuffer.bufferData( data, arrayType);
   }

   // called from withColors1/2/3/4d
   #withColors (data, arrayType, dimension) {
      if(this.glSet.colorsBuffer) throw new Error ("withColors can be called only once. Call updateColors* instead.");
      let gl = this.gl, glSet = this.glSet;
      this.bindVertexArray();
      glSet.colorsBuffer = GlArrayBuffer.createAndInitBuffer (gl, this.locationCount++, "colors", data, arrayType, dimension);
      return this;
   }

   updateColors (value, arrayType = Float32Array) {
      let [colorsBuffer, vertexBuffer] = [this.glSet.colorsBuffer, this.glSet.vertexBuffer];
      let gl = this.gl, glSet = this.glSet;
      console.assert (colorsBuffer.dimensionOk, `Color count ${colorsBuffer.length} is not ${colorsBuffer.dimension}D`);
      console.assert (vertexBuffer.count == colorsBuffer.count, `Color count ${colorsBuffer.count}, but vertex count is ${vertexBuffer.count}` );
      this.bindVertexArray();
      glSet.colorsBuffer.bufferData (ArrayUtil.toArrayType (value, arrayType)); //might actually not work
   }

   withNormals3d (data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 3); }
   withNormals4d (data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 4); }
   withColors3d  (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 3); }
   withColors4d  (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 4); }

   withConstTranslation (vec4) {
      this.glSet.constTranslation = vec4;
      return this;
   }

   //build program and get uniforms locations
   buildProgram () {
      let gl = this.gl, glSet = this.glSet;
      if (this.#program != null) return; //everything is already done
      let programBuilder = new ShaderProgramBuilder (gl);
      if (this.#programExternal)
         programBuilder.withProgramExternal (this.#programExternal);
      else
         programBuilder.withShaderSources (this.strategyAuto.build ()); //don't build shaders if program set externally

      programBuilder.withUniforms ([glSet.translation, glSet.lightDirection, ... this.#uniforms].filter(a => a)); //update uniformLocations of uniforms always

      this.#program  = programBuilder.buildProgram ();
      this.#uniforms = null; //in case of any other uniforms
      return this.#program;
   }

   logStrategyShaders (msg = null)
   {
      let shaderSources = this.strategyAuto.build ();
      if (msg) console.log (`${msg}`);
      console.log (`${shaderSources.vertexShaderSource}\n${shaderSources.fragmentShaderSource}`);
   }

   //triggers program build if none
   get programAuto () { if (this.#program == null) this.buildProgram (); return this.#program; }

   //bind context
   bindVertexArray () { this.gl.bindVertexArray (this.vao); }
   useProgram      () { this.gl.useProgram (this.programAuto); }
   bindAll         () { this.useProgram (); this.bindVertexArray(); }
   //bind context aliases
   bindVAO = this.bindVertexArray;
   bind    = this.bindAll;

   drawTriangleFan (start = 0) { this.drawArrays (this.gl.TRIANGLE_FAN, start, this.glSet.vertexBuffer.count); }
   drawTriangles (start = 0)   { this.drawArrays (this.gl.TRIANGLES,    start, this.glSet.vertexBuffer.count); }
   drawArrays (drawType, start, vertsCount) {
      let gl = this.gl;
      this.bindAll();
      gl.drawArrays       (drawType, start, vertsCount);
   }
}