"use strict";
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
      base  [i]  =  mulv([               fi * Math.cos(fi),                    fi * Math.sin(fi),   0.0], [1.0 / Math.PI, 1.0 / Math.PI,  1.0          ]);
      norms [i]  =  mulv([Math.sin(fi) + fi * Math.cos(fi),   -(Math.cos(fi) - fi * Math.sin(fi)),   fi], [1.0          , 1.0          ,  1.0 / Math.PI]);
   }
   if(revealInvisible) {base[0] = [0.5, 0.0, 0]; norms[0] = [1, 1, 1];}

   return {verts:base, norms:norms, sectors:sec2};
}

function mirror_y (src)
{
   let i0 = 0, i1 = 1, i2 = 2;
   let mirr = [];
   for (let i = src.length - 1, j = 0; i >= 0; i--, j++)
   {
       let sl = src[i];
       mirr[j] = [sl[0], -sl[1], sl[2]];
   }
   return mirr;
}

function buildSide (geoSide, slices)
{
   let dh = 1. / slices;

   let verts = [];
   let norms = [];
   let i0 = 0, i1 = 1, i2 = 2;

   //init tip of the cone
   verts[i0] = 0; verts[i1] = 0; verts[i2] = 1;
   norms[i0] = 0; norms[i1] = 0; norms[i2] = 0;
   i0 += 3; i1 += 3; i2 += 3;
   //end init tip of the cone

   for (let j = 0, s = 1, h = 1 - dh;   j < slices;   j++, s++, h -= dh)
   {
      for (let i = 0; i < geoSide.verts.length; i++)
      {
         let bs = geoSide.verts[i];
         let ns = geoSide.norms[i];
         verts [i0]  = s * bs[0] / slices; verts [i1]  = s * bs[1] / slices; verts [i2]  = h;
         norms [i0]  = ns[0]; norms [i1]  = ns[1]; norms [i2]  = ns[2];
         i0 += 3; i1 += 3; i2 += 3;
      }
   }

   return {verts : verts,     norms : norms,     sectors : geoSide.sectors,     slices : slices};
}
function buildSides (geometry, slices)
{
   let geoSides =  [  geometry,
                     {verts:mirror_y (geometry.verts), norms:mirror_y (geometry.norms), sectors:geometry.sectors} ];
   let sides = [];
   for (let i = 0; i < geoSides.length; i++)
   {
       sides[i] = buildSide(geoSides[i], slices);
   }
   return sides;

}

function buildIndexes (side)
{
   let indices = [];

   let sec2 = side.sectors;// / 2;
   let i0 = 0, i1 = 1, i2 = 2;
   let sec2a = sec2 + 1;

   for (let j = 0, ja = -1; j < side.slices; j++, ja++)
   {
      let ia = 1, ib = ia + 1;

      for (let i = 0; i < sec2; i++, ia++, ib++)
      {
         // first triangle
         indices[i0] = ja * sec2a + ia;
         indices[i1] =  j * sec2a + ia;
         indices[i2] =  j * sec2a + ib;
         if (j == 0) indices[i0] = 0; //there is one single tip
         i0 += 3; i1 += 3; i2 += 3;

         if(j == 0) continue; // tip of the cone is a fan
         indices[i0] =  ja * sec2a + ia;
         indices[i1] =   j * sec2a + ib;
         indices[i2] =  ja * sec2a + ib;
         i0 += 3; i1 += 3; i2 += 3;
         //console.log (  JSON.stringify({t1:{i:ja * sec2a + ia, j:j * sec2a + ia, k: j * sec2a + ib},
         //                      t2:{i:ja * sec2a + ia, j:j * sec2a + ib, k:ja * sec2a + ib}}))
      }
   }
   //console.log("end indicex");
   return indices;
}

function buildCone (slices, sectors, revealInvisibles)
{
   let nfi = 0;
   if (sectors &  1) throw "Must have even number of sectors: "             + sectors;
   if (sectors &  3) throw "Number of sectors must be a multiple of 4: "    + sectors;
   //if (sectors < 10) throw "Must have no less than 10 sectors: "            + sectors;
   if (sectors <  1) throw "Must have no less than 1 slices: "              + slices;

   let geo = buildGeometry (sectors, revealInvisibles);

   let sides = buildSides(geo, slices);
   for (let side of sides)
      side.indices =  buildIndexes (side);

   //console.log("so far");
   return sides;

}

class HeartCoat extends GlVAObject
{
   constructor(context, coat)
   {
      super(context);
      this.coat = coat;
	  this.init();
   }
   init ()
   {
      this.bindVertexArray();
      let gl = this.gl;

      this.vertex_buffer = this.arrayBuffer(new Float32Array(this.coat.verts));
      this.coord = this.vertex_buffer.attrib ("coordinates", 3, gl.FLOAT);

      this.normal_buffer = this.arrayBuffer(new Float32Array(this.coat.norms));
      this.noord = this.normal_buffer.attrib ("inputNormal", 3, gl.FLOAT);

      this.indb = this.indexBuffer(new Uint16Array(this.coat.indices));
   }
   drawVao()
   {
      let gl = this.gl;
      gl.drawElements (gl.TRIANGLES, this.coat.indices.length, gl.UNSIGNED_SHORT, 0);
   }
}
class HeartSet extends GlCanvas
{
   constructor(context, nh, ns, revealInvisibles)
   {
      super(context);
      this.vaos = buildCone (nh, ns, revealInvisibles).map ((coat) => {return new HeartCoat(this, coat)});
   }
   draw() { for (let vao of this.vaos) {vao.draw();} }
}
let func = () =>
{
   const revealInvisibles = false;//false;
   //const revealInvisibles = true;//false;
   //let ns = 12, nh = 3;
   let ns = 12, nh = 2;
   //let ns = 80, nh = 20;
   let heartObj = new HeartSet(canvas, nh, ns, revealInvisibles);
   let gl = heartObj.gl;

   gl.clearColor(0.5, 0.5, 0.5, 0.9);
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);
   gl.clear (gl.COLOR_BUFFER_BIT);
   ////////////////////////////////////

   heartObj.draw();

}

document.addEventListener('DOMContentLoaded', func);
}