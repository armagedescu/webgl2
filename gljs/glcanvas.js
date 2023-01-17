class GlShader
{
   #glType = null;
   constructor (gl, obj, type) //type ="vertex-shader"/"fragment-shader"
   {
      this.source = "";
      this.gl     = gl;
	  if (type) this.type = type;
      if (!obj) return;
      if (typeof obj == "string") this.#setString(obj);
      else if (typeof obj == "object") this.#setScriptElement(obj);
   }

   //private:
   #setString(str) //type ="vertex-shader"/"fragment-shader"
   {
	  this.source = str;
      if (!this.type) return;
      if (this.type.length <= 0) return;
	  this.compile();
   }
   #setScriptElement(obj)
   {
      let type = obj.getAttribute("data-gl-type");
	  if (type) { if (type.length > 0) this.type = type; }
	  this.#setString(obj.innerText);
   }

   //public:
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
   compile()
   {
      this.shader = this.gl.createShader (this.#glType);
      this.gl.shaderSource  (this.shader, this.source);
      this.gl.compileShader (this.shader);
	  let msg = this.gl.getShaderInfoLog(this.shader);
      //console.log ("Compile shader result:  " + name + ":vertex-shader: " + this.gl.getShaderInfoLog(this.shader));
   }
   deleteShader() { this.gl.deleteShader(this.shader); }
}

class GlProgram
{
   constructor (gl)
   {
      this.gl = gl;
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
         this.#buildSingleGLProgram(program);
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
      const shaders = document.evaluate("./script[@type='text/glsl-shader']", this.canvas);
      
      for (let el = shaders.iterateNext(); el; el = shaders.iterateNext())
      {
          let info = this.#extractProgramInfo(el);
          if (! this.programs.has(info.id) )
             this.programs.set (info.id, {id: info.id, program: new GlProgram(this.gl), shaders:[]}); // {id/key {id, []}/value} map
          this.programs.get(info.id).shaders.push(info.shader);
      }
   }
   #buildSingleGLProgram(progInfo)
   {
      let name = progInfo[0];
      let prog = progInfo[1];
      let program = this.gl.createProgram ();
      for (let shader of prog.shaders) this.gl.attachShader (program, shader.shader);
      this.gl.linkProgram(program);
      //console.log("Compile program result:  " + name + ": " + this.gl.getProgramInfoLog(program));
      prog.program = program;
      for (let shader of prog.shaders) shader.deleteShader();
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
   get program  () { return this.programs.get("___DEFAULT_PROGRAM___").program; }
   get context  () { return {canvas: this.canvas, gl: this.gl, shaderProgram: this.program}; }
   //if more than one single program are being in use
   getProgram   (progName) { return this.programs.get(progName).program; }
   getContext   (progName) { return {canvas: this.canvas, gl: this.gl, shaderProgram: this.getProgram (progName)}; }

}

