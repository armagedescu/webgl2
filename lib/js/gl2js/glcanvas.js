"use strict";

class GlShader
{
   //type supported values
   //this lib recommended values          "vertex-shader",     "fragment-shader"
   //external twgl compatibility values   "x-shader/x-vertex", "x-shader/x-fragment"
   static shaderMap = new Map(
   [
      ["vertex-shader",                        "vertex-shader"],
      ["x-vertex",                             "vertex-shader"],
      ["x-shader/x-vertex",                    "vertex-shader"],
      ["fragment-shader",                      "fragment-shader"],
      ["x-fragment",                           "fragment-shader"],
      ["x-shader/x-fragment",                  "fragment-shader"]
   ]);
   
   static translateType (str, gl)
   {
      if (typeof(str) != 'string' && (str == gl.VERTEX_SHADER || str == gl.FRAGMENT_SHADER))
         return str;
      if (!GlShader.shaderMap.has(str)) throw "Unknown shader type: " + str;
      switch ( GlShader.shaderMap.get(str) )
      {
      case "vertex-shader":       return gl.VERTEX_SHADER;
      case "fragment-shader":     return gl.FRAGMENT_SHADER;
      }
      throw "Unknown shader type: " + str;
   }
   //TODO: not used isAsynk
   isAsynk = false;
   #glType = null;
   constructor (gl, obj, type)
   {
      this.source = "";
      this.gl     = gl;
      this.shader = null;
      if (type) this.type = type;
      if (!obj) return;
      if (typeof obj == "string") this.#setString (obj);
      else if (obj instanceof Element) this.#setScriptElement (obj);
      else if (obj instanceof WebGLShader) this.shader = obj;
   }

