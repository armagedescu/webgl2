"use strict";

{
let canvas = document.currentScript.parentElement;

//TODO: Add class to library gl2js
class HeightMap extends GlVAObject
{
   // Chunked LOD system
   #chunks = []; // Array of chunk objects
   #chunkGridSize = 4; // 4x4 grid = 16 chunks
   #htmap = null;

   // LOD configuration
   #lodConfigs = [
      { downsample: 2, name: "LOD 0 (Half)", distance: 5 },
      { downsample: 4, name: "LOD 1 (Quarter)", distance: 10 },
      { downsample: 8, name: "LOD 2 (Eighth)", distance: 20 },
      { downsample: 16, name: "LOD 3 (Sixteenth)", distance: Infinity }
   ];
   constructor (context, src, crossOrigin)
   {
      super (context);
      this.#htmap = readImgHeightMap  (src, crossOrigin);
   }
   async ready ()
   {
      await this.#htmap.then ( (heightmap) =>
      {
         console.log('📊 Heightmap loaded:', heightmap.width, 'x', heightmap.height);
         this.heightmap = heightmap;
         this.buildAllChunks();
         this.init();
      });
      return this;
   }

   // Build all chunks with LOD levels - WITH CRACKS (research version)
   buildAllChunks()
   {
      console.log("🔨 Building chunked LOD system (onscreen - WITH CRACKS for research)...");
      const buildStart = performance.now();

      const heightmap = this.heightmap;
      const chunkWidth = Math.floor(heightmap.width / this.#chunkGridSize);
      const chunkHeight = Math.floor(heightmap.height / this.#chunkGridSize);

      let totalTriangles = 0;

      // Build each chunk
      for (let chunkRow = 0; chunkRow < this.#chunkGridSize; chunkRow++) {
         for (let chunkCol = 0; chunkCol < this.#chunkGridSize; chunkCol++) {
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

            // Calculate chunk center in world space
            const centerX = ((chunk.baseStartX + chunk.baseEndX) / 2) * (2.0 / heightmap.width) - 1.0;
            const centerZ = ((chunk.baseStartZ + chunk.baseEndZ) / 2) * (2.0 / heightmap.height) - 1.0;
            chunk.centerX = centerX;
            chunk.centerZ = centerZ;
            chunk.centerY = -0.5;

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
      console.log(`✅ Built ${this.#chunks.length} chunks in ${(buildEnd - buildStart).toFixed(2)}ms, Total triangles (LOD 1): ${totalTriangles}`);
   }

   init()
   {
      // Initialize GPU resources for each chunk
      for (let chunk of this.#chunks) {
         for (let lod of chunk.lodLevels) {
            this.bindVertexArray();
            let gl = this.gl;

            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            // Vertex buffer
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lod.vertices), gl.STATIC_DRAW);

            const vertLocation = gl.getAttribLocation(this.program, "vert");
            gl.enableVertexAttribArray(vertLocation);
            gl.vertexAttribPointer(vertLocation, 3, gl.FLOAT, false, 0, 0);

            // Normal buffer
            const normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lod.norms), gl.STATIC_DRAW);

            const normLocation = gl.getAttribLocation(this.program, "norm");
            gl.enableVertexAttribArray(normLocation);
            gl.vertexAttribPointer(normLocation, 3, gl.FLOAT, false, 0, 0);

            // Index buffer
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(lod.indices), gl.STATIC_DRAW);

            chunk.buffers.push({
               vao: vao,
               indexCount: lod.indices.length
            });
         }
      }

      this.modelLocation = this.gl.getUniformLocation(this.program, "model");
      this.viewLocation = this.gl.getUniformLocation(this.program, "view");
      this.projectionLocation = this.gl.getUniformLocation(this.program, "projection");
      this.vertColorLocation = 2;

      console.log(`🎮 Initialized ${this.#chunks.length} chunks with GPU buffers`);
   }

   // Update LOD levels for all chunks based on camera position
   updateChunkLODs(cameraPos)
   {
      // Calculate desired LOD for each chunk based on distance
      for (let chunk of this.#chunks) {
         const dx = (cameraPos[0] / 3) - chunk.centerX;
         const dy = (cameraPos[1] / 3) - chunk.centerY;
         const dz = (cameraPos[2] / 3) - chunk.centerZ;
         const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

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

   // Build geometry for a specific chunk with specific LOD level - WITHOUT boundary overlap (shows cracks)
   buildChunkGeometryLOD(chunk, DOWNSAMPLE)
   {
      let heightmap = this.heightmap;
      let vertices = [];
      let norms = [];
      let indices = [];

      const bottom = -0.7, maxheight = 0.2 / heightmap.maxh;
      const rfi = 2.0 / heightmap.height, rfj = 2.0 / heightmap.width;
      let viter = 0;

      // NO boundary extension - chunks don't overlap (this creates visible cracks!)
      let startI = chunk.baseStartX;
      let startJ = chunk.baseStartZ;
      let endI = chunk.baseEndX;
      let endJ = chunk.baseEndZ;

      // Calculate actual dimensions based on loop iterations
      // Loop: for i from startI to (endI - DOWNSAMPLE) inclusive, step DOWNSAMPLE
      // Number of iterations = ((endI - DOWNSAMPLE) - startI) / DOWNSAMPLE + 1
      const chunkWidth = Math.floor((endI - startI) / DOWNSAMPLE);
      const chunkLength = Math.floor((endJ - startJ) / DOWNSAMPLE);

      // Build vertices for this chunk
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

      // Draw each chunk with its current LOD level
      for (let chunk of this.#chunks) {
         const lodIndex = chunk.currentLOD;
         const buffer = chunk.buffers[lodIndex];

         gl.bindVertexArray(buffer.vao);
         gl.drawElements(gl.TRIANGLES, buffer.indexCount, gl.UNSIGNED_INT, 0);
      }
   }
}

function addUIListeners (elm, controller)
{
   elm.addEventListener ( "click",     (event) => {controller.timer.switchStop();});
   elm.addEventListener ( "mousemove", (event) =>
   {
      if (event.shiftKey)
          [controller.camera.ypos, controller.camera.xpos] = [event.movementY, event.movementX];
      if (event.ctrlKey)                                
          [controller.camera.ytg,  controller.camera.xtg]  = [event.movementY, event.movementX];
   } );
   elm.addEventListener ( "wheel", (event) =>
   {
       console.log("wheel: " + event.deltaX + ":" + event.deltaY + ":" + event.deltaZ + ":" + event.deltaMode);
       event.preventDefault();
       //if (event.ctrlKey)
       //   console.log("prevent whole window from resizing");
   } );
}


async function main()
{
   //new HeightMap ("HeightMapButuceni", "./lib/heightmap/craterArizona.png").ready().then ( (v) =>  { heightMapDraw (v);} );
   new HeightMap (canvas, "./lib/heightmap/craterArizona.png").ready().then( (v) =>  { heightMapDraw (v);} );
   //new HeightMap ("HeightMapButuceni", "./lib/heightmap/butuceni.png").ready().then ( (v) =>  { heightMapDraw (v);} );
}

async function heightMapDraw (vao)
{
   let gl = vao.gl;
   let controller = new glcontroller ();

   addUIListeners (gl.canvas, controller);

   console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

   let fieldOfViewRadians    = rad (60);


   requestAnimationFrame(drawScene);

   // DEBUG: Performance tracking
   let frameCount = 0;
   let lastFpsUpdate = 0;
   let fps = 0;
   const MAX_FRAMES = Infinity; // Disabled - let it run to see if/when it freezes

   // Draw the scene.
   let then = 0;
   function drawScene(time)
   {
      // DEBUG: Frame limiting to prevent freeze
      frameCount++;
      if (frameCount > MAX_FRAMES) {
         console.warn('⚠️ Frame limit reached (' + MAX_FRAMES + ' frames). Stopping to prevent freeze.');
         return;
      }

      let ttime = time;
      time *= 0.001;
      let deltaTime = time - then;
      then = time;
      if (controller.timer.stop)
         deltaTime = 0;

      // DEBUG: FPS calculation
      if (time - lastFpsUpdate > 1.0) {
         fps = frameCount / (time - lastFpsUpdate);
         //console.log('📊 FPS:', fps.toFixed(1), '| Frame:', frameCount);
         frameCount = 0;
         lastFpsUpdate = time;
      }

      vao.useProgram();
      gl.enable   (gl.CULL_FACE);
      gl.enable   (gl.DEPTH_TEST);

      gl.clearColor (0., 0., 1., 1.0);
      gl.viewport (0, 0, gl.canvas.width, gl.canvas.height);
      //gl.blendFunc(gl.GL_SRC_ALPHA, gl.GL_ONE_MINUS_SRC_ALPHA);
      gl.clear    (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      if (true)
      {
         // Compute the projection matrix
         let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
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

         // Update chunk LOD levels based on camera position
         vao.updateChunkLODs(cameraPos);

         // Use perspective projection
         vao.model      = modelMatrix;
         vao.view       = viewMatrix;
         vao.projection = projectionMatrix;

         // DEBUG: Time the draw call
         const drawStart = performance.now();
         vao.draw();
         const drawEnd = performance.now();

         if (frameCount < 5 || frameCount % 30 === 0) {
            //console.log('🎨 Draw call time:', (drawEnd - drawStart).toFixed(2), 'ms');
         }
      }

      requestAnimationFrame(drawScene);
   }
}

main();
}