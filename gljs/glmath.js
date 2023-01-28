"use strict";

const RADGRAD    = Math.PI / 180;
const C2PI       = 2 * Math.PI;
function wrap(x)
{
    if (isFinite(x)) return x;
    if (x == Number.POSITIVE_INFINITY) return Number.MAX_VALUE;
    if (x == Number.NEGATIVE_INFINITY) return Number.MIN_VALUE;
    return 0.0;
}

function cross3p (p1, p2, p3) //3D cross between 3 points
{
   let v1 = deltav (p1, p2);
   let v2 = deltav (p1, p3);
   return [(v1[1] * v2[2] - v1[2] * v2[1]), (v1[2]* v2[0] - v1[0] * v2[2]), (v1[0] * v2[1] - v1[1] * v2[0])];
}

function deltav  (p1, p2) { return p2.map ( (a, i) => a - p1[i] );}
function mulv    (v,  f)  { return v.map  ( (a, i) => a * f[i] ); }
function dotv    (v,  f)  { return mulv   (v, f).reduce((a, b) => a + b, 0); }

function normv   (norm)   { let len = Math.hypot ( ... norm); return norm.map(a => a / len); }

function offset  (r, ... ts) { return ts.map (a => a + r); }
function resize  (r, ... ts) { return ts.map (a => a * r); }
function shrink  (r, ... ts) { return ts.map (a => a / r); }

function offsetv (p1, p2) { return p2.map( (a, i) => p1[i] + a  ); }
function shrinkv (p1, p2) { return p2.map( (a, i) => p1[i] / a  ); }
function resizev (p1, p2) { return p2.map( (a, i) => p1[i] * a  ); }

function norm3nz (x1, y1, z1, x2, y2, z2, rs = 1)
{
   let vec = normv ([x1, y1, z1], [x2, y2, z2]);
   let h   = Math.hypot (... vec);
   vec     = shrink (h,  ... vec);
   return  resize   (rs, ... vec);
};

function deg(r) { return r * 180 / Math.PI; }
function rad(d) { return d * Math.PI / 180; }