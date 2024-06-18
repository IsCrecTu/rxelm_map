// glowEffect.js

import * as THREE from 'three';

let glowInstancedMesh;
let glowColors;

export function initGlowEffect(rows, cols, squareSize, scene) {
    // Create glow instanced mesh
    const geometry = new THREE.PlaneGeometry(squareSize * 1.2, squareSize * 1.2); // Slightly larger for glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff, // Initial glow color
        transparent: false,
        opacity: 0.9,
        depthWrite: false, // Avoid writing to depth buffer to prevent occlusion issues
        blending: THREE.AdditiveBlending // Use additive blending for a glow effect
    });

    glowInstancedMesh = new THREE.InstancedMesh(geometry, glowMaterial, rows * cols);
    glowColors = new Float32Array(rows * cols * 3); // Separate colors for glow

    // Initialize glow mesh positions and colors
    const dummy = new THREE.Object3D();
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;

            dummy.position.set(j * squareSize - (cols * squareSize) / 2 + squareSize / 2, i * squareSize - (rows * squareSize) / 2 + squareSize / 2, 0);
            dummy.updateMatrix();
            glowInstancedMesh.setMatrixAt(index, dummy.matrix);

            new THREE.Color(0, 0, 0).toArray(glowColors, index * 3); // Initially invisible glow
        }
    }

    glowInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(glowColors, 3);
    scene.add(glowInstancedMesh);
}

export function updateGlowEffect(parsedCSV, asaIds, rows, cols) {
    if (!glowInstancedMesh) {
        console.error('glowInstancedMesh is not defined');
        return;
    }

    // Reset glow to be invisible
    for (let i = 0; i < glowInstancedMesh.count; i++) {
        glowInstancedMesh.setColorAt(i, new THREE.Color(0, 0, 0)); // Invisible by default
    }

    // Highlight only the matching blocks
    for (let i = 0; i < parsedCSV.length; i++) {
        const block = parsedCSV[i];
        const index = block.y * cols + block.x; // Compute the index based on row and column

        if (asaIds.includes(parseInt(block.index))) {
            // Make the corresponding glow block visible
            glowInstancedMesh.setColorAt(index, new THREE.Color(0xffffff)); // Glow color, e.g., orange
        }
    }

    glowInstancedMesh.instanceColor.needsUpdate = true; // Update the color attribute
}
