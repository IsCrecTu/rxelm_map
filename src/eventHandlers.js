// eventHandlers.js

import * as THREE from 'three';

export function onMouseMove(event, mouse, raycaster, camera, instancedMesh, parsedCSV, tooltip) {
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

export function onMouseClick(event, mouse, raycaster, camera, instancedMesh, parsedCSV) {
    if (event.type === 'touchstart') {
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (touch.clientY / window.innerHeight) * 2 + 1;
    } else {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

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

export function onTouchStart(event, mouse, raycaster, camera, instancedMesh, parsedCSV, tooltip, touchTimer, longTouchDuration) {
    if (event.touches.length === 1) {
        touchTimer = setTimeout(() => {
            const touch = event.touches[0];
            mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (touch.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObject(instancedMesh);

            if (intersects.length > 0) {
                const instanceId = intersects[0].instanceId;
                const intersectedBlock = parsedCSV.find(block => block.instanceId === instanceId);

                if (intersectedBlock) {
                    const info = intersectedBlock.fields.join('<br>') + `<br>Partner: ${intersectedBlock.partner}<br>Rxelm Name: ${intersectedBlock.rxelmName}`;
                    tooltip.innerHTML = info;
                    tooltip.style.left = touch.clientX + 'px';
                    tooltip.style.top = touch.clientY + 'px';
                    tooltip.style.display = 'block';
                }
            }
        }, longTouchDuration);
    }
}

export function onTouchMove(event, mouse, raycaster, camera, instancedMesh, parsedCSV, tooltip) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (touch.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(instancedMesh);

        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            const intersectedBlock = parsedCSV.find(block => block.instanceId === instanceId);

            if (intersectedBlock) {
                const info = intersectedBlock.fields.join('<br>') + `<br>Partner: ${intersectedBlock.partner}<br>Rxelm Name: ${intersectedBlock.rxelmName}`;
                tooltip.innerHTML = info;
                tooltip.style.left = touch.clientX + 'px';
                tooltip.style.top = touch.clientY + 'px';
                tooltip.style.display = 'block';
            }
        } else {
            tooltip.style.display = 'none';
        }
    }
}

export function onTouchEnd(tooltip, touchTimer) {
    clearTimeout(touchTimer);
    tooltip.style.display = 'none';
}
