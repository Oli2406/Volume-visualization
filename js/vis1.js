/**
 * Vis 1 Task 1 Framework
 * Copyright (C) TU Wien
 *   Institute of Visual Computing and Human-Centered Technology
 *   Research Unit of Computer Graphics
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are not permitted.
 *
 * Main script for Vis1 exercise. Loads the volume, initializes the scene, and contains the paint function.
 *
 * @author Manuela Waldner
 * @author Laura Luidolt
 * @author Diana Schalko
 */
let renderer, camera, scene, orbitCamera;
let canvasWidth = window.innerWidth * 0.7;
let canvasHeight = window.innerHeight * 0.7;
let container = null;
let volume = null;
let fileInput = null;
let myShader = null;
let isoValue = 0.3;

// Initialize the application
function init() {
    initializeRenderer();
    fileInput = document.getElementById("upload");
    fileInput.addEventListener('change', readFile);
}

// Initialize the WebGL renderer
function initializeRenderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvasWidth, canvasHeight);
    container = document.getElementById("viewContainer");
    container.appendChild(renderer.domElement);
}

// Read and parse the volume file
function readFile() {
    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("Data loaded.");
        let data = new Uint16Array(reader.result);
        volume = new Volume(data);
        resetVis();
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

// Reset the visualization
async function resetVis() {
    myShader = new rayShader(volume, isoValue);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
    const geometry = new THREE.BoxGeometry(volume.width, volume.height, volume.depth);
    const myMaterial = myShader.material;
    await myShader.load();
    const boundingBox = new THREE.Mesh(geometry, myMaterial);
    scene.add(boundingBox);
    orbitCamera = new OrbitCamera(camera, new THREE.Vector3(0, 0, 0), 2 * volume.max, renderer.domElement);
    requestAnimationFrame(paint);
}

// Render the scene
function paint() {
    if (volume) {
        renderer.render(scene, camera);
    }
}

// Update the iso value of the custom shader
function updateShaderIso(iso) {
    isoValue = iso;
    resetVis();
}
//test