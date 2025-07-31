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

   get decl       () { return `vec${this.dimension} ${this.name}`; }
   get nameVary () { return `${this.name}Vary` }
   get declVary () { return `vec${this.dimension} ${this.nameVary}`; }
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
class ShaderStrategy {
   vsBuilder     = new VertexShaderGLSL300SourceBuilder   ();
   fsBuilder     = new FragmentShaderGLSL300SourceBuilder ();
   #precision    = "mediump float";
   #constColor = {name: "constColor", value: [ 0.0,  0.0,  0.0,  0.1]};
   #constLightDireciton = null;
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
   withNoDefaultColor () { this.#constColor = null; return this; }
   withConstLightDireciton (dvalue = [-1.0, -1.0,  1.0], dname = "lightDirection") {
      ArrayUtil.validateType (dvalue); 
      this.#constLightDireciton  = {name: dname, value: dvalue};
      return this;
   }
   withVertexBuffer  (vertexBuffer)  { this.vertexBuffer  = vertexBuffer;  return this; }
   withNormalsBuffer (normalsBuffer) { this.normalsBuffer = normalsBuffer; return this; }
   withColorsBuffer  (colorsBuffer)  { this.colorsBuffer  = colorsBuffer;  return this.withNoDefaultColor (); }
   withStaticTranslation (vec4) {
      this.staticTranslation = vec4;
      return this;
   }

   build () {
      if (!this.vertexBuffer)
         throw new Error ("Static translation requires Vertex Buffer: call withVertexBuffer before withStaticTranslation");
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
      if (this.normalsBuffer     && this.#constColor)  return "0010";
      if (this.staticTranslation && this.#constColor)  return "0002";
      if (this.vertexBuffer      && this.#constColor)  return "0001";
      //if (this.#constColor)                           return "0000";
   }
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
   }
   strategy_0100 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      //if (!this.#constLightDireciton) this.withConstLightDireciton ();

      this.addDeclarations();
      //let strPosOut = `${ArrayUtil.buildFloatStrings (this.staticTranslation).join (", ")}`;
      vsBuilder.addMain  (`   gl_Position = ${this.vertexBuffer.vec4()};`);
      vsBuilder.addMain  (`   ${this.colorsBuffer.nameVary} = ${this.colorsBuffer.name};`);

      //fsBuilder.addMain  (`   float prod = -dot (${this.#constLightDireciton.name}, normalize (${this.normalsBuffer.nameVary}) );`);
      //fsBuilder.addHead  (`const vec3 greenColor = vec3(0.0,  1.0,  0.0);`);//
      fsBuilder.addMain  (`   fragColor = ${this.colorsBuffer.nameVary};`);
   }
   strategy_0010 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      if (!this.#constLightDireciton) this.withConstLightDireciton ();

      this.addDeclarations();
      //let strPosOut = `${ArrayUtil.buildFloatStrings (this.staticTranslation).join (", ")}`;
      vsBuilder.addMain  (`   gl_Position = ${this.vertexBuffer.vec4()};`);
      vsBuilder.addMain  (`   ${this.normalsBuffer.nameVary} = ${this.normalsBuffer.name};`);

      fsBuilder.addMain  (`   float prod = -dot (${this.#constLightDireciton.name}, normalize (${this.normalsBuffer.nameVary}) );`);
      //fsBuilder.addHead  (`const vec3 greenColor = vec3(0.0,  1.0,  0.0);`);//
      fsBuilder.addMain  (`   fragColor = vec4 (${this.#constColor.name}.rgb * prod,  1.0);`);
   }
   strategy_0002 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      this.addDeclarations();
      let strPosOut = `${ArrayUtil.buildFloatStrings (this.staticTranslation).join (", ")}`;
      vsBuilder.addMain  (`   gl_Position = vec4(${strPosOut}) + ${this.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   strategy_0001 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      this.addDeclarations();
      vsBuilder.addMain  (`   gl_Position = ${this.vertexBuffer.vec4()};`);
      this.strategy_0000 ();
   }
   strategy_0000 () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      fsBuilder.addMain (`   fragColor = vec4 (${this.#constColor.name});`);
   }
   buildCandidate () {
      let [vsBuilder, fsBuilder] = [ this.vsBuilder, this.fsBuilder ];
      for (let builder of [vsBuilder, fsBuilder] ) builder.reset();

      switch (this.getStrategy ()) {
      case "0000": this.strategy_0000 (); break;
      case "0001": this.strategy_0001 (); break;
      case "0002": this.strategy_0002 (); break;
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
class VertexShaderGLSL300SourceBuilder   extends ShaderGLSL300SourceBuilder { constructor (){super();} }
class FragmentShaderGLSL300SourceBuilder extends ShaderGLSL300SourceBuilder { constructor (){super();} }

// this wraps OpenGL VAO, VBO, Uniforms
class GlShapev1
{
   locationCount = 0;

   strategy = new ShaderStrategy ();

   constructor (canvas) {
      let gl   = canvas.getContext('webgl2');
      this.gl  = gl;
      this.vao = gl.createVertexArray();
   }
   withConstColor(dvalue = [ 0.0,  0.0,  0.0,  0.1], dname = "constColor") { ArrayUtil.validateType (dvalue); this.strategy.withConstColor(dvalue, dname); return this; }
   withConstLightDireciton (dvalue = [-1.0, -1.0,  1.0], dname = "lightDirection") {
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
      //console.assert (!(this.#vertices.length % this.dimension), `normals dimention ${this.#vertices.length} is not ${this.dimension}D`);
      this.gl.bindVertexArray(this.vao);
      let data = ArrayUtil.toArrayType (value, arrayType);
      this.colorsBuffer.bufferData (data); //might actually not work
   }

   withNormals3d(data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 3); }
   withNormals4d(data, arrayType = Float32Array) { return this.#withNormals (data, arrayType, 4); }
   withColors3d (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 3); }
   withColors4d (data, arrayType = Float32Array) { return this.#withColors  (data, arrayType, 4); }

   withStaticTranslation (vec4) {
      this.strategy.withStaticTranslation (vec4);
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

   logStrategyShaders (msg = "")
   {
      let shaderSources = this.strategy.build ();
      console.log (`${msg}\nVertex Shader:\n${shaderSources.vertexShaderSource}\nFragment Shader:\n${shaderSources.fragmentShaderSource}`);
   }
   linkProgram () {
      if (this.program) return; //program might be set externally
      ////No need to separate this yet:
      let cprogram = new GlProgram (this.gl);
      let shaderSources = this.strategy.build ();
      
      cprogram.addVertexShader   (shaderSources.vertexShaderSource);
      cprogram.addFragmentShader (shaderSources.fragmentShaderSource);

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
      let start = 0;
      this.drawArrays (this.gl.TRIANGLES, start, this.vertexBuffer.count);
   }

   //this function is not used
   #drawArraysJustDraw = (drawType, start, vertsCount) => {
      let gl = this.gl;
      gl.useProgram       (this.program);
      gl.bindVertexArray  (this.vao);
      gl.drawArrays       (drawType, start, vertsCount);
   }
}