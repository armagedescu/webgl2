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
      norms[i] = normalize3v(norms[i]);
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
function buildCone(slices, sectors, revealInvisibles, snlen)
{
   let nfi = 0;
   if (sectors &  3) throw "Number of sectors must be a multiple of 4: "    + sectors;
   if (sectors <  8) throw "Must have no less than 8 sectors: "             + sectors;
   if (slices  <  1) throw "Must have no less than 1 slices: "              + slices;

   let geo = buildGeometry (sectors, revealInvisibles);

   let sides = buildSides(geo, slices, sectors);
   let sec2 = sectors / 2;
   let verts = [];
   let verts_norms = [];
   let nverts = [];
   let i0 = 0, i1 = 1, i2 = 2;
   let n0 = 0, n1 = 1, n2 = 2;
   const nv = snlen;

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
            verts [i0]      =  s21[0];
            verts [i1]      =  s21[1];
            verts [i2]      =  s21[2];
            verts_norms[i0] =  s21[3];
            verts_norms[i1] =  s21[4];
            verts_norms[i2] =  s21[5];
            nverts [n0]     =  s21[0];
            nverts [n1]     =  s21[1];
            nverts [n2]     = -s21[2];
            nverts [n0 + 3] =  s21[0] + s21[3] / nv;
            nverts [n1 + 3] =  s21[1] + s21[4] / nv;
            nverts [n2 + 3] =  s21[2] - s21[5] / nv;

            verts [i0 + 3]      =  s22[0];
            verts [i1 + 3]      =  s22[1];
            verts [i2 + 3]      =  s22[2];
            verts_norms[i0 + 3] =  s22[3];
            verts_norms[i1 + 3] =  s22[4];
            verts_norms[i2 + 3] =  s22[5];
            nverts [n0 + 6]     =  s22[0];
            nverts [n1 + 6]     =  s22[1];
            nverts [n2 + 6]     = -s22[2];
            nverts [n0 + 9]     =  s22[0] + s22[3] / nv;
            nverts [n1 + 9]     =  s22[1] + s22[4] / nv;
            nverts [n2 + 9]     =  s22[2] - s22[5] / nv;

            verts [i0 + 6]      =  s11[0];
            verts [i1 + 6]      =  s11[1];
            verts [i2 + 6]      =  s11[2];
            verts_norms[i0 + 6] =  s11[3];
            verts_norms[i1 + 6] =  s11[4];
            verts_norms[i2 + 6] =  s11[5];
            nverts [n0 + 12]    =  s11[0];
            nverts [n1 + 12]    =  s11[1];
            nverts [n2 + 12]    = -s11[2];
            nverts [n0 + 15]    =  s11[0] + s11[3] / nv;
            nverts [n1 + 15]    =  s11[1] + s11[4] / nv;
            nverts [n2 + 15]    =  s11[2] - s11[5] / nv;

            i0 += 9;  i1 += 9;  i2 += 9;
            n0 += 18; n1 += 18; n2 += 18;
            //}

            // because this is the tip of the cone
            if (j == 0) continue;
            //if(0){
            verts [i0]      =  s22[0];
            verts [i1]      =  s22[1];
            verts [i2]      =  s22[2];
            verts_norms[i0] =  s22[3];
            verts_norms[i1] =  s22[4];
            verts_norms[i2] =  s22[5];
            nverts [n0]     =  s22[0];
            nverts [n1]     =  s22[1];
            nverts [n2]     = -s22[2];
            nverts [n0 + 3] =  s22[0] + s22[3] / nv;
            nverts [n1 + 3] =  s22[1] + s22[4] / nv;
            nverts [n2 + 3] =  s22[2] - s22[5] / nv;

            verts [i0 + 3]      =  s12[0];
            verts [i1 + 3]      =  s12[1];
            verts [i2 + 3]      =  s12[2];
            verts_norms[i0 + 3] =  s12[3];
            verts_norms[i1 + 3] =  s12[4];
            verts_norms[i2 + 3] =  s12[5];
            nverts [n0 + 6]     =  s12[0];
            nverts [n1 + 6]     =  s12[1];
            nverts [n2 + 6]     = -s12[2];
            nverts [n0 + 9]     =  s12[0] + s12[3] / nv;
            nverts [n1 + 9]     =  s12[1] + s12[4] / nv;
            nverts [n2 + 9]     =  s12[2] - s12[5] / nv;

            verts [i0 + 6]      =  s11[0];
            verts [i1 + 6]      =  s11[1];
            verts [i2 + 6]      =  s11[2];
            verts_norms[i0 + 6] =  s11[3];
            verts_norms[i1 + 6] =  s11[4];
            verts_norms[i2 + 6] =  s11[5];
            nverts [n0 + 12]    =  s11[0];
            nverts [n1 + 12]    =  s11[1];
            nverts [n2 + 12]    = -s11[2];
            nverts [n0 + 15]    =  s11[0] + s11[3] / nv;
            nverts [n1 + 15]    =  s11[1] + s11[4] / nv;
            nverts [n2 + 15]    =  s11[2] - s11[5] / nv;

            //}
            i0 += 9;  i1 += 9;  i2 += 9;
            n0 += 18; n1 += 18; n2 += 18;
         }
   return {verts:verts, norms:verts_norms, nverts:nverts};

}

let func = () =>
{
   let prog = buildGlProgram(canvas);
   let gl = prog.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);
   gl.clear (gl.COLOR_BUFFER_BIT);
   ////////////////////////////////////
   const revealInvisibles = false;
   let ns = 12, nh = 3, show_norms = true;
   let obj;
   try
   {
      obj = buildCone(nh, ns, revealInvisibles, 8);
   }
   catch(err)
   {
      alert(err);
   }
   let verts = obj.verts;
   let norms = obj.norms;
   ////////////////////////////////////

   let vertex_buffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

   let shaderProgram = prog.shaderProgram;
   let coord = gl.getAttribLocation (shaderProgram, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);

   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (shaderProgram, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);

   let drawNorms = gl.getUniformLocation(prog.shaderProgram, 'isDrawNorms');
   gl.uniform1f(drawNorms, 0.0);

   gl.drawArrays(gl.TRIANGLES, 0, ns * 3 + ns * 6 * (nh - 1));

   if (show_norms)
   {
      gl.uniform1f(drawNorms, 1.0);
      let nverts = obj.nverts;
      let nvert_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, nvert_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nverts), gl.STATIC_DRAW);
      //coord = gl.getAttribLocation (shaderProgram, "coordinates");
      gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray (coord);

      gl.drawArrays(gl.LINES, 0, 2* ( ns * 3 + ns * 6 * (nh - 1)));
      //gl.drawArrays(gl.LINE_STRIP, 0, ns * 3 + ns * 6 * (nh - 1));
   }
}

document.addEventListener('DOMContentLoaded', func);
}