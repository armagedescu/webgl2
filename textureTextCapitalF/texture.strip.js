{
"use strict";

let canvas = document.currentScript.parentElement;
/*
var image = new Image();
image.src = "./3rdparty/texture/f-texture.png";
document.body.appendChild(image); //*/
// create text html canvas (source for texture).
let textCanvas = makeTextCanvas("Hello!", 100, 26); // this is lib function
document.body.appendChild(textCanvas);

function main() {

   let glCanvas = new GlCanvas(canvas);
   let gl       = glCanvas.gl;

   let textVao     = new GlVAObject (glCanvas.getGlProgram("texture"));

   //texture
   textVao.useProgram();
   textVao.bindVertexArray();
   const textMatrixLocation           = gl.getUniformLocation (textVao.program,     "u_matrix"   );
   let   textVerticesLocation         = gl.getAttribLocation  (textVao.program,     "a_position" );
   let   textTextureCoordLocation     = gl.getAttribLocation  (textVao.program,     "a_texcoord" ); //vec2
   /*
   '{
      "position":
      {
         "numComponents":2,
         "data" : [-0.5, -0.5,   0.5, -0.5,   -0.5, 0.5,   0.5, 0.5]
      },
      "texcoord": [0, 0,   1, 0,   0, 1,   1, 1],
      "normal"  : [0,0,1,0,0,1,0,0,1,0,0,1],
      "indices" : [0, 1, 2,   2, 1, 3]}'
   */
   let texVertsIndexed     = [ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,  -1.0, -1.0];
   let texCoordsIndexed    = [   1,    1,      1,   0,      0,    0,     0,    1];
   let texIndices          = [0, 1, 2, 0, 2, 3];
   let texVerts            = [ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,         1.0, -1.0,  -1.0,  1.0,  -1.0, -1.0];
   //let texCoords           = [   1,    1,      1,   0,      0,    0,           1,    1,     0,    0,    0,    1];
   let texCoords           = [   1,    0,      1,   1,      0,    1,           1,    0,     0,    1,     0,    0];

   let textVerticesBuffer       = gl.createBuffer();
   gl.bindBuffer                 (gl.ARRAY_BUFFER, textVerticesBuffer);
   gl.vertexAttribPointer        (textVerticesLocation,     2, gl.FLOAT,   false, 0, 0);
   gl.enableVertexAttribArray    (textVerticesLocation);

   let textTextureCoordBuffer   = gl.createBuffer();
   gl.bindBuffer                 (gl.ARRAY_BUFFER, textTextureCoordBuffer);
   gl.vertexAttribPointer        (textTextureCoordLocation, 2, gl.FLOAT,   false, 0, 0);
   gl.enableVertexAttribArray    (textTextureCoordLocation);

   gl.bindBuffer (gl.ARRAY_BUFFER, textVerticesBuffer);
   //gl.bufferData (gl.ARRAY_BUFFER, texVerts,  gl.STATIC_DRAW); //new Float32Array(this.#verts)
   gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(texVerts),  gl.STATIC_DRAW); //new Float32Array(this.#verts)
   gl.bindBuffer (gl.ARRAY_BUFFER, textTextureCoordBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);



   let textureLocation  = gl.getUniformLocation (textVao.program, "u_texture");
   let textTexture = gl.createTexture();
   gl.bindTexture    (gl.TEXTURE_2D, textTexture);
   gl.pixelStorei    (gl.UNPACK_FLIP_Y_WEBGL, true);
   gl.pixelStorei    (gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
   gl.texImage2D     (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
   gl.generateMipmap (gl.TEXTURE_2D);
   gl.texParameteri  (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri  (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

   gl.viewport   (0, 0, gl.canvas.width, gl.canvas.height); 
   gl.clearColor (0, 0, 0, 0);
   gl.clear      (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
   gl.enable     (gl.DEPTH_TEST); // turn on depth testing
   //gl.enable     (gl.CULL_FACE);
   gl.enable     (gl.BLEND);
   gl.blendFunc  (gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
   gl.depthMask  (false);
   let matrix = [];//new Float32Array();//[];
   m4.identity(matrix);
   gl.uniformMatrix4fv(textMatrixLocation, false, matrix);
 
   textVao.useProgram();
   textVao.bindVertexArray();
   textVao.draw();
   gl.drawArrays(gl.TRIANGLES,  0, texVerts.length / 3); // 2D points



}

document.addEventListener("DOMContentLoaded", main);

}