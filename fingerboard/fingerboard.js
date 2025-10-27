// fingerboard.js - Geometry generation for 3D fingerboard

class Fingerboard {
    constructor() {
        this.vertices = [];
        this.normals = [];
        this.colors = [];
        this.indices = [];

        this.buildFingerboard();
    }

    buildFingerboard() {
        // Build all components
        this.buildDeck();
        this.buildTrucks();
        this.buildWheels();
    }

    // Build the skateboard deck (curved rectangular board)
    buildDeck() {
        const length = 2.0;  // Deck length
        const width = 0.6;   // Deck width
        const height = 0.08; // Deck thickness
        const segments = 20; // For smooth curves

        const deckColor = [0.9, 0.7, 0.3]; // Wood color

        // Create curved deck using segments
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = (t - 0.5) * length;

            // Calculate curve (nose and tail kick up)
            let yOffset = 0;
            if (t < 0.2) {
                // Nose curve
                const curveT = (0.2 - t) / 0.2;
                yOffset = curveT * curveT * 0.3;
            } else if (t > 0.8) {
                // Tail curve
                const curveT = (t - 0.8) / 0.2;
                yOffset = curveT * curveT * 0.25;
            }

            // Top and bottom of deck at this position
            for (let side = -1; side <= 1; side += 2) {
                const z = side * width / 2;

                // Top surface
                this.addVertex(x, yOffset + height/2, z, deckColor);
                // Bottom surface
                this.addVertex(x, yOffset - height/2, z, deckColor);
            }
        }

        // Create triangles for deck surface
        for (let i = 0; i < segments; i++) {
            const base = i * 4;

            // Top surface
            this.addQuad(base, base + 2, base + 6, base + 4);
            // Bottom surface
            this.addQuad(base + 1, base + 5, base + 7, base + 3);
            // Left edge
            this.addQuad(base, base + 4, base + 5, base + 1);
            // Right edge
            this.addQuad(base + 2, base + 3, base + 7, base + 6);
        }

