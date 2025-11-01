// VERSION: 3.0 - Completely independent patch geometries
"use strict";
importScripts('../lib/js/gl2js/glcanvas.js');
importScripts('../lib/js/math/3dmath.js');
importScripts('../lib/js/general/api.js');
importScripts('../lib/js/gl2js/glcontroller.js');
importScripts('../3rdparty/twgl/js/m4.js'); //copied from 'https://webglfundamentals.org/webgl/resources/m4.js', copyright included 


//TODO: Add this class to gl2js library
class HeightMap extends GlVAObjectAsync
{
   // Chunked LOD system
   #chunks = []; // Array of chunk objects, each with {centerX, centerZ, lodLevels[], buffers[], currentLOD}
   #chunkGridSize = 4; // 4x4 grid = 16 chunks

   // LOD configuration - All levels use large triangles for clear visualization
   #lodConfigs = [
      { downsample: 32, name: "LOD 0", distance: 1.0 },   // Close - large triangles
      { downsample: 48, name: "LOD 1", distance: 2.0 },   // Medium - larger triangles
      { downsample: 64, name: "LOD 2", distance: 4.0 },   // Far - very large triangles
      { downsample: 96, name: "LOD 3", distance: Infinity } // Very far - huge triangles
   ];

   #htmap = null;
   #wireframeMode = true; // Set to true for line rendering (wireframe)

   // Store matrices for LOD calculations
   #modelMatrix = null;
   #viewMatrix = null;

   constructor (context, src, crossOrigin)
   {
      super (context); //GlVAObjectAsync
      this.#htmap = readImgHeightMapOffscreen (src, crossOrigin);

   }
   async ready()
   {
      await super.ready()
         .then ( o => this.#htmap )
         .then ( (heightmap) =>
         {
            this.heightmap = heightmap;
            this.buildAllChunks();
            this.init ();
         } );
      return this;
   }

   // Build all chunks with their LOD levels
   buildAllChunks()
   {
      console.log("🔨 Building chunked LOD system (worker)...");
      const buildStart = performance.now();

      const heightmap = this.heightmap;
      const chunkWidth = Math.floor(heightmap.width / this.#chunkGridSize);
      const chunkHeight = Math.floor(heightmap.height / this.#chunkGridSize);

      let totalTriangles = 0;

      // Build each chunk - store base boundaries for LOD calculations
      for (let chunkRow = 0; chunkRow < this.#chunkGridSize; chunkRow++) {
         for (let chunkCol = 0; chunkCol < this.#chunkGridSize; chunkCol++) {
            // Base chunk bounds (will be extended per LOD level)
            const baseStartX = chunkCol * chunkWidth;
            const baseStartZ = chunkRow * chunkHeight;
            const baseEndX = Math.min((chunkCol + 1) * chunkWidth, heightmap.width - 1);
            const baseEndZ = Math.min((chunkRow + 1) * chunkHeight, heightmap.height - 1);

            const chunk = {
               row: chunkRow,
               col: chunkCol,
               baseStartX: baseStartX,
               baseStartZ: baseStartZ,
               baseEndX: baseEndX,
               baseEndZ: baseEndZ,
               lodLevels: [],
               buffers: [],
               currentLOD: 1 // Default to LOD 1
            };

            // Calculate chunk center in world space (after transformation)
            const centerX = ((chunk.baseStartX + chunk.baseEndX) / 2) * (2.0 / heightmap.width) - 1.0;
            const centerZ = ((chunk.baseStartZ + chunk.baseEndZ) / 2) * (2.0 / heightmap.height) - 1.0;
            chunk.centerX = centerX;
            chunk.centerZ = centerZ;
            chunk.centerY = -0.5; // Approximate terrain center height

            // Build all LOD levels for this chunk
            for (let lodIdx = 0; lodIdx < this.#lodConfigs.length; lodIdx++) {
               const config = this.#lodConfigs[lodIdx];
               const lod = this.buildChunkGeometryLOD(chunk, config.downsample);
               chunk.lodLevels.push(lod);

               if (lodIdx === 1) { // Count LOD 1 triangles
                  totalTriangles += lod.triangleCount;
               }
            }

            this.#chunks.push(chunk);
         }
      }

      const buildEnd = performance.now();
      console.log(`✅ Built ${this.#chunks.length} chunks in ${(buildEnd - buildStart).toFixed(2)}ms`);
      console.log(`📊 Total triangles (LOD 1): ${totalTriangles}`);
   }

   init()
   {
      console.log("vao async init - 64 VAOs (one per LOD per chunk)");
      let gl = this.gl;

      const vertLoc = gl.getAttribLocation(this.program, "vert");
      const normLoc = gl.getAttribLocation(this.program, "norm");

      // Create one VAO per LOD level per chunk (64 total)
      for (let chunk of this.#chunks) {
         chunk.vaos = [];

         for (let lod of chunk.lodLevels) {
            // Create VAO for this specific LOD level
            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            // Vertex buffer for this LOD
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lod.vertices), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(vertLoc);
            gl.vertexAttribPointer(vertLoc, 3, gl.FLOAT, false, 0, 0);

            // Normal buffer for this LOD
            const normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lod.norms), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(normLoc);
            gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

            // Index buffer (triangles)
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(lod.indices), gl.STATIC_DRAW);

            // Wireframe index buffer (lines)
            const lineIndices = this.#trianglesToLines(lod.indices);
            const lineIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(lineIndices), gl.STATIC_DRAW);

            chunk.vaos.push({
               vao: vao,
               indexBuffer: indexBuffer,
               indexCount: lod.indices.length,
               lineIndexBuffer: lineIndexBuffer,
               lineIndexCount: lineIndices.length
            });
         }
      }

      // Get uniform locations
      this.modelLocation       = gl.getUniformLocation (this.program, "model");
      this.viewLocation        = gl.getUniformLocation (this.program, "view");
      this.projectionLocation  = gl.getUniformLocation (this.program, "projection");
      this.vertColorLocation   = 2;

      gl.bindVertexArray(null);
   }

   // Convert triangle indices to line indices for wireframe rendering
   #trianglesToLines(triangleIndices)
   {
      const lineIndices = [];
      // Each triangle (3 indices) becomes 3 lines (6 indices)
      for (let i = 0; i < triangleIndices.length; i += 3) {
         const i0 = triangleIndices[i];
         const i1 = triangleIndices[i + 1];
         const i2 = triangleIndices[i + 2];

         // Line 1: i0 -> i1
         lineIndices.push(i0, i1);
         // Line 2: i1 -> i2
         lineIndices.push(i1, i2);
         // Line 3: i2 -> i0
         lineIndices.push(i2, i0);
      }
      return lineIndices;
   }

   // Update LOD for all chunks based on current transformation matrices
   updateChunkLODs()
   {
      // First pass: Calculate desired LOD for each chunk based on distance
      for (let chunk of this.#chunks) {
         // Transform chunk center same way as shader: model * vertex, then view * result
         const chunkCenter = [chunk.centerX, chunk.centerY, chunk.centerZ];
         const worldPos = m4.transformPoint(this.#modelMatrix, chunkCenter);
         const cameraPos = m4.transformPoint(this.#viewMatrix, worldPos);

         // Calculate distance from camera origin (0,0,0) in camera space
         // Use Z-distance (depth) which is most relevant for LOD
         const distanceTransformed = Math.abs(cameraPos[2]);

         // Extract scale from model matrix to normalize distance back to fundamental scale
         // Model matrix scale is in diagonal elements (assuming uniform scale)
         const modelScale = Math.sqrt(
            this.#modelMatrix[0] * this.#modelMatrix[0] +
            this.#modelMatrix[1] * this.#modelMatrix[1] +
            this.#modelMatrix[2] * this.#modelMatrix[2]
         );

         // Normalize distance to fundamental scale (divide by model scale)
         const distance = distanceTransformed / modelScale;

         // Select LOD based on distance
         let targetLOD = this.#lodConfigs.length - 1;
         for (let i = 0; i < this.#lodConfigs.length; i++) {
            if (distance < this.#lodConfigs[i].distance) {
               targetLOD = i;
               break;
            }
         }

         chunk.desiredLOD = targetLOD;
         chunk.currentLOD = targetLOD;
      }

      // Second pass: Constrain LOD differences between adjacent chunks
      // This prevents cracks by ensuring neighbors don't differ by more than 1 LOD level
      let changed = true;
      let iterations = 0;
      const maxIterations = 10; // Prevent infinite loops
      let adjustmentsMade = 0;

      while (changed && iterations < maxIterations) {
         changed = false;
         iterations++;

         for (let chunk of this.#chunks) {
            const row = chunk.row;
            const col = chunk.col;

            // Check all 4 neighbors (up, down, left, right)
            const neighbors = [
               this.#getChunk(row - 1, col), // top
               this.#getChunk(row + 1, col), // bottom
               this.#getChunk(row, col - 1), // left
               this.#getChunk(row, col + 1)  // right
            ];

            for (let neighbor of neighbors) {
               if (!neighbor) continue;

               // If neighbor has lower detail (higher LOD number), we might need to reduce our detail
               if (neighbor.currentLOD > chunk.currentLOD + 1) {
                  // Neighbor is too low detail, increase our LOD (reduce detail) to match closer
                  const oldLOD = chunk.currentLOD;
                  chunk.currentLOD = neighbor.currentLOD - 1;
                  changed = true;
                  adjustmentsMade++;
                  if (iterations === 1 && adjustmentsMade <= 5) {
                     console.log(`🔧 Adjusted chunk [${row},${col}] from LOD ${oldLOD} to ${chunk.currentLOD} (neighbor at LOD ${neighbor.currentLOD})`);
                  }
               }
               // If we have lower detail than neighbor, neighbor will adjust to us
            }
         }
      }

      if (adjustmentsMade > 0) {
         console.log(`✅ LOD constraint pass: ${adjustmentsMade} adjustments in ${iterations} iterations`);
      }
   }

   // Helper to get chunk by grid position
   #getChunk(row, col)
   {
      if (row < 0 || row >= this.#chunkGridSize || col < 0 || col >= this.#chunkGridSize) {
         return null;
      }
      return this.#chunks[row * this.#chunkGridSize + col];
   }

   set model      (mtx)  {this.#modelMatrix = mtx; this.gl.uniformMatrix4fv (this.modelLocation,      false,  mtx) ;}
   set view       (mtx)  {this.#viewMatrix = mtx; this.gl.uniformMatrix4fv (this.viewLocation,       false,  mtx) ;}
   set projection (mtx)  {this.gl.uniformMatrix4fv (this.projectionLocation, false,  mtx) ;}
   set color      (vec4) {this.gl.vertexAttrib4fv  (this.vertColorLocation,         vec4) ;}

   // Build geometry for a specific chunk with specific LOD level
   buildChunkGeometryLOD(chunk, DOWNSAMPLE)
   {
      let heightmap = this.heightmap;
      let vertices = [];
      let norms = [];
      let indices = [];

      const bottom = -0.7, maxheight = 0.2 / heightmap.maxh;
      const rfi = 2.0 / heightmap.height, rfj = 2.0 / heightmap.width;
      let viter = 0;

      // Extend boundaries leaving a small fixed gap for visualization
      // Ensure fresh copies to prevent contamination from previous LOD iterations
      const startI = chunk.baseStartX;
      const startJ = chunk.baseStartZ;
      const endI = chunk.baseEndX;
      const endJ = chunk.baseEndZ;

      // Each patch is completely independent - pure linear approach
      // Simple gap: actualEnd = boundary - gapSize
      // Don't extend - the gap IS the visible separation between patches

      const gapSize = 10; // Small fixed gap (25% wider)

      // Calculate actualEnd independently for each LOD - no state carryover
      const actualEndI = (chunk.col < this.#chunkGridSize - 1) ? (endI - gapSize) : endI;
      const actualEndJ = (chunk.row < this.#chunkGridSize - 1) ? (endJ - gapSize) : endJ;

      if (chunk.row === 0 && chunk.col === 0) {
         console.log(`🔧 VERSION 3.24: Simple gap, no extension, actualEndI=${actualEndI}, gap=${gapSize}px, DOWNSAMPLE=${DOWNSAMPLE}`);
      }

      // Calculate how many vertices fit in this chunk
      const chunkWidth = Math.floor((actualEndI - startI) / DOWNSAMPLE) + 1;
      const chunkLength = Math.floor((actualEndJ - startJ) / DOWNSAMPLE) + 1;

      // Build vertices for this chunk - independent grid
      // Calculate positions using size / partition formula
      const partitionSizeI = (actualEndI - startI) / (chunkWidth - 1);
      const partitionSizeJ = (actualEndJ - startJ) / (chunkLength - 1);

      for (let jIdx = 0; jIdx < chunkLength; jIdx++)
      {
         const j = Math.round(startJ + jIdx * partitionSizeJ);
         for (let iIdx = 0; iIdx < chunkWidth; iIdx++)
         {
            const i = Math.round(startI + iIdx * partitionSizeI);
            // Sample heightmap at current position
            // For normal calculation, use actual partition size or clamp to valid neighbors
            const deltaI = Math.round(partitionSizeI);
            const deltaJ = Math.round(partitionSizeJ);

            const i1 = Math.min(i + deltaI, heightmap.width - 1);
            const j1 = Math.min(j + deltaJ, heightmap.height - 1);

            // Get vertex position
            let [x,  y,  z] = [i, heightmap.data[j][i], j];

            // For boundary vertices, calculate normal from valid neighboring points
            // Use previous positions if at boundary (for proper normal calculation)
            const i0_norm = (i1 === i) ? Math.max(i - deltaI, 0) : i;
            const j0_norm = (j1 === j) ? Math.max(j - deltaJ, 0) : j;
            const i1_norm = (i1 === i) ? i : i1;
            const j1_norm = (j1 === j) ? j : j1;

            let [x0, y0, z0] = [i0_norm, heightmap.data[j0_norm][i0_norm], j0_norm];
            let [x1, y1, z1] = [i1_norm, heightmap.data[j0_norm][i1_norm], j0_norm];
            let [x2, y2, z2] = [i1_norm, heightmap.data[j1_norm][i1_norm], j1_norm];

            // Calculate normal using cross product of valid triangle
            let nms = cross3p([x0, y0, z0], [x2, y2, z2], [x1, y1, z1]);
            nms = normv(nms);

            // Transform vertex to world space
            [x,  y,  z] = resizev([x, y, z], [rfi, maxheight, rfj]);
            [x,  y,  z]  = offsetv([x,  y,  z],  [-1., bottom, -1.]);

            vertices[viter] = x;
            vertices[viter + 1] = y;
            vertices[viter + 2] = z;
            norms[viter] = nms[0];
            norms[viter + 1] = nms[1];
            norms[viter + 2] = nms[2];

            viter += 3;
         }
      }

      // Verify vertex count matches expected
      const actualVertexCount = vertices.length / 3;
      const expectedVertexCount = chunkWidth * chunkLength;
      if (actualVertexCount !== expectedVertexCount) {
         console.error(`❌ CRITICAL: Chunk vertex mismatch!`);
         console.error(`   Expected: ${expectedVertexCount} (${chunkWidth} x ${chunkLength})`);
         console.error(`   Got: ${actualVertexCount}`);
         console.error(`   Chunk bounds: [${startI},${endI}] x [${startJ},${endJ}]`);
         console.error(`   DOWNSAMPLE: ${DOWNSAMPLE}`);
         console.error(`   This WILL cause pyramid artifacts!`);
      }

      // Build indices for this chunk
      let iiter = 0;
      for (let j = 0; j < chunkLength - 1; j++)
      {
         for (let i = 0; i < chunkWidth - 1; i++)
         {
            const idx0 = j * chunkWidth + i;
            const idx1 = (j + 1) * chunkWidth + i;
            const idx2 = j * chunkWidth + (i + 1);
            const idx3 = (j + 1) * chunkWidth + (i + 1);

            // Validate indices don't exceed vertex count
            if (idx0 >= actualVertexCount || idx1 >= actualVertexCount ||
                idx2 >= actualVertexCount || idx3 >= actualVertexCount) {
               console.error(`❌ Index out of bounds! max=${actualVertexCount}, indices=[${idx0},${idx1},${idx2},${idx3}]`);
            }

            indices[iiter + 0] = idx0;
            indices[iiter + 1] = idx3;
            indices[iiter + 2] = idx2;
            iiter += 3;

            indices[iiter + 0] = idx0;
            indices[iiter + 1] = idx1;
            indices[iiter + 2] = idx3;
            iiter += 3;
         }
      }

      return {
         vertices: vertices,
         norms: norms,
         indices: indices,
         downsample: DOWNSAMPLE,
         triangleCount: indices.length / 3,
         vertexCount: vertices.length / 3
      };
   }

   drawVao()
   {
      let gl = this.gl;
      this.color = new Float32Array([1, 0, 0, 1]);

      // Draw each chunk with its current LOD
      for (let chunk of this.#chunks) {
         // Get the VAO for the current LOD level
         const vaoData = chunk.vaos[chunk.currentLOD];

         // Bind the VAO (contains all vertex attribute configuration)
         gl.bindVertexArray(vaoData.vao);

         if (this.#wireframeMode) {
            // Wireframe mode: draw lines
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vaoData.lineIndexBuffer);
            gl.drawElements(gl.LINES, vaoData.lineIndexCount, gl.UNSIGNED_INT, 0);
         } else {
            // Solid mode: draw triangles
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vaoData.indexBuffer);
            gl.drawElements(gl.TRIANGLES, vaoData.indexCount, gl.UNSIGNED_INT, 0);
         }
      }

      gl.bindVertexArray(null);
   }
}


let controller = new glcontroller ();

async function onMouseEvent(event)
{
   switch (event.type)
   {
   case "click":     controller.timer.switchStop(); return "event.type";
   case "mousemove":
      if (event.shiftKey)
          [controller.camera.ypos, controller.camera.xpos] = [event.movementY, event.movementX];
      if (event.ctrlKey)                                
          [controller.camera.ytg,  controller.camera.xtg]  = [event.movementY, event.movementX];
      return "event.type";
   case "wheel":
       console.log("wheel: " + event.deltaX + ":" + event.deltaY + ":" + event.deltaZ + ":" + event.deltaMode);
       //if (event.ctrlKey)
       return event.type;
   }
   return null;
}

async function main()
{
   let craterArizonaUrl;
   postMessage("getInfo");

   let glinfo = null;
   onmessage = async (msg) =>
   {
      if (msg.data.byUrl)
      {
         //console.log("msg.data instanceof GlInfoG");
         glinfo = Object.assign(new GlInfo (), msg.data);
         postMessage("getArizona");
      } else if (msg.data.arizona)
      {
         craterArizonaUrl = msg.data.arizona;
         postMessage("getCanvas");
      } else if (msg.data instanceof OffscreenCanvas)
      {
         glinfo.canvas  = msg.data;
         new HeightMap (glinfo, craterArizonaUrl).ready().then( (vao) =>  { heightMapDraw (vao);} );
      } else //if (msg.data instanceof OffscreenCanvas)
      {
         switch (msg.data.type)
         {
         case "mousemove": case "wheel": case "click":
            onMouseEvent(msg.data);
            break;
         }
      }
   }
}
async function heightMapDraw (vao)
{
   console.log ("start: async function heightMapDraw (vao)");

   let gl = vao.gl;
   console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
   vao.useProgram();

   let fieldOfViewRadians    = rad (60);

   requestAnimationFrame(drawScene);

   // Draw the scene.
   //controller.timer.switchStop();
   let then = 0;
   function drawScene(time)
   {
      let ttime = time;
      time *= 0.001;
      let deltaTime = time - then;
      then = time;
      if (controller.timer.stop)
         deltaTime = 0;

      vao.useProgram();
      gl.enable   (gl.CULL_FACE);
      gl.enable   (gl.DEPTH_TEST);  // FIXED: Enable depth test to prevent massive overdraw!

      gl.clearColor (0., 0., 1., 1.0);
      gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);
      //gl.blendFunc(gl.GL_SRC_ALPHA, gl.GL_ONE_MINUS_SRC_ALPHA);
      gl.clear    (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      if (true)
      {
         // Compute the projection matrix
         // Use canvas.width/height instead of clientWidth/clientHeight for OffscreenCanvas
         let aspect = gl.canvas.width / gl.canvas.height;
         let projectionMatrix = m4.perspective (fieldOfViewRadians, aspect, 1, 2000);

         // Animate the rotation
         controller.model.deltat = deltaTime;

         // Model matrix: Scale up the terrain (it's currently in [-1,1] range)
         let modelMatrix = controller.model.matrix;
         modelMatrix = m4.scale(modelMatrix, 3, 3, 3); // Scale 3x to make it bigger

         // Set up controller camera position (needed for proper viewing)
         controller.camera.pos = [0, 2, 5];
         controller.camera.target = [0, -0.5, 0];

         // View matrix: Use controller's view matrix (which now uses our camera setup)
         let viewMatrix = controller.camera.matrix;

         // DEBUG: Log on first frame
         if (frameCount === undefined) {
            var frameCount = 0;
         }
         frameCount++;
         //if (frameCount === 1 || frameCount % 60 === 0) {
         //   console.log('🎥 Controller Camera Pos:', controller.camera.pos);
         //   console.log('🎯 Controller Target:', controller.camera.target);
         //}

         // Use perspective projection
         vao.model      = modelMatrix;
         vao.view       = viewMatrix;
         vao.projection = projectionMatrix;

         // Update LOD based on current matrices
         vao.updateChunkLODs();

         vao.draw();
      }
   
      requestAnimationFrame(drawScene);
   }
}

main();
