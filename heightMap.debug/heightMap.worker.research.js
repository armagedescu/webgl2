// VERSION: RESEARCH - Chunked LOD System with visible cracks (for study)
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

   // LOD configuration
   #lodConfigs = [
      { downsample: 2, name: "LOD 0 (Half)", distance: 5 },
      { downsample: 4, name: "LOD 1 (Quarter)", distance: 10 },
      { downsample: 8, name: "LOD 2 (Eighth)", distance: 20 },
      { downsample: 16, name: "LOD 3 (Sixteenth)", distance: Infinity }
   ];

   #htmap = null;
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

      // Build each chunk
      for (let chunkRow = 0; chunkRow < this.#chunkGridSize; chunkRow++) {
         for (let chunkCol = 0; chunkCol < this.#chunkGridSize; chunkCol++) {
            const chunk = {
               row: chunkRow,
               col: chunkCol,
               startX: chunkCol * chunkWidth,
               startZ: chunkRow * chunkHeight,
               endX: Math.min((chunkCol + 1) * chunkWidth, heightmap.width - 1),
               endZ: Math.min((chunkRow + 1) * chunkHeight, heightmap.height - 1),
               lodLevels: [],
               buffers: [],
               currentLOD: 1 // Default to LOD 1
            };

            // Calculate chunk center in world space (after transformation)
            const centerX = ((chunk.startX + chunk.endX) / 2) * (2.0 / heightmap.width) - 1.0;
            const centerZ = ((chunk.startZ + chunk.endZ) / 2) * (2.0 / heightmap.height) - 1.0;
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
      console.log("vao async init - chunked version");
      let gl = this.gl;

      // Create buffers for each chunk
      for (let chunk of this.#chunks) {
         chunk.buffers = [];

         for (let lod of chunk.lodLevels) {
            // Create VAO and buffers for this LOD level
            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            // Vertex buffer
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lod.vertices), gl.STATIC_DRAW);
            const vertLoc = gl.getAttribLocation(this.program, "vert");
            gl.enableVertexAttribArray(vertLoc);
            gl.vertexAttribPointer(vertLoc, 3, gl.FLOAT, false, 0, 0);

            // Normal buffer
            const normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lod.norms), gl.STATIC_DRAW);
            const normLoc = gl.getAttribLocation(this.program, "norm");
            gl.enableVertexAttribArray(normLoc);
            gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

            // Index buffer
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(lod.indices), gl.STATIC_DRAW);

            chunk.buffers.push({
               vao: vao,
               vertexBuffer: vertexBuffer,
               normalBuffer: normalBuffer,
               indexBuffer: indexBuffer,
               indexCount: lod.indices.length
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

   // Update LOD for all chunks based on camera position
   updateChunkLODs(cameraPos)
   {
      for (let chunk of this.#chunks) {
         // Calculate distance from camera to chunk center (in world space, after 3x scale)
         const dx = (cameraPos[0] / 3) - chunk.centerX;
         const dy = (cameraPos[1] / 3) - chunk.centerY;
         const dz = (cameraPos[2] / 3) - chunk.centerZ;
         const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

         // Select LOD based on distance
         let targetLOD = this.#lodConfigs.length - 1;
         for (let i = 0; i < this.#lodConfigs.length; i++) {
            if (distance < this.#lodConfigs[i].distance) {
               targetLOD = i;
               break;
            }
         }

         chunk.currentLOD = targetLOD;
      }
   }

   set model      (mtx)  {this.gl.uniformMatrix4fv (this.modelLocation,      false,  mtx) ;}
   set view       (mtx)  {this.gl.uniformMatrix4fv (this.viewLocation,       false,  mtx) ;}
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

      // Work within chunk bounds
      const startI = chunk.startX;
      const startJ = chunk.startZ;
      const endI = chunk.endX;
      const endJ = chunk.endZ;

      // Calculate actual dimensions based on how the loop will iterate
      // The loop goes from start to (end - DOWNSAMPLE) inclusive, stepping by DOWNSAMPLE
      const chunkWidth = Math.floor((endI - startI) / DOWNSAMPLE);
      const chunkLength = Math.floor((endJ - startJ) / DOWNSAMPLE);

      // Build vertices for this chunk only
      for (let j = startJ; j <= endJ - DOWNSAMPLE; j += DOWNSAMPLE)
      {
         for (let i = startI; i <= endI - DOWNSAMPLE; i += DOWNSAMPLE)
         {
            let [x,  y,  z]  = [i,              heightmap.data[j]              [i]              ,  j];
            let [x1, y1, z1] = [i + DOWNSAMPLE, heightmap.data[j]              [i + DOWNSAMPLE] ,  j];
            let [x2, y2, z2] = [i + DOWNSAMPLE, heightmap.data[j + DOWNSAMPLE] [i + DOWNSAMPLE] ,  j + DOWNSAMPLE];

            let nms = cross3p ( [x,  y,  z], [x2, y2, z2],  [x1, y1, z1]);
            nms = normv (nms);

            [x,  y,  z]   = resizev ([ x,  y,  z], [rfi, maxheight, rfj]);
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
         const buffer = chunk.buffers[chunk.currentLOD];
         gl.bindVertexArray(buffer.vao);
         gl.drawElements(gl.TRIANGLES, buffer.indexCount, gl.UNSIGNED_INT, 0);
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

         let viewProjectionMatrix = m4.multiply(projectionMatrix, controller.camera.matrix);

         // Animate the rotation
         controller.model.deltat = deltaTime;

         // Model matrix: Scale up the terrain (it's currently in [-1,1] range)
         let modelMatrix = controller.model.matrix;
         modelMatrix = m4.scale(modelMatrix, 3, 3, 3); // Scale 3x to make it bigger

         // View matrix: Move camera back so we can see the terrain
         let cameraPos = [0, 2, 5]; // Camera at (0, 2, 5) - back and up
         let targetPos = [0, -0.5, 0]; // Look at terrain center (y ~ -0.7 to -0.5)
         let upVector = [0, 1, 0];
         let cameraMatrix = m4.lookAt(cameraPos, targetPos, upVector);
         let viewMatrix = m4.inverse(cameraMatrix);

         // Apply controller transformations on top
         viewMatrix = m4.multiply(viewMatrix, controller.camera.matrix);

         // Update LOD for all chunks based on camera position
         vao.updateChunkLODs(cameraPos);

         // DEBUG: Log on first frame
         if (frameCount === undefined) {
            var frameCount = 0;
         }
         frameCount++;
         if (frameCount === 1) {
            console.log('🎥 Worker Camera Pos:', cameraPos);
            console.log('🎯 Worker Target:', targetPos);
            console.log('📐 Worker Aspect:', aspect);
            console.log('📊 Worker FOV:', fieldOfViewRadians);
         }

         // Use perspective projection
         vao.model      = modelMatrix;
         vao.view       = viewMatrix;
         vao.projection = projectionMatrix;

         vao.draw();
      }
   
      requestAnimationFrame(drawScene);
   }
}

main();
