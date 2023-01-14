function buildGlProgram(canvasVar)
{
   let canvas = null;
   let gl = null;
   if (typeof canvasVar == "string")
       canvas = document.getElementById(canvasVar);
   else if (typeof canvasVar == "object")
       canvas = canvasVar;
   gl = canvas.getContext('webgl2');
   gl.viewport(0, 0, canvas.width, canvas.height);

   let canvas_id = canvas.id;
   let codes = getGLShaderCodes (canvas);

   let vertCode   = codes.vertCode;
   let vertShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertShader, vertCode);
   gl.compileShader(vertShader);

   let fragCode   = codes.fragCode;
   let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
   gl.shaderSource(fragShader, fragCode);
   gl.compileShader(fragShader);

   let shaderProgram = gl.createProgram();
   gl.attachShader (shaderProgram, vertShader);
   gl.attachShader (shaderProgram, fragShader);
   gl.linkProgram  (shaderProgram);
   gl.useProgram   (shaderProgram);

   return {canvas:canvas,gl:gl, shaderProgram:shaderProgram};
}

function getGLShaderCodes (canvas)
{
    let vertCode  = "";
    let fragCode  = "";
    let vertElement = null;
    let fragElement = null;
    let els = canvas.getElementsByTagName("script");

    for (let i = 0; i < els.length; i++)
    {
        let el = els.item(i);
        switch ( el.getAttribute("type") )
        {
        case  "x-shader/x-vertex":
            vertElement = el;
            break;
        case "x-shader/x-fragment":
            fragElement = el;
            break;
        }
    }
    if(vertElement == null) vertElement = document.getElementById(canvas.getAttribute("id") + "_vertex_shader");
    if(fragElement == null) fragElement = document.getElementById(canvas.getAttribute("id") + "_fragment_shader");
    if(vertElement) vertCode = vertElement.innerText;
    if(fragElement) fragCode = fragElement.innerText;
    return {vertCode:vertCode, fragCode:fragCode};
}
