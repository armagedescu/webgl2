const RADGRAD    = Math.PI / 180;
const C2PI       = 2 * Math.PI;
function wrap(x)
{
    if (isFinite(x)) return x;
    if (x == Number.POSITIVE_INFINITY) return Number.MAX_VALUE;
    if (x == Number.NEGATIVE_INFINITY) return Number.MIN_VALUE;
    return 0.0;
}
function delta3v(p1, p2)
{
   return {x:(p2.x - p1.x), y:(p2.y - p1.y), z:(p2.z - p1.z)};
}
function cross3v(p1, p2, p3)
{
    let v1 = delta3v(p1, p2);
    let v2 = delta3v(p1, p3);
    return {x:(v1.y * v2.z - v1.z * v2.y), y:(v1.z * v2.x - v1.x * v2.z), z: (v1.x * v2.y - v1.y * v2.x)};
}

function mul3v(v, f)
{
    return [v[0] * f[0],     v[1] * f[1],     v[2] * f[2]];
}
function dot3v(v, f)
{
    let m = mul3v(v, f);
    return m[0]   +   m[1]   +   m[2];
}
function normalize3v(norm)
{
    let len = Math.hypot (norm[0], norm[1], norm[2]);
    return [norm[0] / len, norm[1] / len, norm[2] / len];
}