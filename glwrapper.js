function buildGlProgram(canvasVar)
{
   let canvas = null;
   let gl = null;
   if (typeof canvasVar =="string")
	   canvas = document.getElementById(canvasVar);
   else if (typeof canvasVar =="object")
	   canvas = canvasVar;
   gl = canvas.getContext('experimental-webgl');
   gl.viewport(0, 0, canvas.width, canvas.height);
   
   let canvas_id = canvas.id;

   let vertCode   = document.getElementById(canvas.getAttribute("id") + "_vertex_shader").innerText;
   let vertShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vertShader, vertCode);
   gl.compileShader(vertShader);

   let fragCode   = document.getElementById(canvas.getAttribute("id") + "_fragment_shader").innerText;
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
