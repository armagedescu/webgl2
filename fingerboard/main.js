// main.js - WebGL2 setup and rendering for fingerboard

let gl;
let programInfo;
let buffers;
let camera = {
    rotation: { x: -0.3, y: 0 },
    distance: -3.5  // Changed to negative - camera should be behind looking forward
};
let mouse = {
    down: false,
    lastX: 0,
    lastY: 0
};

function main() {
    const canvas = document.getElementById('glcanvas');
    gl = canvas.getContext('webgl2');

    if (!gl) {
        alert('Unable to initialize WebGL2. Your browser may not support it.');
        return;
    }

    // Set canvas size
    resizeCanvas(canvas);
    window.addEventListener('resize', () => resizeCanvas(canvas));

    // Setup shaders
    const program = createProgram(
        gl,
        document.getElementById('vertex-shader').textContent,
        document.getElementById('fragment-shader').textContent
    );

    if (!program) {
        console.error('Failed to create shader program');
        return;
    }

    console.log('Shader program created successfully');

    programInfo = {
        program: program,
        attribLocations: {
            position: gl.getAttribLocation(program, 'a_position'),
            normal: gl.getAttribLocation(program, 'a_normal'),
            color: gl.getAttribLocation(program, 'a_color')
        },
        uniformLocations: {
            matrix: gl.getUniformLocation(program, 'u_matrix'),
            normalMatrix: gl.getUniformLocation(program, 'u_normalMatrix')
        }
    };

    // Create geometry
    const fingerboard = new Fingerboard();
    const data = fingerboard.getData();

    console.log('Fingerboard created:',
        data.vertices.length/3, 'vertices,',
        data.indices.length/3, 'triangles');

    // Setup buffers
    buffers = {
        position: createBuffer(gl, data.vertices),
        normal: createBuffer(gl, data.normals),
        color: createBuffer(gl, data.colors),
        indices: createIndexBuffer(gl, data.indices),
        numElements: data.indices.length
    };

    // Setup mouse controls
    setupControls(canvas);

    console.log('Starting render loop...');

    // Start rendering
    requestAnimationFrame(render);
}

let frameCount = 0;

function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function createBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

function createIndexBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

function setupControls(canvas) {
    // Mouse rotation
    canvas.addEventListener('mousedown', (e) => {
        mouse.down = true;
        mouse.lastX = e.clientX;
        mouse.lastY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
        mouse.down = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!mouse.down) return;

        const deltaX = e.clientX - mouse.lastX;
        const deltaY = e.clientY - mouse.lastY;

        camera.rotation.y += deltaX * 0.01;
        camera.rotation.x += deltaY * 0.01;

        // Clamp vertical rotation
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

        mouse.lastX = e.clientX;
        mouse.lastY = e.clientY;
    });

    // Zoom with mouse wheel
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.distance += e.deltaY * 0.01;
        camera.distance = Math.max(1, Math.min(10, camera.distance));
    });

    // Touch support
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            mouse.down = true;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && mouse.down) {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;

            camera.rotation.y += deltaX * 0.01;
            camera.rotation.x += deltaY * 0.01;

            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });

    canvas.addEventListener('touchend', () => {
        mouse.down = false;
    });
}

function render(time) {
    time *= 0.001; // Convert to seconds

    // Log first few frames
    if (frameCount < 3) {
        console.log('Rendering frame', frameCount);
    }
    frameCount++;

    // Clear
    gl.clearColor(0.1, 0.1, 0.15, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    // Temporarily disable culling to see if that's the issue
    // gl.enable(gl.CULL_FACE);

    // Use program
    gl.useProgram(programInfo.program);

    // Setup attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.enableVertexAttribArray(programInfo.attribLocations.position);
    gl.vertexAttribPointer(programInfo.attribLocations.position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.enableVertexAttribArray(programInfo.attribLocations.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.enableVertexAttribArray(programInfo.attribLocations.color);
    gl.vertexAttribPointer(programInfo.attribLocations.color, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Calculate matrices
    const aspect = gl.canvas.width / gl.canvas.height;
    const projectionMatrix = m4.perspective(Math.PI / 4, aspect, 0.1, 100);

    if (frameCount === 1) {
        console.log('Camera distance:', Math.abs(camera.distance));
        console.log('Camera rotation:', camera.rotation);
        console.log('Aspect ratio:', aspect);
    }

    // Calculate camera position using spherical coordinates
    const distance = Math.abs(camera.distance);
    const cameraX = Math.sin(camera.rotation.y) * Math.cos(camera.rotation.x) * distance;
    const cameraY = Math.sin(camera.rotation.x) * distance;
    const cameraZ = Math.cos(camera.rotation.y) * Math.cos(camera.rotation.x) * distance;

    const cameraPosition = [cameraX, cameraY, cameraZ];
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    // Use lookAt to create camera matrix
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // View matrix (inverse of camera)
    const viewMatrix = m4.inverse(cameraMatrix);

    // Model matrix (small auto-rotation for visual interest)
    let modelMatrix = m4.identity();
    modelMatrix = m4.yRotate(modelMatrix, time * 0.1);

    // Combined matrix
    let matrix = m4.multiply(projectionMatrix, viewMatrix);
    matrix = m4.multiply(matrix, modelMatrix);

    // Normal matrix (for lighting)
    const normalMatrix = m4.transpose(m4.inverse(modelMatrix));

    // Set uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.matrix, false, matrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

    // Draw
    gl.drawElements(gl.TRIANGLES, buffers.numElements, gl.UNSIGNED_SHORT, 0);

    // Check for GL errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR && frameCount < 3) {
        console.error('WebGL error:', error);
    }

    // Continue animation
    requestAnimationFrame(render);
}

// Start when page loads
window.addEventListener('load', main);
