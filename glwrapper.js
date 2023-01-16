class GlWrapper
{
   #glObj       = null;
   #canvasObj   = null;
   #programMap  = new Map();

   constructor (canvasVar)
   {
      this.#canvas = canvasVar;
      this.#extractShaderCodes();
      for (let progInfo of this.programs)
         this.#buildSingleGLProgram(progInfo);
   }
   

   #extractProgramInfo (el)
   {
      if(el.getAttribute("type") != "text/glsl-shader")
         return null;
      let programName = "___DEFAULT_PROGRAM___";
      if (el.hasAttribute("data-gl-program"))
         programName = el.getAttribute("data-gl-program");
      let type = el.getAttribute("data-gl-type");
      let code = el.innerText;
      return {id: programName, shader: {type: type, code: code}};
   }
   
   #extractShaderCodes ()
   {
      let scripts = this.canvas.getElementsByTagName("script");
      const shaders = document.evaluate("./script[@type='text/glsl-shader']", this.canvas);
      
      for (let el = shaders.iterateNext(); el; el = shaders.iterateNext())
      {
          let info = this.#extractProgramInfo(el);
          if (! this.programs.has(info.id) )
             this.programs.set (info.id, {id: info.id, shaders:[]});
          this.programs.get(info.id).shaders.push(info.shader);
      }
   }
   #buildSingeGLShader (shaderInfo)
   {
      console.log(JSON.stringify(shaderInfo));
      let shader = null;
      switch (shaderInfo.type)
      {
      case "vertex-shader":   shader = this.gl.createShader (this.gl.VERTEX_SHADER);   break;
      case "fragment-shader": shader = this.gl.createShader (this.gl.FRAGMENT_SHADER); break;
      default: throw "Unknown shader type: " + shaderInfo.type + "; program: " + name;
      }
      this.gl.shaderSource  (shader, shaderInfo.code);
      this.gl.compileShader (shader);
      //console.log ("Compile shader result:  " + name + ":vertex-shader: " + this.gl.getShaderInfoLog(shader));
      shaderInfo.shader = shader;
   }
   #buildSingleGLProgram(progInfo)
   {
      let name = progInfo[0];
      let prog = progInfo[1];
      let program = this.gl.createProgram ();
      for (let shaderInfo of prog.shaders)
      {
         this.#buildSingeGLShader (shaderInfo);
         this.gl.attachShader (program, shaderInfo.shader);
      }
      this.gl.linkProgram(program);
      //console.log("Compile program result:  " + name + ": " + this.gl.getProgramInfoLog(program));
      prog.program = program;
      for (let shaderInfo of prog.shaders) this.gl.deleteShader(shaderInfo.shader);
   }



   set #gl (glObj){this.#glObj = glObj;}
   get gl (){return this.#glObj;}
   set #canvas (canvasVar)
   {
      if (typeof canvasVar == "string")
          this.#canvasObj = document.getElementById(canvasVar);
      else if (typeof canvasVar == "object")
          this.#canvasObj = canvasVar;
      this.#gl = this.canvas.getContext('webgl2');
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
   }
   get canvas   () { return this.#canvasObj;  }
   get programs () { return this.#programMap; }
   get program  () { return this.programs.get("___DEFAULT_PROGRAM___").program; }
   get context  () { return {canvas: this.canvas, gl: this.gl, shaderProgram: this.program}; }

   getProgram   (progName) { return this.programs.get(progName).program; }
   getContext   (progName) { return {canvas: this.canvas, gl: this.gl, shaderProgram: this.getProgram (progName)}; }

}

