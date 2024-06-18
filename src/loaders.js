// loaders.js
import * as THREE from 'three';

export async function loadCSV(path) {
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

export async function loadRealmsCSV(path) {
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
        throw new Error('CSV file does not contain the required columns: Assigned Rxelm, Partner, Rxelm Name, Rxelm color');
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