        // Add front and back caps
        const totalVerts = (segments + 1) * 4;
        // Front cap
        this.addQuad(0, 1, 3, 2);
        // Back cap
        this.addQuad(totalVerts - 4, totalVerts - 2, totalVerts - 1, totalVerts - 3);
    }

    // Build trucks (2 metal axle assemblies)
    buildTrucks() {
        const positions = [-0.6, 0.6]; // Front and back truck positions
        const truckColor = [0.5, 0.5, 0.5]; // Metal gray

        positions.forEach(xPos => {
            this.buildTruck(xPos, truckColor);
        });
    }

    buildTruck(xPos, color) {
        const width = 0.7;
        const height = 0.15;
        const thickness = 0.08;

        // Create simple box for truck base
        this.addBox(xPos, -0.08, 0, thickness, height, width, color);
    }

    // Build 4 wheels
    buildWheels() {
        const positions = [
            [-0.6, -0.35],  // Front left
            [-0.6, 0.35],   // Front right
            [0.6, -0.35],   // Back left
            [0.6, 0.35]     // Back right
        ];

        const wheelColor = [0.2, 0.2, 0.2]; // Black wheels

        positions.forEach(([x, z]) => {
            this.buildWheel(x, z, wheelColor);
        });
    }

    buildWheel(xPos, zPos, color) {
        const radius = 0.12;
        const thickness = 0.08;
        const segments = 16;

        const startIdx = this.vertices.length / 3;

        // Create wheel as a cylinder
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Outer ring
            for (let side = -1; side <= 1; side += 2) {
                const z = zPos + side * thickness / 2;
                this.addVertex(
                    xPos + cos * radius,
                    -0.2 + sin * radius,
                    z,
                    color
                );
            }

            // Center vertices for caps
            for (let side = -1; side <= 1; side += 2) {
                const z = zPos + side * thickness / 2;
                this.addVertex(xPos, -0.2, z, color);
            }
        }

        // Create triangles for wheel
        for (let i = 0; i < segments; i++) {
            const base = startIdx + i * 4;

            // Outer surface
            this.addQuad(base, base + 1, base + 5, base + 4);

            // Front cap (triangles from center)
            this.addTriangle(base + 2, base + 6, base);

            // Back cap
            this.addTriangle(base + 3, base + 1, base + 7);
        }
    }

    // Helper: Add a vertex with normal calculation
    addVertex(x, y, z, color) {
        this.vertices.push(x, y, z);
        this.colors.push(color[0], color[1], color[2]);
        // Normals will be calculated later
        this.normals.push(0, 0, 0);
    }

    // Helper: Add a box
    addBox(cx, cy, cz, width, height, depth, color) {
        const x1 = cx - width / 2, x2 = cx + width / 2;
        const y1 = cy - height / 2, y2 = cy + height / 2;
        const z1 = cz - depth / 2, z2 = cz + depth / 2;

        const startIdx = this.vertices.length / 3;

        // 8 vertices of the box
        this.addVertex(x1, y1, z1, color); // 0
        this.addVertex(x2, y1, z1, color); // 1
        this.addVertex(x2, y2, z1, color); // 2
        this.addVertex(x1, y2, z1, color); // 3
        this.addVertex(x1, y1, z2, color); // 4
        this.addVertex(x2, y1, z2, color); // 5
        this.addVertex(x2, y2, z2, color); // 6
        this.addVertex(x1, y2, z2, color); // 7

        // 6 faces (12 triangles)
        // Front
        this.addQuad(startIdx + 0, startIdx + 1, startIdx + 2, startIdx + 3);
        // Back
        this.addQuad(startIdx + 5, startIdx + 4, startIdx + 7, startIdx + 6);
        // Left
        this.addQuad(startIdx + 4, startIdx + 0, startIdx + 3, startIdx + 7);
        // Right
        this.addQuad(startIdx + 1, startIdx + 5, startIdx + 6, startIdx + 2);
        // Top
        this.addQuad(startIdx + 3, startIdx + 2, startIdx + 6, startIdx + 7);
        // Bottom
        this.addQuad(startIdx + 4, startIdx + 5, startIdx + 1, startIdx + 0);
    }

    // Helper: Add a quad (2 triangles)
    addQuad(i0, i1, i2, i3) {
        this.addTriangle(i0, i1, i2);
        this.addTriangle(i0, i2, i3);
    }

    // Helper: Add a triangle and calculate normal
    addTriangle(i0, i1, i2) {
        this.indices.push(i0, i1, i2);

        // Calculate face normal
        const v0 = [
            this.vertices[i0 * 3],
            this.vertices[i0 * 3 + 1],
            this.vertices[i0 * 3 + 2]
        ];
        const v1 = [
            this.vertices[i1 * 3],
            this.vertices[i1 * 3 + 1],
            this.vertices[i1 * 3 + 2]
        ];
        const v2 = [
            this.vertices[i2 * 3],
            this.vertices[i2 * 3 + 1],
            this.vertices[i2 * 3 + 2]
        ];

        // Calculate normal using cross product
        const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

        const normal = [
            edge1[1] * edge2[2] - edge1[2] * edge2[1],
            edge1[2] * edge2[0] - edge1[0] * edge2[2],
            edge1[0] * edge2[1] - edge1[1] * edge2[0]
        ];

        // Add normal to each vertex (will be averaged later)
        [i0, i1, i2].forEach(idx => {
            this.normals[idx * 3] += normal[0];
            this.normals[idx * 3 + 1] += normal[1];
            this.normals[idx * 3 + 2] += normal[2];
        });
    }

    // Normalize all normals
    normalizeNormals() {
        for (let i = 0; i < this.normals.length; i += 3) {
            const x = this.normals[i];
            const y = this.normals[i + 1];
            const z = this.normals[i + 2];
            const len = Math.sqrt(x * x + y * y + z * z);

            if (len > 0) {
                this.normals[i] /= len;
                this.normals[i + 1] /= len;
                this.normals[i + 2] /= len;
            }
        }
    }

    getData() {
        this.normalizeNormals();
        return {
            vertices: new Float32Array(this.vertices),
            normals: new Float32Array(this.normals),
            colors: new Float32Array(this.colors),
            indices: new Uint16Array(this.indices)
        };
    }
}
