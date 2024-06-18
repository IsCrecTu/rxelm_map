// main.js

import { initScene, initRenderer, initCamera, adjustZoom } from './scene.js';
import { initControls } from './controls.js';
import { loadCSV, loadRealmsCSV } from './loaders.js';
import { onMouseMove, onMouseClick, onTouchStart, onTouchMove, onTouchEnd } from './eventHandlers.js';
import { defaultColor, notListedColor } from './constants.js';
import { fetchAlgorandAssets } from './algorandAPI.js'; // Import the function to fetch Algorand ASAs
import { initGlowEffect, updateGlowEffect } from './glowEffect.js'; // Import the glow effect functions

import * as THREE from 'three';

// Initialize the scene, camera, renderer, and controls
const scene = initScene();
const renderer = initRenderer();
const camera = initCamera();
const controls = initControls(camera, renderer.domElement);

// Append the renderer to the DOM
document.body.appendChild(renderer.domElement);

// Flag to track if it's the first load
let isFirstLoad = true;

// Variables for long touch handling
let touchTimer;
const longTouchDuration = 500; // 500 ms for long touch

// Create a tooltip for displaying block information
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = '#fff';
tooltip.style.padding = '5px';
tooltip.style.border = '1px solid #000';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Search bar elements
const searchBar = document.getElementById('search-bar');
const walletInput = document.getElementById('wallet-input');
const searchButton = document.getElementById('search-button');

// Variables to store the parsed CSV data and instance-related data
let parsedCSV = [];
let colors, instancedMesh;

// Add event listener for search button
searchButton.addEventListener('click', async () => {
    const walletAddress = walletInput.value.trim();
    if (walletAddress) {
        // Fetch ASAs held by the wallet
        const asaIds = await fetchAlgorandAssets(walletAddress);
        //highlightMatchingBlocks(asaIds);
        updateGlowEffect(parsedCSV, asaIds, max_y, max_x); // Update glow effect with matching blocks and grid dimensions
    }
});

// Function to highlight matching blocks
function highlightMatchingBlocks(asaIds) {
    if (!instancedMesh || !colors) {
        console.error('instancedMesh or colors are not defined');
        return;
    }

    // Reset all blocks to their original colors first
    for (let i = 0; i < parsedCSV.length; i++) {
        const block = parsedCSV[i];
        const color = new THREE.Color(block.realmColor || notListedColor);
        color.toArray(colors, block.instanceId * 3); // Use block's instanceId to correctly map the color
    }

    // Highlight only the matching blocks
    for (let i = 0; i < parsedCSV.length; i++) {
        const block = parsedCSV[i];
        if (asaIds.includes(parseInt(block.index))) {
            // Highlight block if it matches ASA ID
            const highlightColor = new THREE.Color(0xff0000); // Highlight color, e.g., red
            // Use block's instanceId to map the highlight color
            highlightColor.toArray(colors, block.instanceId * 3);
        }
    }

    // Update the colors in the instanced mesh
    instancedMesh.instanceColor.needsUpdate = true; // Update the color attribute
}

// Load the CSV files and create the grid
let max_x = 370;
let max_y = 270;

Promise.all([loadCSV('/realm_locations_sold.csv'), loadRealmsCSV('/rxelms.csv')]).then(([csvData, realmsCSV]) => {
    parsedCSV = csvData; // Store CSV data for later use
    console.log('CSV Loaded and Parsed:', parsedCSV);
    console.log('Realms CSV Loaded and Parsed:', realmsCSV);

    // Create a map for quick lookup of realm details
    const realmsMap = new Map(realmsCSV.map(realm => [realm.assignedRxelm, realm]));

    // Create a map for quick lookup of sold blocks
    const soldBlocks = new Map(parsedCSV.map(block => [`${block.x},${block.y}`, block]));

    // Create a 2D grid of 99,900 square blocks
    // const max_x = 370;
    // const max_y = 270;
    const squareSize = 1;

    const rows = max_y;
    const cols = max_x;

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    // Geometry for instanced meshes
    const geometry = new THREE.PlaneGeometry(squareSize, squareSize);

    // Basic material for the blocks
    const material = new THREE.MeshBasicMaterial();

    // Create instanced mesh and colors array
    instancedMesh = new THREE.InstancedMesh(geometry, material, rows * cols);
    colors = new Float32Array(rows * cols * 3); // Global variable to hold colors array
    let instanceIndex = 0;
    const dummy = new THREE.Object3D();

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const blockKey = `${col},${row}`;
            let color = notListedColor;

            if (soldBlocks.has(blockKey)) {
                const block = soldBlocks.get(blockKey);
                const realmDetails = realmsMap.get(block.realm);

                if (realmDetails) {
                    color = new THREE.Color(realmDetails.rxelmColor);
                    //block.realmColor = realmDetails.rxelmColor;  // Save realm color for highlighting
                    block.partner = realmDetails.partner;
                    block.rxelmName = realmDetails.rxelmName;
                } else {
                    color = defaultColor;
                }

                block.instanceId = instanceIndex;  // Store instance ID for raycasting
            }

            dummy.position.set(col * squareSize - (cols * squareSize) / 2 + squareSize / 2, row * squareSize - (rows * squareSize) / 2 + squareSize / 2, 0);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
            color.toArray(colors, instanceIndex * 3);
            instanceIndex++;
        }
    }

    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    scene.add(instancedMesh);

    // Initialize glow effect after the main instanced mesh is created
    initGlowEffect(rows, cols, squareSize, scene);

    // Render the scene
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        const aspectRatio = window.innerWidth / window.innerHeight;
        let viewWidth, viewHeight;

        if (aspectRatio > FIXED_ASPECT_RATIO) {
            viewHeight = window.innerHeight;
            viewWidth = viewHeight * FIXED_ASPECT_RATIO;
        } else {
            viewWidth = window.innerWidth;
            viewHeight = viewWidth / FIXED_ASPECT_RATIO;
        }

        camera.left = -viewWidth / 2;
        camera.right = viewWidth / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;

        // Only adjust zoom on the first load
        if (isFirstLoad) {
            adjustZoom(camera, window.innerWidth, window.innerHeight);
            isFirstLoad = false;
        }
        camera.updateProjectionMatrix();
        renderer.setSize(viewWidth, viewHeight);
    });

    // Add event listeners for interaction
    window.addEventListener('mousemove', (event) => onMouseMove(event, mouse, raycaster, camera, instancedMesh, parsedCSV, tooltip));
    window.addEventListener('click', (event) => onMouseClick(event, mouse, raycaster, camera, instancedMesh, parsedCSV));
    window.addEventListener('touchstart', (event) => onTouchStart(event, mouse, raycaster, camera, instancedMesh, parsedCSV, tooltip, touchTimer, longTouchDuration));
    window.addEventListener('touchmove', (event) => onTouchMove(event, mouse, raycaster, camera, instancedMesh, parsedCSV, tooltip));
    window.addEventListener('touchend', () => onTouchEnd(tooltip, touchTimer));

}).catch(error => {
    console.error('Error loading CSV:', error);
});
