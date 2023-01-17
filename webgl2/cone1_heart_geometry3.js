{
let canvas = document.currentScript.parentElement;


function buildGeometry (sectors, revealInvisible)
{
   let dfi = 2 * Math.PI / sectors;

   let base = [], norms = [];
   let sec2 = sectors / 2;
   // Calculate from 0 to PI
   for (let i = 0, fi = 0; i <= sec2; i++, fi += dfi)
   {
      //Calculate and normalize geometry: Resize all 0..PI to 0..1
      base[i]  = mul3v([               fi * Math.cos(fi),                    fi * Math.sin(fi),   0.0], [1.0 / Math.PI, 1.0 / Math.PI,  1.0          ]);
      norms[i] = mul3v([Math.sin(fi) + fi * Math.cos(fi),   -(Math.cos(fi) - fi * Math.sin(fi)),   fi], [1.0          , 1.0          ,  1.0 / Math.PI]);
   }
   if(revealInvisible) base[0] = [0.5, 0.0, 0];

   return {base:base, norms:norms};
}

function buildSides (geometry, slices, sectors) 
{
   let sec2 = sectors / 2;
   let dh = 1 / slices;

   let sides = [[], []];
   for (let j = 0, s = 1, h = 1 - dh; j < slices; j++, s++, h -= dh)
   {
      sides[0][j] = [];
      sides[1][j] = [];
      for (let i = 0, i2 = sec2; i <= sec2; i++, i2--)
      {
         let bs = geometry.base[i];
         let ns = geometry.norms[i];
         sd = [s * bs[0] / slices, s * bs[1] / slices, h,   ns[0], ns[1], ns[2]]; //[coords.xyz  |  norms.xyz]
         sides[0][j][i]  = [sd[0],  sd[1], sd[2],    sd[3],  sd[4], sd[5]];
         sides[1][j][i2] = [sd[0], -sd[1], sd[2],    sd[3], -sd[4], sd[5]];
      }
   }
   return sides;
}
function buildShape ()
{}
function buildCone(slices, sectors, revealInvisibles)
{
   let nfi = 0;
   if (sectors &  1) throw "Must have even number of sectors: "             + sectors;
   if (sectors &  3) throw "Number of sectors must be a multiple of 4: "    + sectors;
   if (sectors < 10) throw "Must have no less than 10 sectors: "            + sectors;
   if (sectors <  1) throw "Must have no less than 1 slices: "              + slices;

   let geo = buildGeometry (sectors, revealInvisibles);

   let sides = buildSides(geo, slices, sectors);
   let sec2 = sectors / 2;
   let verts = [];
   let verts_norms = [];
   let i0 = 0, i1 = 1, i2 = 2;

   for (let side of sides)
      for (let j = 0; j < slices; j++)
         for (let i = 0; i < sec2; i++)
         {
            let s11, s12; // s11   \      // s11 <- s12
            let s21, s22; // s21 -> s22   //    \   s22
            if (j == 0) //tip of the cone
            {
               s11 = [0, 0, 1, 0, 0, 0]; //coord:xyz norm:000
               s21 = side [j]  [i]; s22 = side[j]  [i+1];
            }
            else
            {
               s11 = side [j-1][i]; s12 = side[j-1][i+1];
               s21 = side [j]  [i]; s22 = side[j]  [i+1];
            }
			//if (j == 0){
            verts [i0] = s21[0];
            verts [i1] = s21[1];
            verts [i2] = s21[2];
            verts_norms[i0] = s21[3];
            verts_norms[i1] = s21[4];
            verts_norms[i2] = s21[5];

            verts [i0 + 3] = s22[0];
            verts [i1 + 3] = s22[1];
            verts [i2 + 3] = s22[2];
            verts_norms[i0 + 3] = s22[3];
            verts_norms[i1 + 3] = s22[4];
            verts_norms[i2 + 3] = s22[5];

            verts [i0 + 6] = s11[0];
            verts [i1 + 6] = s11[1];
            verts [i2 + 6] = s11[2];
            verts_norms[i0 + 6] = s11[3];
            verts_norms[i1 + 6] = s11[4];	
            verts_norms[i2 + 6] = s11[5];
            i0 += 9; i1 += 9; i2 += 9;
			//}

            // because this is the tip of the cone
            if (j == 0) continue;
            //if(0){
            verts [i0] = s22[0];
            verts [i1] = s22[1];
            verts [i2] = s22[2];
            verts_norms[i0] = s22[3];
            verts_norms[i1] = s22[4];
            verts_norms[i2] = s22[5];
			
            verts [i0 + 3] = s12[0];
            verts [i1 + 3] = s12[1];
            verts [i2 + 3] = s12[2];
            verts_norms[i0 + 3] = s12[3];
            verts_norms[i1 + 3] = s12[4];
            verts_norms[i2 + 3] = s12[5];
			
            verts [i0 + 6] = s11[0];
            verts [i1 + 6] = s11[1];
            verts [i2 + 6] = s11[2];
            verts_norms[i0 + 6] = s11[3];
            verts_norms[i1 + 6] = s11[4];
            verts_norms[i2 + 6] = s11[5];
            //}
            i0 += 9; i1 += 9; i2 += 9;
         }
   return {verts:verts, norms:verts_norms};

}

let func = () =>
{
   let glCanvas = new GlCanvas(canvas);
   let prog = glCanvas.program;
   let gl = prog.gl;
   prog.useProgram ();

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);
   gl.clear (gl.COLOR_BUFFER_BIT);
   ////////////////////////////////////
   const revealInvisibles = false;
   let ns = 12, nh = 3;
   let obj = buildCone(nh, ns, revealInvisibles);
   let verts = obj.verts;
   let norms = obj.norms;
   ////////////////////////////////////

   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

   let coord = gl.getAttribLocation (prog.program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);

   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (prog.program, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);

   gl.drawArrays(gl.TRIANGLES, 0, ns * 3 + ns * 6 * (nh - 1));
   //gl.drawArrays(gl.LINES, 0, ns * 3 + ns * 6 * (nh - 1));
   //gl.drawArrays(gl.LINE_STRIP, 0, ns * 3 + ns * 6 * (nh - 1));
}

document.addEventListener('DOMContentLoaded', func);
}