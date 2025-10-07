{
let canvas = document.currentScript.parentElement;

//not supported by webgpu
function buildGeometryFan (ns, dr)
{
   console.assert (ns % 4 == 0);
   let verts    = [0.8, 0.8, 0];
   let norms    = [0, 0, 1.0];//[0.0, 0.0, 1.0];
   let realns = ns;
   let start  = ns / 2;
   for (let i = start,  [ix, iy, iz] = [3, 4, 5]; i <= realns + start; i++, ix += 3,iy += 3,iz += 3)
   {
      [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * i / ns),   dr * Math.sin(2 * Math.PI * i / ns),   -1];
      [norms [ix], norms [iy], norms [iz]] = [0, -1, 1];
   }
   console.assert (verts.length == 2 * 3 +  3 * realns);
   return {verts: new Float32Array(verts), norms: new Float32Array(norms), topology: WebGL2RenderingContext.TRIANGLE_FAN };
}
function buildGeometryFan2 (ns, dr)
{
   //const ns = 16, dr = 0.6; //number of sectors and radius
   const [tipvert, tipnorm] = [[0.8, 0.8, 0.0],  [0.0, 0.0, 0.0]], norm = [0, -1, 1];
   let [verts, norms]      = [tipvert, tipnorm];
   for (let i = 0, ix = 3, iy = 4, iz = 5;   i <= ns;   i++, ix += 3, iy += 3, iz += 3)
      [verts [ix], verts [iy], verts [iz],  norms [ix], norms [iy], norms [iz]] =
         [... sect2coord (dr, i / ns), -1,                             ...norm]; 

   return {verts: new Float32Array(verts), norms: new Float32Array(norms), topology: WebGL2RenderingContext.TRIANGLE_FAN};
}

function buildGeometryStrip (ns, dr)
{
   console.assert (ns % 4 == 0);
   let verts    = [0.8,  0.8,  0];
   let norms    = [  0,    0,  0];//[0.0, 0.0, 1.0];
   let realns = ns;
   let start  = ns / 2;
   let z = -1;
   for (let i = start, [ix, iy, iz] = [3, 4, 5]; i <= realns + start; i++, ix += 3,iy += 3,iz += 3)
   {
      [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * i / ns),   dr * Math.sin(2 * Math.PI * i / ns),   z ];
      [norms [ix], norms [iy], norms [iz]] = [0, -1, 1];
      ix += 3,iy += 3,iz += 3;
      [verts [ix], verts [iy], verts [iz]] = [0.8, 0.8, 1.0];
      [norms [ix], norms [iy], norms [iz]] = [0, 0, 0];
   }
   let expectedLength = 3 + 3 * 2 * (realns + 1);
   console.assert (verts.length ==  expectedLength, `vets length ${verts.length} != ${expectedLength}`);
   return {verts: new Float32Array(verts), norms: new Float32Array(norms), topology: WebGL2RenderingContext.TRIANGLE_STRIP};
}

function buildGeometryTriangles (ns, dr)
{
   console.assert (ns % 4 == 0);
   let verts    = [];
   let norms    = [];//[0.0, 0.0, 1.0];
   let realns = ns;
   let start  = ns / 2;
   let z = -1; //cone edge orientation to us
   for (let i = start, [ix, iy, iz] = [0, 1, 2]; i < realns + start; i++, ix += 3,iy += 3,iz += 3)
   {
      [verts [ix], verts [iy], verts [iz]] = [0.8,  0.8,  1.0];
      [norms [ix], norms [iy], norms [iz]] = [0.0,  0.0,  0.0];
      ix += 3,iy += 3,iz += 3;
      [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * i / ns),   dr * Math.sin(2 * Math.PI * i / ns),   z];
      [norms [ix], norms [iy], norms [iz]] = [0, -1, 1];
      ix += 3,iy += 3,iz += 3;
      [verts [ix], verts [iy], verts [iz]] = [dr * Math.cos(2 * Math.PI * (i+1) / ns),   dr * Math.sin(2 * Math.PI * (i+1) / ns),   z];
      [norms [ix], norms [iy], norms [iz]] = [0, -1, 1];
   }
   console.assert (verts.length == 3 * 3 * realns);
   return {verts:new Float32Array(verts), norms:new Float32Array(norms), topology: WebGL2RenderingContext.TRIANGLES};
}

let glmain = () =>
{
   let glCanvas  = new GlCanvas(canvas);
   let gl        = glCanvas.gl;

   const ns = 16, dr = 0.6; //number of sectors and radius

   let geometry = buildGeometryFan (ns, dr);
   //let geometry = buildGeometryFan2 (ns, dr);
   //let geometry = buildGeometryStrip (ns, dr);
   //let geometry = buildGeometryTriangles (ns, dr);

   //initialize buffers
   glCanvas.useProgram ();
   let vertexBuffer = gl.createBuffer ();
   gl.bindBuffer (gl.ARRAY_BUFFER, vertexBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, geometry.verts, gl.STATIC_DRAW);

   gl.vertexAttribPointer     (0, 3, gl.FLOAT, false, 0, 0); //0:vertex
   gl.enableVertexAttribArray (0);

   let normalBuffer = gl.createBuffer ();
   gl.bindBuffer (gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData (gl.ARRAY_BUFFER, geometry.norms, gl.STATIC_DRAW);

   gl.vertexAttribPointer     (1, 3, gl.FLOAT, false, 0, 0); //1:norm
   gl.enableVertexAttribArray (1);

   //draw triangle fan
   gl.clearColor (0.5, 0.5, 0.5, 0.9);
   gl.enable     (gl.DEPTH_TEST);
   gl.clear      (gl.COLOR_BUFFER_BIT);

   gl.drawArrays(geometry.topology,   0, geometry.verts.length / 3);

};
document.addEventListener('DOMContentLoaded', glmain);
}