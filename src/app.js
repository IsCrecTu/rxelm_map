import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Function to load and parse CSV file
async function loadCSV(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load CSV file: ${response.statusText}`);
    }
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

    const indexIndex = headers.indexOf('index');
    const xIndex = headers.indexOf('properties_x');
    const yIndex = headers.indexOf('properties_y');
    const realmIndex = headers.indexOf('properties_realm');

    if (indexIndex === -1 || xIndex === -1 || yIndex === -1 || realmIndex === -1) {
        throw new Error('CSV file does not contain the required columns: index, properties_x, properties_y, properties_realm');
    }

    return lines.slice(1).map(line => {
        const fields = line.split(',').map(field => field.trim().replace(/"/g, ''));
        return { 
            index: fields[indexIndex], 
            x: parseInt(fields[xIndex]), 
            y: parseInt(fields[yIndex]), 
            realm: fields[realmIndex],
            fields: fields  // Store all fields for detailed information
        };
    });
}

// Function to load and parse realms CSV file
async function loadRealmsCSV(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load CSV file: ${response.statusText}`);
    }
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

    const assignedRxelmIndex = headers.indexOf('assignedrxelm');
    const partnerIndex = headers.indexOf('partner');
    const rxelmNameIndex = headers.indexOf('rxelmname');
    const rxelmColorIndex = headers.indexOf('rxelmcolor');

    if (assignedRxelmIndex === -1 || partnerIndex === -1 || rxelmNameIndex === -1 || rxelmColorIndex === -1) {
        throw new Error(`CSV file does not contain the required columns: Assigned Rxelm, Partner, Rxelm Name, Rxelm color: ${headers}`);
    }

    return lines.slice(1).map(line => {
        const fields = line.split(',').map(field => field.trim().replace(/"/g, ''));
        return { 
            assignedRxelm: fields[assignedRxelmIndex], 
            partner: fields[partnerIndex], 
            rxelmName: fields[rxelmNameIndex], 
            rxelmColor: fields[rxelmColorIndex]
        };
    });
}

// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return new THREE.Color(color);
}

// Define default colors
const defaultColor = new THREE.Color(0x00ffff);  // Cyan for any other realm
const notListedColor = new THREE.Color(0x808080);  // Gray for blocks not listed in the CSV

// Initialize the scene, camera, renderer, and controls
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-185, 185, 135, -135, 1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enableRotate = false;
controls.enablePan = true;

camera.position.z = 10;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = '#fff';
tooltip.style.padding = '5px';
tooltip.style.border = '1px solid #000';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Load the CSV files and create the grid
Promise.all([loadCSV('/realm_locations_sold.csv'), loadRealmsCSV('/rxelms.csv')]).then(([parsedCSV, realmsCSV]) => {
    console.log('CSV Loaded and Parsed:', parsedCSV);
    console.log('Realms CSV Loaded and Parsed:', realmsCSV);

    // Create a map for quick lookup of realm details
    const realmsMap = new Map(realmsCSV.map(realm => [realm.assignedRxelm, realm]));

    // Create a map for quick lookup of sold blocks
    const soldBlocks = new Map(parsedCSV.map(block => [`${block.x},${block.y}`, block]));

    // Create a 2D grid of 99,900 square blocks
    const max_x = 370;
    const max_y = 270;
    const squareSize = 1;

    const rows = max_y;
    const cols = max_x;

    // Geometry for instanced meshes
    const geometry = new THREE.PlaneGeometry(squareSize, squareSize);

    // Basic material for the blocks
    const material = new THREE.MeshBasicMaterial();

    // Create instanced mesh and colors array
    const instancedMesh = new THREE.InstancedMesh(geometry, material, rows * cols);
    const colors = new Float32Array(rows * cols * 3);
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

    // Render the scene
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.left = -window.innerWidth / 2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = -window.innerHeight / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Mouse move event
    window.addEventListener('mousemove', onMouseMove);

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(instancedMesh);

        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            const intersectedBlock = parsedCSV.find(block => block.instanceId === instanceId);

            if (intersectedBlock) {
                const info = intersectedBlock.fields.join('<br>') + `<br>Partner: ${intersectedBlock.partner}<br>Rxelm Name: ${intersectedBlock.rxelmName}`;
                tooltip.innerHTML = info;
                tooltip.style.left = event.clientX + 'px';
                tooltip.style.top = event.clientY + 'px';
                tooltip.style.display = 'block';
            }
        } else {
            tooltip.style.display = 'none';
        }
    }

    // Mouse click event
    window.addEventListener('click', onMouseClick);

    function onMouseClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(instancedMesh);

        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            const intersectedBlock = parsedCSV.find(block => block.instanceId === instanceId);

            if (intersectedBlock) {
                const assetId = intersectedBlock.index;
                const url = `https://allo.info/asset/${assetId}/nft/`;
                window.open(url, '_blank');
            }
        }
    }

}).catch(error => {
    console.error('Error loading CSV:', error);
});
