const RADGRAD = Math.PI / 180;
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