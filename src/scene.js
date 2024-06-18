// scene.js

import * as THREE from 'three';

// Define your desired fixed aspect ratio (e.g., 16:9)
const FIXED_ASPECT_RATIO = 16 / 9;
const ZOOM_PADDING = 1.15;  // Add padding to ensure content isn't cut off

export function initScene() {
    const scene = new THREE.Scene();
    return scene;
}

export function initRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
}

export function initCamera() {
    // Calculate the width and height based on the fixed aspect ratio
    let viewWidth, viewHeight;
    if (window.innerWidth / window.innerHeight > FIXED_ASPECT_RATIO) {
        // Window is wider than the fixed aspect ratio
        viewHeight = window.innerHeight;
        viewWidth = viewHeight * FIXED_ASPECT_RATIO;
    } else {
        // Window is taller than the fixed aspect ratio
        viewWidth = window.innerWidth;
        viewHeight = viewWidth / FIXED_ASPECT_RATIO;
    }

    const camera = new THREE.OrthographicCamera(
        -viewWidth / 2, 
        viewWidth / 2, 
        viewHeight / 2, 
        -viewHeight / 2, 
        1, 
        1000
    );
    camera.position.z = 10;

    // Adjust the camera zoom to fill the window initially with padding
    adjustZoom(camera, window.innerWidth, window.innerHeight);

    return camera;
}

// Adjust the camera zoom to fit the window with padding
export function adjustZoom(camera, windowWidth, windowHeight) {
    const aspectRatio = windowWidth / windowHeight;
    if (aspectRatio > FIXED_ASPECT_RATIO) {
        camera.zoom = (windowHeight / camera.top * 2) / ZOOM_PADDING;
    } else {
        camera.zoom = (windowWidth / camera.right * 2) / ZOOM_PADDING;
    }
    camera.updateProjectionMatrix();
}
