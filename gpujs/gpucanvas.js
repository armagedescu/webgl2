"use strict";

class GpuCanvas
{
   #pguObj               = null;
   #canvasObj            = null;
   #defaultProgramName   = "___DEFAULT_PROGRAM___";
   #programMap           = new Map();

   constructor (canvasVar, elementVars)
   {
      //this.#canvas = canvasVar;
      //this.#programMap.set (this.#defaultProgramName, new GlProgram(this.gl));
      //if (canvasVar instanceof  GlInfo) throw "GlInfo to be handled by offscrfeen";
      //this.#extractShaderCodes();
      //this.#extractElementCodes(elementVars);
      //
      //for (let program of this.programs)
      //   program[1].linkProgram();
   }

   //#prepareElement (el)
   //{
   //   if (typeof el == "string") el = document.getElementById(el);
   //   if (!el.hasAttribute("data-gl-type"))
   //      if (el.hasAttribute("type") && (el.getAttribute("type") != "text/glsl-shader")  )
   //      {
   //         let type = GlShader.translateType(el.getAttribute("type"));
   //         if (type) el.setAttribute("data-gl-type", type);
   //      }
   //   if (el.hasAttribute("data-gl-type")) return el;
   //   return null; //since now a recognisable attribute "data-gl-type" is a must, otherwise it is not gl shader
   //}
   //#extractProgramInfo (el)
   //{
   //   el = this.#prepareElement (el);
   //   let programName = this.#defaultProgramName;
   //   if (el.hasAttribute("data-gl-program"))
   //       programName = el.getAttribute("data-gl-program");
   //   return {id: programName, shader: new GlShader(this.gl, el)};
   //}
   //#addScriptShader(el)
   //{
   //   let info = this.#extractProgramInfo(el);
   //   if (! this.programs.has (info.id) )
   //         this.programs.set (info.id, new GlProgram(this.gl));
   //   if (info.shader)
   //       this.programs.get(info.id).add(info.shader);
   //}
   //
   //#extractElementCodes (elementVars)
   //{
   //   if (!elementVars) return;
   //   for (let el of elementVars)
   //      this.#addScriptShader(el);
   //}
   //#extractShaderCodes ()
   //{
   //   const shaderElements = document.evaluate("./script[@type='text/glsl-shader']", this.canvas);
   //   //const shaderElements = document.evaluate("./script[@type='text/glsl-shader']", this.canvas); //Add one more condition, for external script
   //
   //   for (let el = shaderElements.iterateNext(); el; el = shaderElements.iterateNext())
   //      this.#addScriptShader(el);
   //
   //}
	//
   //set #gl (glObj){this.#glObj = glObj;}
   //set #canvas (canvasVar)
   //{
   //   if (typeof canvasVar == "string")
   //       this.#canvasObj = document.getElementById(canvasVar);
   //   else if (typeof canvasVar == "object")
   //       this.#canvasObj = canvasVar;
   //   this.#gl = this.canvas.getContext('webgl2');
   //   this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
   //}
	//
   ////publig getter private setter
   //get gl (){return this.#glObj;}
   //get canvas   () { return this.#canvasObj;  }
   //get programs () { return this.#programMap; }
   ////default context and default program
	//
   //#ProgName (progName) {if (progName) return progName; return this.#defaultProgramName;}
   //get glProgram  () { return this.programs.get( this.#ProgName () ); }
   //get program    () { return this.glProgram.program; }
   //getGlProgram   (progName) { return this.programs.get (this.#ProgName (progName)); } //defaults to
   //getProgram     (progName) { return this.getGlProgram (progName).program; } //defaults to
   //useProgram     (progName) { this.getGlProgram (progName).useProgram(); } //defaults to

}