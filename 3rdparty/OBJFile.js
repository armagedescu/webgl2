"use strict";
/*
MIT License

Copyright (c) 2017 Wesley Unwin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
//*/
/*
Project forked from: https://github.com/WesUnwin/obj-file-parser
With little changes to make it browser/client side
//*/

class OBJFile
{
   constructor(fileContents, defaultModelName)
   {
      this.#reset();
      this.fileContents     = fileContents;
      this.defaultModelName = (defaultModelName || 'untitled');
	  this.obj              = this.#parse();
   }

   #reset()
   {
      this.result =
      {
         models: [],
         materialLibraries: []
      };
      this.currentMaterial  = '';
      this.currentGroup     = '';
      this.smoothingGroup   = 0;
   }

   #parse()
   {
      this.#reset();

      const stripComments = /^\s*|\s*(#.*)?$/ig;
      const splitBySpace  = /\s+/;

      const lines = this.fileContents.split('\n');
      for (let i = 0; i < lines.length; i++)
      {
         const lineItems = lines[i].replace(stripComments, '').toLowerCase().split(splitBySpace);

         switch (lineItems[0])
         {
            case 'o': // Start A New Model
               this.#parseObject(lineItems);
               break;
            case 'g': // Start a new polygon group
               this.#parseGroup(lineItems);
               break;
            case 'v': // Define a vertex for the current model
               this.#parseVertexCoords(lineItems);
               break;
            case 'vt': // Texture Coords
               this.#parseTextureCoords(lineItems);
               break;
            case 'vn': // Define a vertex normal for the current model
               this.#parseVertexNormal(lineItems);
               break;
            case 'l': // Define a line for the current model
               this.#parseLine(lineItems);
               break;
            case 's': // Smooth shading statement
               this.#parseSmoothShadingStatement(lineItems);
               break;
            case 'f': // Define a Face/Polygon
               this.#parsePolygon(lineItems);
               break;
            case 'mtllib': // Reference to a material library file (.mtl)
               this.#parseMtlLib(lineItems);
               break;
            case 'usemtl': // Sets the current material to be applied to polygons defined from this point forward
               this.#parseUseMtl(lineItems);
               break;
         }
      }

      return this.result;
   }

   #createNewModel(name = this.defaultModelName)
   {
      return {
         name,
         vertices      : [],
         textureCoords : [],
         vertexNormals : [],
         faces         : [],
         lines         : []
      };
   }

   #currentModel()
   {
      if (this.result.models.length == 0)
      {
         const defaultModel = this.#createNewModel();
         this.result.models.push(defaultModel);
         this.currentGroup   = '';
         this.smoothingGroup = 0;
      }

      return this.result.models[this.result.models.length - 1];
   }

   #parseObject(lineItems)
   {
      const modelName = lineItems.length >= 2 ? lineItems[1] : this.defaultModelName;
      const model     = this.#createNewModel(modelName);
      this.result.models.push(model);
      this.currentGroup   = '';
      this.smoothingGroup = 0;
   }

   #parseGroup(lineItems)
   {
      if (lineItems.length != 2) throw 'Group statements must have exactly 1 argument (eg. g group_1)';

      this.currentGroup = lineItems[1];
   }

   #parseVertexCoords(lineItems)
   {
      const x = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
      const y = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
      const z = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;

      this.#currentModel().vertices.push({ x, y, z });
   }

   #parseTextureCoords(lineItems)
   {
      const u = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
      const v = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
      const w = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;

      this.#currentModel().textureCoords.push({ u, v, w });
   }

   #parseVertexNormal(lineItems)
   {
      const x = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
      const y = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
      const z = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;

      this.#currentModel().vertexNormals.push({ x, y, z });
   }

   #parseLine(lineItems)
   {
      const totalVertices = (lineItems.length - 1);
      if (totalVertices < 2) throw (`Line statement has less than 2 vertices${this.filePath}${this.lineNumber}`);

      const line = [];

      for (let i = 0; i < totalVertices; i += 1)
      {
         const vertexString = lineItems[i + 1];
         const vertexValues = vertexString.split('/');

         if (vertexValues.length < 1 || vertexValues.length > 2) throw (`Too many values (separated by /) for a single vertex${this.filePath}${this.lineNumber}`);

         let vertexIndex        = 0;
         let textureCoordsIndex = 0;
         vertexIndex = parseInt(vertexValues[0]);
         if (vertexValues.length > 1 && (vertexValues[1] != '')) textureCoordsIndex = parseInt(vertexValues[1]);

         line.push ({ vertexIndex, textureCoordsIndex });
      }
      this.#currentModel().lines.push(line);
   }

   #parsePolygon(lineItems)
   {
      const totalVertices = (lineItems.length - 1);
      if (totalVertices < 3) throw (`Face statement has less than 3 vertices${this.filePath}${this.lineNumber}`);

      const face =
      {
         material       : this.currentMaterial,
         group          : this.currentGroup,
         smoothingGroup : this.smoothingGroup,
         vertices       : []
      };

      for (let i = 0; i < totalVertices; i += 1)
      {
         const vertexString = lineItems[i + 1];
         const vertexValues = vertexString.split('/');

         if (vertexValues.length < 1 || vertexValues.length > 3) throw (`Too many values (separated by /) for a single vertex${this.filePath}${this.lineNumber}`);

         let vertexIndex        = 0;
         let textureCoordsIndex = 0;
         let vertexNormalIndex  = 0;
         vertexIndex = parseInt(vertexValues[0]);
         if (vertexValues.length > 1 && (vertexValues[1] != '')) textureCoordsIndex = parseInt(vertexValues[1]);
         if (vertexValues.length > 2) vertexNormalIndex = parseInt(vertexValues[2]);

         if (vertexIndex == 0) throw 'Faces uses invalid vertex index of 0';

         // Negative vertex indices refer to the nth last defined vertex
         // convert these to postive indices for simplicity
         if (vertexIndex < 0) { vertexIndex = this.#currentModel().vertices.length + 1 + vertexIndex; }

         face.vertices.push (
            {
               vertexIndex,
               textureCoordsIndex,
               vertexNormalIndex
            });
      }
      this.#currentModel().faces.push(face);
   }

   #parseMtlLib(lineItems)
   {
      if (lineItems.length >= 2) this.result.materialLibraries.push(lineItems[1]);
   }

   #parseUseMtl(lineItems)
   {
      if (lineItems.length >= 2) this.currentMaterial = lineItems[1];
   }

   #parseSmoothShadingStatement(lineItems)
   {
      if (lineItems.length != 2) throw 'Smoothing group statements must have exactly 1 argument (eg. s <number|off>)';

      const groupNumber = (lineItems[1].toLowerCase() == 'off') ? 0 : parseInt(lineItems[1]);
      this.smoothingGroup = groupNumber;
   }
}
