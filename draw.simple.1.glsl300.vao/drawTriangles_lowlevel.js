{
let canvas = document.currentScript.parentElement;
let glmain = () =>
{
   let gl = canvas.getContext('webgl2');

   //let resolver = () => "http://www.w3.org/XML/1998/namespace"; //sample of resolver
   let selectSingleNode = (xpathStr, element, resolver) =>
      document.evaluate(xpathStr, element, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
   let selectSingleNodeText = (xpathStr, element, resolver) =>
      selectSingleNode (xpathStr, element, resolver).textContent;

   //console.log (selectSingleNodeText ("./script[@data-gl-type='vertex-shader']",   canvas).trim());
   //console.log (selectSingleNodeText ("./script[@data-gl-type='fragment-shader']", canvas).trim());

   let vertexShader   = gl.createShader (gl.VERTEX_SHADER);
   gl.shaderSource  (vertexShader, selectSingleNodeText ("./script[@data-gl-type='vertex-shader']", canvas).trim());
   gl.compileShader (vertexShader);
   let fragmentShader = gl.createShader (gl.FRAGMENT_SHADER);
   gl.shaderSource  (fragmentShader, selectSingleNodeText ("./script[@data-gl-type='fragment-shader']", canvas).trim());
   gl.compileShader (fragmentShader);

   let program = gl.createProgram ();
   gl.attachShader (program, vertexShader);
   gl.attachShader (program, fragmentShader);
   gl.linkProgram(program);
   if (!gl.getProgramParameter(program, gl.LINK_STATUS))
         console.log("CPROGRAM ERROR: " +  gl.getProgramInfoLog(program));

   gl.deleteShader(vertexShader);
   gl.deleteShader(fragmentShader);
   gl.useProgram(program);


   let vertices = [ 0.0, -0.5,   -0.5, 0.3,   -0.5, -0.6,
                    0.0, -0.5,    0.8, 0.4,   -0.4,  0.5 ];

   let vao = gl.createVertexArray();
   gl.bindVertexArray(vao);
   // Create a new buffer object
   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (program, "coordinates");
   gl.vertexAttribPointer     (coord, 2, gl.FLOAT, false, 0, 0); //point an attribute to the currently bound VBO
   gl.enableVertexAttribArray (coord); //Enable the attribute

   gl.bindVertexArray(null);
   gl.useProgram(null);

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.clear (gl.COLOR_BUFFER_BIT);

   gl.useProgram(program);
   gl.bindVertexArray(vao);
   gl.drawArrays(gl.TRIANGLES, 0, 6);

};
document.addEventListener('DOMContentLoaded', glmain);
}