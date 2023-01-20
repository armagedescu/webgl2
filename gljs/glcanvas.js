class GlShader
{
   #glType = null;
   constructor (gl, obj, type) //type ="vertex-shader"/"fragment-shader"
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
	  this.source = str;
      if (!this.type) return;
      if (this.type.length <= 0) return;
	  this.#compile();
   }
   #setScriptElement(obj)
   {
      let type = obj.getAttribute("data-gl-type");
	  if (type) { if (type.length > 0) this.type = type; }
	  this.#setString(obj.innerText);
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
         case "vertex-shader":   this.#glType = this.gl.VERTEX_SHADER;   break;
         case "fragment-shader": this.#glType = this.gl.FRAGMENT_SHADER; break;
         default: throw "Unknown shader type: " + str;
         }
      else
         this.#glType = str; //if is gl type VERTEX_SHADER/VERTEX_SHADER
   }
   compileShader()
   {
      this.gl.compileShader (this.shader);
	  let msg = this.gl.getShaderInfoLog(this.shader);
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
   linkProgram()
   {
      for (let shader of this.#shaders) this.gl.attachShader (this.program, shader.shader);
      this.gl.linkProgram(this.program);
      //console.log("Compile program result:  " + name + ": " + this.gl.getProgramInfoLog(program));
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
	  else if (context instanceof GlProgram)
      {
         super(context.gl);
         this.program = context.program;
	  }
	  else
         throw "GlSurface constructor: unknown context";
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
   #glObj       = null;
   #canvasObj   = null;
   #programMap  = new Map();

   constructor (canvasVar)
   {
      this.#canvas = canvasVar;
      this.#extractShaderCodes();
      for (let program of this.programs)
         program[1].linkProgram();
   }
   

   #extractProgramInfo (el)
   {
      if(el.getAttribute("type") != "text/glsl-shader")
         return null;
      let programName = "___DEFAULT_PROGRAM___";
      if (el.hasAttribute("data-gl-program"))
         programName = el.getAttribute("data-gl-program");

      return {id: programName, shader: new GlShader(this.gl, el)};
   }
   
   #extractShaderCodes ()
   {
      let scripts = this.canvas.getElementsByTagName("script");
      const shaderElements = document.evaluate("./script[@type='text/glsl-shader']", this.canvas);
      
      for (let el = shaderElements.iterateNext(); el; el = shaderElements.iterateNext())
      {
          let info = this.#extractProgramInfo(el);
          if (! this.programs.has(info.id) )
             this.programs.set (info.id, new GlProgram(this.gl));
          this.programs.get(info.id).add(info.shader);
      }
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
   get program  () { return this.programs.get("___DEFAULT_PROGRAM___"); }
   getProgram   (progName) { return this.programs.get(progName); }

}

