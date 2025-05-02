"use strict";
{
let canvas = document.currentScript.parentElement;


function buildGeometryPolar (shape)
{
   let dfi = 2 * Math.PI / shape.sectors;

   let [base, norms] = [[], []];
   let sec2  =   shape.sectors; // / 2;
   sec2 /=  2;

   //transform radius to coordinate
   let [xfi, yfi, zfi]  = [a => shape.func(a) * Math.cos(a), a => shape.func(a) * Math.sin(a), a => 0.0];
   //transform radius to normals
	let  [nxfi, nyfi, nzfi] = [xfi, yfi, a =>  1];
	if (shape.d) [nxfi, nyfi, nzfi] = [shape.d.x, shape.d.y, shape.d.z];
   if (!shape.scaleVert) shape.scaleVert = a => a ;
   if (!shape.scaleNorm) shape.scaleNorm = a => a ;
   // Calculate for fi = [0 .. PI]
   for (let i = 0, fi = 0; i <= sec2; i++, fi += dfi)
   {
      base  [i]  =  shape.scaleVert ([ xfi(fi),  yfi(fi),   zfi(fi)]);
      norms [i]  =  shape.scaleNorm ([nxfi(fi), nyfi(fi),  nzfi(fi)]);
      norms [i]  =  normv(norms[i]); //normalize
   }
   return {base:base, norms:norms};
}

function buildSides (geometry, slices, sectors) 
{
   let sec2 = sectors / 2;
   let dh = 1.0 / slices;

   let sides = [[], []];

   //tip of the cone
   sides[0][0] = [];
   for (let i = 0; i <= sec2; i++)
      sides[0][0][i]  = [0, 0, 0, 0, 0, 0];
   //slices
   for (let j = 1, s = 1, z = dh; j <= slices; j++, s++, z += dh) //z = z axix
   {
      sides[0][j] = [];
      for (let i = 0; i <= sec2; i++)
      {
         let bs = geometry.base[i], ns = geometry.norms[i];
         let sd = [s * bs[0] / slices,    s * bs[1] / slices, z,     ns[0], ns[1], ns[2]];
         sides[0][j][i] = [sd[0], sd[1], sd[2],    sd[3],  sd[4], sd[5]];
      }
   }

   mirrorSide (sides[0], sides[1], [1, -1, 1]);
   return sides;
}
function mirrorSide (side1, side2, mirror)
{
   const cuts = side1.length;
   for (let j = 0; j < cuts; j++)
   {
      side2[j] = [];
      const sls = side1[j]; //slice
      const len = sls.length;  //sectors
      for (let i = 0, i2 = len - 1; i < len; i++, i2--)
         side2[j][i2] = mulv (sls[i], [... mirror, ...  mirror]);  //mirroring segments
   }
}


function buildConePolar (shape)
{
   let slices = shape.slices, sectors = shape.sectors;
   let revealInvisibles = shape.revealInvisibles;
   let nfi = 0;
   if (sectors &  3) throw "Number of sectors must be a multiple of 4: "    + sectors;
   if (sectors <  8) throw "Must have no less than 8 sectors: "             + sectors;
   if (slices  <  1) throw "Must have no less than 1 slices: "              + slices;


   let geo = buildGeometryPolar (shape);
   if (revealInvisibles)
      geo.base[0] = [0.5, 0.0, 0.0];

   console.log ("slices;" + slices +  " sectors:" + sectors);
	//all needed vertices and normals
   let sides = buildSides(geo, slices, sectors);
   let sec2  = sectors / 2;

   //order vertices in triangles
   let [verts, norms] = [[],[]]; //vertices

   let [i0, i1, i2]   = [0, 1, 2];
   for (let side of sides)
      for (let j = 1; j <= slices; j++)
         for (let i = 0; i < sec2; i++)
         {
            let s11, s12; // s11   \      // s11 <- s12
            let s21, s22; // s21 -> s22   //    \   s22

            s11 = side [j-1][i];   s12 = side [j-1][i+1];
            s21 = side [j]  [i];   s22 = side [j]  [i+1];
            {
               [verts [i0],     verts [i1],     verts [i2]]       =   [ s21[0],   s21[1],   s21[2] ];
               [norms [i0],     norms [i1],     norms [i2]]       =   [ s21[3],   s21[4],   s21[5] ];
               
               [verts [i0 + 3], verts [i1 + 3], verts [i2 + 3]]   =   [ s22[0],   s22[1],   s22[2] ];
               [norms [i0 + 3], norms [i1 + 3], norms [i2 + 3]]   =   [ s22[3],   s22[4],   s22[5] ];
               
               [verts [i0 + 6], verts [i1 + 6], verts [i2 + 6]]   =   [ s11[0],   s11[1],   s11[2] ];
               [norms [i0 + 6], norms [i1 + 6], norms [i2 + 6]]   =   [ s11[3],   s11[4],   s11[5] ];

               i0  +=  9; i1  += 9;  i2  += 9;
            }
            if (j > 1) // when j == 1 we do not double triangles on the tip of the cone
            {
               [verts [i0],     verts [i1],     verts [i2]]     = [ s22[0],   s22[1],   s22[2] ];
               [norms [i0],     norms [i1],     norms [i2]]     = [ s22[3],   s22[4],   s22[5] ];
            
               [verts [i0 + 3], verts [i1 + 3], verts [i2 + 3]] = [ s12[0],   s12[1],   s12[2] ];
               [norms [i0 + 3], norms [i1 + 3], norms [i2 + 3]] = [ s12[3],   s12[4],   s12[5] ];
            
               [verts [i0 + 6], verts [i1 + 6], verts [i2 + 6]] = [ s11[0],   s11[1],   s11[2] ];
               [norms [i0 + 6], norms [i1 + 6], norms [i2 + 6]] = [ s11[3],   s11[4],   s11[5] ];
               i0 += 9;  i1 += 9;  i2 += 9;
            }
         }


   let nverts      = []; //build spykes
   let [ni0, ni1, ni2] = [0, 1, 2];

   for (let side of sides)
      for (let j = 0; j <= slices; j++)
         for (let i = 0; i < sec2; i++)
         {
            let s = side [j][i]; //[...verts.xyz, ...norms.xyz];
            [nverts [ni0],     nverts [ni1],     nverts [ni2]]     = [s[0], s[1], s[2]];
            [nverts [ni0 + 3], nverts [ni1 + 3], nverts [ni2 + 3]] = [s[0] + s[3]/10,   s[1] + s[4]/10,   s[5] ] ;//- 0.5];
            [nverts [ni0 + 3], nverts [ni1 + 3], nverts [ni2 + 3]] = [s[0] + s[3]/10,   s[1] + s[4]/10,   s[2] ] ;//- s[5] / 10];
            ni0 += 6;  ni1 += 6;  ni2 += 6;
         }

   let cone =  {verts:verts, norms:norms, nverts:nverts};

   let expected;
   expected =     3 * (sectors * 3 + sectors * 6 * (slices - 1));
   console.assert ( expected ==  verts.length,  "wrong number of vertices, expected %d, calculated %d, vertices %d", expected, verts.length, verts.length / 3);
   expected = (slices * sectors)  *  (2 * 3); //each segment two points of x,y,z
   //expected = (slices * sectors)  *  (2 * 3) + slices; //each segment two points of x,y,z
   expected = ((slices  + 1)* sectors)  *  (2 * 3); //each segment two points of x,y,z
   console.assert ( expected ==  nverts.length, "wrong number of vertices, expected %d, calculated %d", expected, nverts.length);

   return cone;

}

function buildSquare (len, z)
{
   return   [ len, -len, z,    len, len, z,   -len,   len, z, 
              len, -len, z,   -len, len, z,   -len,  -len, z  ];
}
function buildNorms (nm)
{
   let nv =  normv(nm); //normalize
   return [ ...nv,  ...nv,  ...nv,   ...nv,  ...nv,  ...nv ];
}

let func = () =>
{
   let glCanvas = new GlCanvas(canvas);

   let gl = glCanvas.gl;
   glCanvas.useProgram ();
   let program = glCanvas.program;
   //gl.useProgram(program);

   gl.enable (gl.DEPTH_TEST);
   gl.enable (gl.CULL_FACE);
   gl.clear  (gl.COLOR_BUFFER_BIT);

	let hearth = {
		func: a => a, //hearth double sided
      d: //gradient
      {
         x : a =>   Math.sin(a) + hearth.func(a) * Math.cos(a),
         y : a => -(Math.cos(a) - hearth.func(a) * Math.sin(a)),
         z : a =>  -hearth.func(a), //Z negative, dorected toward
		},
		scaleVert: a =>  mulv(a, [1.0 / Math.PI,  1.0 / Math.PI,   1.0]),
		scaleNorm: a =>  mulv(a, [1.0,            1.0,   1.0 / Math.PI]),
		//sectors:16, slices:3, revealInvisibles: false
		sectors:8, slices:1, revealInvisibles: false
	};
	let circle = {
		func: a => 1, //circle double sided
		sectors:40, slices:3
	};
   let obj;
   try
   {
		let shape = hearth;
		//shape = circle;
      obj = buildConePolar (shape);

      ////slice object with squares
      obj.verts.push( ... buildSquare (   0.40,  0.90));
      obj.norms.push( ... buildNorms  ([  1.00,  0.00,  1.00 ]));
      obj.verts.push( ... buildSquare (   0.35,  0.70));
      //obj.norms.push( ... buildNorms  ([ -1.00, -0.20, -1.00]));
      obj.norms.push( ... buildNorms  ([ -1.00, -1.00, -1.00]));
      obj.verts.push( ... buildSquare (   0.30,  0.50,));
      obj.norms.push( ... buildNorms  ([ -1.00, -0.40, -1.00 ]));
      obj.verts.push( ... buildSquare (   0.25,  0.30));
      obj.norms.push( ... buildNorms  ([ -1.00, -0.60, -1.00 ]));
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

   program = glCanvas.program;
   //gl.useProgram(program);
   glCanvas.useProgram ();
   let coord = gl.getAttribLocation (program, "coordinates");
   gl.vertexAttribPointer     (coord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (coord);

   let normalBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
   let noord = gl.getAttribLocation (program, "inputNormal");
   gl.vertexAttribPointer     (noord, 3, gl.FLOAT, false, 0, 0);
   gl.enableVertexAttribArray (noord);

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.drawArrays(gl.TRIANGLES,  0, verts.length / 3);

   gl.useProgram (null);
   gl.bindBuffer(gl.ARRAY_BUFFER, null);
   gl.disableVertexAttribArray (coord);

}

document.addEventListener('DOMContentLoaded', func);
}