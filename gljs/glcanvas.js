"use strict";

class GlShader
{
   //type supported values
   //this lib recommended values          "vertex-shader",     "fragment-shader"
   //external twgl compatibility values   "x-shader/x-vertex", "x-shader/x-fragment"
   #glType = null;
   constructor (gl, obj, type)
   {
      this.source = "";
      this.gl     = gl;
      this.shader = null;
      if (type) this.type = type;
      if (!obj) return;
      if (typeof obj == "string") this.#setString(obj);
      else if (obj instanceof Element) this.#setScriptElement(obj);
      else if (obj instanceof WebGLShader) this.shader = obj;
   }

   //internal automatic full compile
   #compile()
   {
      this.shader = this.gl.createShader (this.#glType);
      this.gl.shaderSource  (this.shader, this.source);
      this.compileShader();
   }
   //private:
   #setString(str) //type ="vertex-shader"/"fragment-shader"
   {
      if (!str) {console.log("no string for shader to compile"); return;}
      this.source = str.trimStart();
      if (!this.type) return;
      if (this.type.length <= 0) return;
      this.#compile();
   }
   #setScriptElement(obj)
   {
      this.script = obj;
      let type = obj.getAttribute("data-gl-type");
      if (type) { if (type.length > 0) this.type = type; }
      this.#setString(obj.innerText);
   }
   #showResult ()
   {
      let shader = this.shader, gl = this.gl;  //shortcut
      //	let gl = this.gl;          //shortcut
      if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return;
      let msg = gl.getShaderInfoLog(shader);
      console.log("SHADER ERROR: " + msg);
   }

   //public:
   //this.shader
   //this.gl
   get type() { return this.#glType; }
   set type(str) //type ="vertex-shader"/"fragment-shader" or gl VERTEX_SHADER/FRAGMENT_SHADER
   {
      if (typeof str == "string")
         switch (str)
         {
         //this lib shader
         case "vertex-shader":       this.#glType = this.gl.VERTEX_SHADER;   break;
         case "fragment-shader":     this.#glType = this.gl.FRAGMENT_SHADER; break;
         //compatibility external types
         case "x-shader/x-vertex":   case "x-vertex":   this.#glType = this.gl.VERTEX_SHADER;   break;
         case "x-shader/x-fragment": case "x-fragment": this.#glType = this.gl.FRAGMENT_SHADER; break;
         default: throw "Unknown shader type: " + str;
         }
      else
         this.#glType = str; //if is gl type VERTEX_SHADER/VERTEX_SHADER
   }
   compileShader()
   {
      this.gl.compileShader (this.shader);
      this.#showResult();
   }
   deleteShader() { this.gl.deleteShader(this.shader); this.#glType = null; this.source = ""; this.shader = null;}
}
class GlBuffer
{
   constructor (gl, type, program, buffer, glDrawType)
   {
      this.gl = gl;
      this.type   = type;
      this.program = program;
      this.buffer = buffer;
      this.id = gl.createBuffer();
      if (buffer) this.arrayBuffer(buffer, glDrawType);
   }
   bindBuffer() { this.gl.bindBuffer(this.type, this.id); }
   arrayBuffer(buffer, glDrawType)
   {
      let gl = this.gl;
      let draw = gl.STATIC_DRAW;
      if (glDrawType) draw = glDrawType;
      this.bindBuffer ();
      gl.bufferData(this.type, buffer, draw);
      return this.id;
   }
   attrib (name, size, type, normalized = false, stride = 0, offset = 0)
   {
      this.bindBuffer();
      let id = this.gl.getAttribLocation (this.program, name);
      this.gl.vertexAttribPointer     (id, size, type, normalized, stride, offset);
      this.gl.enableVertexAttribArray (id);
      return id;
   }
}
class GlApi
{
   constructor (gl){this.gl = gl;}
   arrayBuffer (buffer, glDrawType)
   {
      let gl = this.gl;
      let glBuffer = new GlBuffer(gl, gl.ARRAY_BUFFER, this.program);//, buffer, glDrawType); ok
      glBuffer.arrayBuffer (buffer, glDrawType);
      return glBuffer;
   }
   indexBuffer(buffer, glDrawType)
   {
      let gl = this.gl;
      let glBuffer = new GlBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, this.program, buffer, glDrawType);
      //glBuffer.arrayBuffer (buffer, glDrawType); //two parameter above passed
      return glBuffer;
   }
   useProgram(){this.gl.useProgram(this.program);}
   uniformMatrix4fv (name)
   {
      this.useProgram();
      //this.bindBuffer();
      let id = this.gl.getUniformLocation (this.program, name);
      //this.gl.uniformMatrix4fv     (id, size, transpose, value);
      this.gl.enableVertexAttribArray (id);
      return id;
   }
}
class GlProgram extends GlApi
{
   #shaders = [];
   constructor (gl)
   {
      super(gl);
      this.program = this.gl.createProgram ();
   }
   add (shader, type)
   {
      if (!shader)
      {
         console.log("null shader");
         return;
      }
      if (shader instanceof GlShader)         this.#shaders.push(shader);
      else if (shader instanceof WebGLShader) this.#shaders.push(new GlShader(this.gl, shader));
      else if (shader instanceof Element)     this.#shaders.push(new GlShader(this.gl, shader, type));
      else if (typeof shader == "string")     this.#shaders.push(new GlShader(this.gl, shader, type));
   }
   #showResult ()
   {
      let program = this.program; //shortcut
      let gl = this.gl;           //shortcut
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      let msg = gl.getProgramInfoLog(program);
      if (this.name)
         console.log("PROGRAM ERROR [" + this.name + "]: " + msg);
      else
         console.log("CPROGRAM ERROR: " + msg);
   }
   linkProgram ()
   {
      let program = this.program;
      let gl = this.gl; //shortcut
      for (let shader of this.#shaders) gl.attachShader (program, shader.shader);
      gl.linkProgram(program);
      this.#showResult(program);
      for (let shader of this.#shaders) shader.deleteShader();
   }
   useProgram(){this.gl.useProgram(this.program);}
}
class GlVAObject extends GlApi
{
   //program WebGLProgram gl WebGL2RenderingContext
   constructor(context, program)
   {
      if (context instanceof WebGLProgram)
      {
         super(context);
         this.program = program;
      }
      else if (context instanceof GlCanvas)
      {
          super(context.gl);
          this.glCanvas  = context;
          this.program = context.program;
      }
      else if (context instanceof GlProgram)
      {
         super(context.gl);
         this.program  = context.program;
      }
      else
      {
         let shaders = program;
         let canvas  = new GlCanvas(context, shaders);
         super(canvas.gl);
         this.glCanvas = canvas;
         this.program  = canvas.program;
         //throw "GlSurface constructor: unknown context";
      }
      this.vao = this.gl.createVertexArray();
   }
   init(){}
   drawVao(){}
   bindVertexArray()
   {
      this.useProgram();
      this.gl.bindVertexArray(this.vao);
   }
   draw ()
   {
      this.bindVertexArray();
      this.drawVao();
   }
}

class GlCanvas
{
   #glObj                = null;
   #canvasObj            = null;
   #defaultProgramName   = "___DEFAULT_PROGRAM___";
   #programMap           = new Map();

   constructor (canvasVar, elementVars)
   {
      this.#canvas = canvasVar;
      this.#programMap.set (this.#defaultProgramName, new GlProgram(this.gl));
      this.#extractShaderCodes();
      this.#extractElementCodes(elementVars);
      for (let program of this.programs)
         program[1].linkProgram();
   }
   
   #prepareElement (el)
   {
      if (typeof el == "string") el = document.getElementById(el);
      if (el.getAttribute("type") && (el.getAttribute("type") != "text/glsl-shader")  )
      {
         if (!el.hasAttribute("data-gl-type"))
              el.setAttribute("data-gl-type", el.getAttribute("type"));
         else return null;
      }
      return el;
   }
   #extractProgramInfo (el)
   {
      el = this.#prepareElement (el);
      let programName = this.#defaultProgramName;
      if (el.hasAttribute("data-gl-program"))
          programName = el.getAttribute("data-gl-program");

      return {id: programName, shader: new GlShader(this.gl, el)};
   }
   #addScriptShader(el)
   {
      let info = this.#extractProgramInfo(el);
      if (! this.programs.has (info.id) )
            this.programs.set (info.id, new GlProgram(this.gl));
      this.programs.get(info.id).add(info.shader);
   }
   
   #extractElementCodes (elementVars)
   {
      if (!elementVars) return;
      for (let el of elementVars)
         this.#addScriptShader(el);
   }
   #extractShaderCodes ()
   {
      const shaderElements = document.evaluate("./script[@type='text/glsl-shader']", this.canvas);
      //const shaderElements = document.evaluate("./script[@type='text/glsl-shader']", this.canvas); //Add one more condition, for external script

      for (let el = shaderElements.iterateNext(); el; el = shaderElements.iterateNext())
         this.#addScriptShader(el);

   }

   set #gl (glObj){this.#glObj = glObj;}
   set #canvas (canvasVar)
   {
      if (typeof canvasVar == "string")
          this.#canvasObj = document.getElementById(canvasVar);
      else if (typeof canvasVar == "object")
          this.#canvasObj = canvasVar;
      this.#gl = this.canvas.getContext('webgl2');
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
   }

   //publig getter private setter
   get gl (){return this.#glObj;}
   get canvas   () { return this.#canvasObj;  }
   get programs () { return this.#programMap; }
   //default context and default program
   get glProgram  () { return this.programs.get(this.#defaultProgramName); }
   get program    () { return this.glProgram.program; }
   getGlProgram   (progName) { return this.programs.get (progName); }
   getProgram     (progName) { return this.getGlProgram (progName).program; }

}