   //internal automatic full compile
   #compile ()
   {
      this.shader = this.gl.createShader (this.#glType);
      this.gl.shaderSource  (this.shader, this.source);
      this.compileShader();
   }
   //private:
   #setString (str) //type = go.VERTEX_SHADER/gl.VERTEX_SHADER
   {
      if (!str) {console.log ("no string for shader to compile"); return;}
      this.source = str.trimStart ();
      if (!this.type) return;
      if (this.type.length <= 0) return;
      this.#compile ();
   }
   #setScriptElement (obj)
   {
      this.script = obj;
      let type = obj.dataset.glType; //same as getAttribute("data-gl-type");
      if (type) { if (type.length > 0) this.type = type; }
      let text = obj.innerText;
      if (!text) text = "";
      text = text.trimStart ();
      this.#setString (text);
   }
   #showResult ()
   {
      let shader = this.shader, gl = this.gl;  //shortcuts
      if (gl.getShaderParameter (shader, gl.COMPILE_STATUS)) return;
      let msg = gl.getShaderInfoLog (shader);
      console.log ("SHADER ERROR: " + msg);
   }

   //public:
   //this.shader
   //this.gl
   get type () { return this.#glType; }
   set type (str) //type ="vertex-shader"/"fragment-shader" or gl VERTEX_SHADER/FRAGMENT_SHADER
   {
      this.#glType = GlShader.translateType (str, this.gl); //if is gl type VERTEX_SHADER/VERTEX_SHADER
   }
   compileShader ()
   {
      this.gl.compileShader (this.shader);
      this.#showResult ();
   }
   deleteShader ()
   {
      this.gl.deleteShader (this.shader);
      this.#glType = null;
      this.source = "";
      this.shader = null;
   }
}

class GlBuffer
{
   constructor (gl, type, program, buffer, glDrawType)
   {
      this.gl       = gl;
      this.type     = type;
      this.program  = program;
      this.buffer   = buffer;
      this.id       = gl.createBuffer ();
      if (buffer) this.arrayBuffer (buffer, glDrawType);
   }
   bindBuffer () { this.gl.bindBuffer(this.type, this.id); }
   arrayBuffer (buffer, glDrawType)
   {
      let gl = this.gl;
      let draw = gl.STATIC_DRAW;
      if (glDrawType) draw = glDrawType;
      this.bindBuffer ();
      gl.bufferData (this.type, buffer, draw);
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

//TODO: review
//base class for GlProgram, GlVAObject, GlVAObjectAsync
class GlApi
{
   constructor (gl){this.gl = gl;}
   arrayBuffer (buffer, glDrawType)
   {
      let gl = this.gl;
      let glBuffer = new GlBuffer (gl, gl.ARRAY_BUFFER, this.program);//, buffer, glDrawType); ok
      glBuffer.arrayBuffer (buffer, glDrawType);
      return glBuffer;
   }
   indexBuffer (buffer, glDrawType)
   {
      let gl = this.gl;
      let glBuffer = new GlBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, this.program, buffer, glDrawType);
      //glBuffer.arrayBuffer (buffer, glDrawType); //two parameter above passed
      return glBuffer;
   }
   useProgram (){this.gl.useProgram (this.program);}
   uniformMatrix4fv (name)
   {
      this.useProgram ();
      //this.bindBuffer ();
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
      if (shader instanceof GlShader)         this.#shaders.push (shader);
      else if (shader instanceof WebGLShader) this.#shaders.push (new GlShader (this.gl, shader));
      else if (shader instanceof Element)     this.#shaders.push (new GlShader (this.gl, shader, type));
      else if (typeof shader == "string")     this.#shaders.push (new GlShader (this.gl, shader, type));
   }
   #showResult ()
   {
      let program = this.program; //shortcut
      let gl = this.gl;           //shortcut
      if (gl.getProgramParameter (program, gl.LINK_STATUS)) return;
      let msg = gl.getProgramInfoLog (program);
      if (this.name)
         console.log ("PROGRAM ERROR [" + this.name + "]: " + msg);
      else
         console.log ("CPROGRAM ERROR: " + msg);
   }
   linkProgram ()
   {
      let program = this.program;
      let gl = this.gl; //shortcut
      for (let shader of this.#shaders) gl.attachShader (program, shader.shader);
      gl.linkProgram (program);
      this.#showResult (program);
      for (let shader of this.#shaders) shader.deleteShader ();
   }
   useProgram (){this.gl.useProgram (this.program);}
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
      else if (context instanceof WebGL2RenderingContext)
      {
          super(context);
          if (program instanceof WebGLProgram) this.program = program;
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
         let canvas  = new GlCanvas (context, shaders);
         super(canvas.gl);
         this.glCanvas = canvas;
         this.program  = canvas.program;
         //throw "GlSurface constructor: unknown context";
      }
      this.vao = this.gl.createVertexArray ();
      console.log ("this vao created" + this.vao);
   }
   init (){}
   drawVao (){}
   bindVertexArray ()
   {
      this.useProgram();
      this.gl.bindVertexArray (this.vao);
   }
   draw ()
   {
      this.bindVertexArray ();
      this.drawVao ();
   }
}

class GlCanvas
{
   #glObj                = null;
   #canvasObj            = null;
   #defaultProgramName   = "___DEFAULT_PROGRAM___";
   #programMap           = new Map(); //TODO: decouple progran logic from canvas

   constructor (canvasVar, elementVars)
   {
      if  (!canvasVar) throw new Error ("GlCanvas::constructor (canvasVar) must be HTMLCanvasElement or HTMLCanvasElement id string");
      this.#canvas = canvasVar;
      this.#programMap.set (this.#defaultProgramName, new GlProgram (this.gl)); //insert into map
      if (canvasVar instanceof  GlInfo) throw "GlInfo to be handled by offscrfeen";
      this.#extractShaderCodes ();
      this.#extractElementCodes (elementVars);
      
      for (let program of this.programs)
         program[1].linkProgram ();
   }

   #prepareElement (el)
   {
      if (typeof el == "string") el = document.getElementById (el);
      if (!el.hasAttribute ("data-gl-type"))
         if (el.hasAttribute ("type") && (el.getAttribute ("type") != "text/glsl-shader")  )
         {
            let type = GlShader.translateType (el.getAttribute("type"), this.gl);
            if (type) el.setAttribute ("data-gl-type", type);
         }
      if (el.hasAttribute ("data-gl-type")) return el;
      return null; //since now a recognisable attribute "data-gl-type" is a must, otherwise it is not gl shader
   }
   #extractProgramInfo (el)
   {
      el = this.#prepareElement (el);
      let programName = this.#defaultProgramName;
      if (el.hasAttribute ("data-gl-program"))
          programName = el.getAttribute ("data-gl-program");
      return {id: programName, shader: new GlShader (this.gl, el)};
   }
   #addScriptShader (el)
   {
      let info = this.#extractProgramInfo (el);
      if (! this.programs.has (info.id) )
            this.programs.set (info.id, new GlProgram (this.gl));
      if (info.shader)
          this.programs.get (info.id).add (info.shader);

      //console.log(info.id + ": " + el.innerText);
   }
   
   #extractElementCodes (elementVars)
   {
      if (!elementVars) return;
      for (let el of elementVars)
         this.#addScriptShader (el);
   }
   #extractShaderCodes ()
   {
      const shaderElements = document.evaluate ("./script[@type='text/glsl-shader']", this.canvas);
      //const shaderElements = document.evaluate("./script[@type='text/glsl-shader']", this.canvas); //Add one more condition, for external script
   
      for (let el = shaderElements.iterateNext (); el; el = shaderElements.iterateNext ())
         this.#addScriptShader (el);
   
   }

   set #gl (glObj) {this.#glObj = glObj;}
   set #canvas (canvasVar)
   {
      if (typeof canvasVar == "string")
          this.#canvasObj = document.getElementById (canvasVar);
      else if (typeof canvasVar == "object")
          this.#canvasObj = canvasVar;
      if  (!this.canvas)  throw new Error ("GlCanvas::canvas must be NOT NULL HTMLCanvasElement");
      if  (!this.canvas instanceof HTMLCanvasElement) throw new Error ("GlCanvas::canvas must be HTMLCanvasElement");
      this.#gl = this.canvas.getContext ('webgl2');
      this.gl.viewport (0, 0, this.canvas.width, this.canvas.height);
   }

   //publig getter private setter
   get gl       () { return this.#glObj;      }
   get canvas   () { return this.#canvasObj;  }
   get programs () { return this.#programMap; }
   //default context and default program

   #ProgName (progName) {if (progName) return progName; return this.#defaultProgramName;}
   get glProgram  () { return this.programs.get( this.#ProgName () ); }
   get program    () { return this.glProgram.program; }
   getGlProgram   (progName) { return this.programs.get (this.#ProgName (progName)); } //defaults to
   getProgram     (progName) { return this.getGlProgram (progName).program; }          //defaults to
   useProgram     (progName) { this.getGlProgram (progName).useProgram(); }            //defaults to

}


class GlVAObjectAsync extends GlApi
{
   #p = null;
   constructor (context, program)
   {
      super (context.canvas.getContext ('webgl2'));
      this.#p = new GlCanvasAsync (context);
   }

   async ready ()
   {
      await this.#p.ready ().then ( (ref) =>
      {
         this.vao = this.gl.createVertexArray ();
         this.program  = ref.program;
      } );
      return this;
   }
   init (){}
   drawVao (){}
   bindVertexArray ()
   {
      this.useProgram();
      this.gl.bindVertexArray (this.vao);
   }
   draw ()
   {
      this.bindVertexArray ();
      this.drawVao ();
   }
}

class GlCanvasAsync
{
   #glObj                = null;
   #canvasObj            = null;
   #defaultProgramName   = "___DEFAULT_PROGRAM___";
   #programMap           = new Map();
   #context = null;
   #downloadable = []; //shaders by URL
   #bysource     = []; //shaders by Source
   #p = null;
   constructor (context)
   {
      this.#canvas = context.canvas;
      this.#programMap.set (this.#defaultProgramName, new GlProgram (this.gl));
      this.#context = context;
      this.#bysourceShaders ();
      this.#downloadShaders ();

   }
   async ready ()
   {
      //await Promise.allSettled(this.#downloadable);
      await Promise.all (this.#downloadable).then( (values) =>
      {
         for (let val of [... values, ...this.#bysource] )
         {
            if (! this.programs.has (val.program) )
               this.programs.set (val.program, new GlProgram (this.gl));
            this.programs.get (val.program).add (new GlShader (this.gl, val.text, val.type));
         }
         for (let program of this.programs)
            program[1].linkProgram ();
      });
      return this;
   }
   #downloadShaders ()
   {
      for (let info of this.#context.byUrl)
      {
         let progInfo =
             {
                program : this.#defaultProgramName,
                type    : GlShader.translateType (info.type, this.gl),
                text    : null,
             };
         if (info.program) progInfo.program = info.program;
         this.#downloadable.push
         (
            fetch(info.href, {cache: "no-store"}).then ((resp) =>
            {
               return resp.text();
            }).then( (text) =>
            {
               progInfo.text = text;
               return progInfo;
            })
         );
      }
      /* //old style ajax
      var req = new XMLHttpRequest();
      req.addEventListener("load", (event) => 
      {
         console.log( event.target.getAllResponseHeaders() );
      });
      req.open("GET", "./lib/js/general/api.js");
      req.send();
      //*/
   }
   #bysourceShaders ()
   {//{program: glProgramName, type: glType,            src: src}
      for (let info of this.#context.bySrc)
      {
         let progInfo =
            {
               program : this.#defaultProgramName,
               type    : GlShader.translateType (info.type, this.gl),
               text    : info.src,
            };
         if (info.program) progInfo.program = info.program;
         this.#downloadable.push (progInfo);
      }
   }

   set #gl (glObj){this.#glObj = glObj;}
   set #canvas (canvasVar)
   {
      if (typeof canvasVar == "string")
          this.#canvasObj = document.getElementById (canvasVar);
      else if (typeof canvasVar == "object")
          this.#canvasObj = canvasVar;
      this.#gl = this.canvas.getContext ('webgl2');
      this.gl.viewport (0, 0, this.canvas.width, this.canvas.height);
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


class GlInfo
{
   byUrl  = []; //{program: glProgramName, type: glType, href: href}
   bySrc  = []; //{program: glProgramName, type: glType,            src: src}
   canvas = null;
}
class GlInfoGrabber
{
   glinfo = new GlInfo();
   constructor (canvas)
   {
      this.url = window.location;
      this.currentdir = new URL(this.url.pathname.replace( /\/[^\/]*$/, '/'), this.url.origin);
      if (canvas) this.grabInfo(canvas);
   }
   grabInfo (canvas)
   {
      let elements = document.evaluate ("./script[@type='text/glsl-shader' and @data-gl-src]", canvas);
      for (let el = elements.iterateNext (); el; el = elements.iterateNext ())
         this.glinfo.byUrl.push ({program: el.dataset.glProgram, type: el.dataset.glType, href:  this.buildUrl (el.dataset.glSrc)  } );
      elements = document.evaluate ("./script[@type='text/glsl-shader' and not (@data-gl-src)]", canvas);
      for (let el = elements.iterateNext (); el; el = elements.iterateNext ())
         this.glinfo.bySrc.push ({program: el.dataset.glProgram, type: el.dataset.glType, src: el.innerText.trim ()});

   }
   buildUrl (ref)
   {
      return new URL(ref, this.currentdir).href;
   }
   
}


class GlTexture2D
{
   #p = null;
   constructor(gl, dataPromise)
   {
      this.gl = gl;
      this.#p = dataPromise;
      this.texture = gl.createTexture ();
      this.type = gl.TEXTURE_2D;
      this.init ();
   }
   init (){}
   async ready ()
   {
      //TODO: get rid of #p
      //promise chaining
      if (this.#p) return this.#p.then( (img) =>
         {
            this.image = img;
            this.bindTexture ();
            this.texImage2D ();
            this.gl.generateMipmap (this.type);
            return this
         });
      return this;
   }
   texImage2D()
   {
      let gl = this.gl;
      gl.texImage2D     (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
   }
   bindTexture (){this.gl.bindTexture (this.type, this.texture);}
}


class GlVideoTexture2D
{
   #p = null;
   constructor (gl, dataPromise)
   {
      this.gl = gl;
      this.#p = dataPromise;

      this.texture = gl.createTexture ();
      this.type = gl.TEXTURE_2D;
      this.init ();
   }
   init (){}
   async ready ()
   {
      await this.#p.then ( (vd) =>
      {
         this.video = vd;
         this.texImage2DInit ();
         this.gl.generateMipmap (this.type);
      });
      return this;
   }
   texImage2DInit ()
   {
      this.bindTexture ();
      let gl = this.gl;
      gl.texImage2D ( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

      gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
      gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
      gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   }
   texImage2DUpdate ()
   {
      this.bindTexture ();
      let gl = this.gl;
      gl.texImage2D     (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
   }
   bindTexture (){this.gl.bindTexture (this.type, this.texture);}
   update ()
   {
      this.texImage2DUpdate ();
   }
}
