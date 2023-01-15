function buildGlProgram (canvasVar)
{
   let canvas = null;
   let gl = null;
   if (typeof canvasVar == "string")
       canvas = document.getElementById(canvasVar);
   else if (typeof canvasVar == "object")
       canvas = canvasVar;

   gl = canvas.getContext('webgl2');
   gl.viewport(0, 0, canvas.width, canvas.height);

   let programs = getGLShaderCodes (canvas);

   for (let progInfo of programs)
      buildSingleGLProgram(gl, progInfo);

   if (programs.has("___DEFAULT_PROGRAM___")) shaderProgram = programs.get("___DEFAULT_PROGRAM___").program;
   //gl.useProgram   (shaderProgram);

   return {canvas:canvas, gl:gl, shaderProgram:shaderProgram};
}

function buildSingeGLShader (gl, shaderInfo)
{
   let shader = null;
   switch (shaderInfo.type)
   {
   case "vertex-shader":   shader = gl.createShader (gl.VERTEX_SHADER);   break;
   case "fragment-shader": shader = gl.createShader (gl.FRAGMENT_SHADER); break;
   default: throw "Unknown shader type: " + shaderInfo.type + "; program: " + name;
   }
   gl.shaderSource  (shader, shaderInfo.code);
   gl.compileShader (shader);
   //console.log ("Compile shader result:  " + name + ":vertex-shader: " + gl.getShaderInfoLog(shader));
   shaderInfo.shader = shader;
}
function buildSingleGLProgram(gl, progInfo)
{
   let name = progInfo[0];
   let prog = progInfo[1];
   let program = gl.createProgram ();
   for (let shaderInfo of prog.shaders)
   {
      buildSingeGLShader (gl, shaderInfo);
      gl.attachShader (program, shaderInfo.shader);
   }
   gl.linkProgram(program);
   //console.log("Compile program result:  " + name + ": " + gl.getProgramInfoLog(program));
   prog.program = program;
   for (let shaderInfo of prog.shaders) gl.deleteShader(shaderInfo.shader);
}

function extractProgramInfo (el)
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

function getGLShaderCodes (canvas)
{
    let scripts = canvas.getElementsByTagName("script");
    let glPrograms = new Map();

    for (el of scripts)
    {
        let info = extractProgramInfo(el);
        if (info == null) continue;
        if (! glPrograms.has(info.id) )
           glPrograms.set (info.id, {id: info.id, shaders:[]});
        glPrograms.get(info.id).shaders.push(info.shader);
    }
    if (glPrograms.size == 0) return null;

    return glPrograms;

}
