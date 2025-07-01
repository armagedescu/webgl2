{
"use strict";
//TODO: make it a complete raw variant
let canvas = document.currentScript.parentElement;


function main() {

   let glCanvas = new GlCanvas(canvas);
   let gl       = glCanvas.gl;

   let textVao     = new GlVAObject (glCanvas.getGlProgram("texture"));
   let textCanvas = makeTextCanvas("Hello!", 100, 26); // this is lib function

   //texture
   textVao.useProgram();
   textVao.bindVertexArray();
   let   textVerticesLocation         = gl.getAttribLocation  (textVao.program,     "a_position" );
   let   textTextureCoordLocation     = gl.getAttribLocation  (textVao.program,     "a_texcoord" ); //vec2

   let texVerts            = new Float32Array([ 1.0, -1.0,    1.0, 1.0,   -1.0,  1.0,         1.0, -1.0,   -1.0,  1.0,   -1.0, -1.0]);
   let texCoords           = new Float32Array([   1,    0,      1,   1,      0,    1,           1,    0,      0,    1,      0,    0]);
   //let texVerts            = new Float32Array([ -1.0,  -1.0,   1.0, -1.0,  -1.0, 1.0,     -1.0,  1.0,   1.0, -1.0,  1.0, 1.0] );
   //let texCoords           = new Float32Array([    0,     0,      1,   0,     0,   1,        0,    1,   1,      0,    1,  1,] );

   let textVerticesBuffer       = gl.createBuffer();
   gl.bindBuffer                 (gl.ARRAY_BUFFER, textVerticesBuffer);
   gl.vertexAttribPointer        (textVerticesLocation,     2, gl.FLOAT,   false, 0, 0);
   gl.enableVertexAttribArray    (textVerticesLocation);

   let textTextureCoordBuffer   = gl.createBuffer();
   gl.bindBuffer                 (gl.ARRAY_BUFFER, textTextureCoordBuffer);
   gl.vertexAttribPointer        (textTextureCoordLocation, 2, gl.FLOAT,   false, 0, 0);
   gl.enableVertexAttribArray    (textTextureCoordLocation);

   gl.bindBuffer (gl.ARRAY_BUFFER, textVerticesBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, texVerts,  gl.STATIC_DRAW);
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

   gl.uniform1i        (textureLocation, textTexture); //set texture

   //textureRgb.texImage2D ();
   textVao.useProgram      ();
   textVao.bindVertexArray ();

   textVao.draw  ();
   gl.drawArrays (gl.TRIANGLES,  0, texVerts.length / 2); // 2D points

}

document.addEventListener("DOMContentLoaded", main);

}