"use strict";

function wrap(x)
{
   if (isFinite(x)) return x;
   if (x == Number.POSITIVE_INFINITY) return Number.MAX_VALUE;
   if (x == Number.NEGATIVE_INFINITY) return Number.MIN_VALUE;
   return 0.0;
}
function cross3p  (p1, p2, p3) //3D cross between three 3D points
{
   let v1 = deltav (p1, p2);
   let v2 = deltav (p1, p3);
   return [(v1[1] * v2[2] - v1[2] * v2[1]),   (v1[2] * v2[0] - v1[0] * v2[2]),   (v1[0] * v2[1] - v1[1] * v2[0])];
}
function cross3pn (p1, p2, p3) //3D cross between three 3D points
{
   return normv (cross3p (p1, p2, p3));
}
function cross3 (v1, v2) //3D cross between two 3D vectors
{
   return [(v1[1] * v2[2] - v1[2] * v2[1]),   (v1[2] * v2[0] - v1[0] * v2[2]),   (v1[0] * v2[1] - v1[1] * v2[0])];
}

// component wise vector operations
function deltav  (v1, v2)    { return v2.map ( (a, i) => a - v1[i] );}
function mulv    (v,  f)     { return v.map  ( (a, i) => a * f[i] ); }
//dot product of two vectors
function dotv    (v,  f)     { return mulv   (v, f).reduce((a, b) => a + b, 0); }

//return new normalized vector
function normv   (norm)      { let len = Math.hypot ( ... norm); return norm.map(a => a / len); }

// creates array of transformed ts by scalar r
function offset  (r, ... ts) { return ts.map (a => a + r); }
function resize  (r, ... ts) { return ts.map (a => a * r); }
function shrink  (r, ... ts) { return ts.map (a => a / r); }

// reates array of transformed v1 component vise by v2
function offsetv (v1, v2)    { return v2.map ( (a, i) => v1[i] + a  ); }
function shrinkv (v1, v2)    { return v2.map ( (a, i) => v1[i] / a  ); }
function resizev (v1, v2)    { return v2.map ( (a, i) => v1[i] * a  ); }

function norm3nz (x1, y1, z1, x2, y2, z2, rs) {
   if (!rs) rs = 1;
   //let vec = normv ([x1, y1, z1], [x2, y2, z2]);
   let vec = cross3 ([x1, y1, z1], [x2, y2, z2]);
   let h   = Math.hypot (... vec);
   vec     = shrink (h,  ... vec);
   return  resize   (rs, ... vec);
};

//TODO: To review correctness and usefullness of commented constants
//const RADGRAD    = Math.PI / 180;
//const C2PI       = 2 * Math.PI;
function deg(r) { return r * 180 / Math.PI; }
function rad(d) { return d * Math.PI / 180; }

function identity1(arraytype) {
   if (!arraytype) arraytype = Array;
   return arraytype.from ([1]);
}
function identity2(arraytype) {
   if (!arraytype) arraytype = Array;
   return arraytype.from ([1, 0,  0, 1]);
}
function identity3(arraytype) {
   if (!arraytype) arraytype = Array;
   return arraytype.from ([1, 0, 0,   0, 1, 0,   0, 0, 1]);
}
function identity4(arraytype) {
   if (!arraytype) arraytype = Array;
   return arraytype.from ([1, 0, 0, 0,   0, 1, 0, 0,   0, 0, 1, 0,   0, 0, 0, 1]);
}
function identity(n, arraytype) {
   if (!arraytype) arraytype = Array;
   let ret = new arraytype(n * n).fill(0);
   for (let i = 0; i < n; i++)
      ret[i * n + i] = 1;
   return ret;
}

let angle2coord = (r,  fi) => [r * Math.cos(fi),   r * Math.sin(fi)];
let sect2coord  = (r, sec) => angle2coord (r, sec * 2 * Math.PI);