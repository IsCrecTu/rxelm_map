import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableZoom = true;
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = true;
    return controls;
}
