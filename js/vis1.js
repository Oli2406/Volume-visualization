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
let histogramData = null;

let svg, xAxis, yAxis, xLabel, yLabel, xScale, yScale, markedLine, myCircle, bars = null;

let margin = 75;
let editorWidth = 600;
let editorHeight = 950;

// Initialize the application
function init() {
    initializeRenderer();
    fileInput = document.getElementById("upload");
    fileInput.addEventListener('change', readFile);
    createHistogram();
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

        updateHistogram(data);

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

function createHistogram() {
    svg = d3.select("#histogramContainer")
            .append("svg")
            .attr("width", editorWidth)
            .attr("height", editorHeight)
            .append("g")
            .attr("transform", 
                  "translate(" + margin + "," + 10 + ")");
    
    yAxis = svg.append("g");

    xScale = d3.scaleLinear().domain([0, 1]).range([0, editorWidth / 2]);
}

function updateHistogram(data) {

    svg.selectAll("*").remove();

    let floatD = [];
    data.slice(3).forEach(function(voxel) {
        if(voxel > 0) {
            floatD.push(voxel / 4095.0);
        }
    });

    let j = floatD.length;

    let bins = d3.bin().domain(xScale.domain()).thresholds(xScale.ticks(100))(floatD);

    yScale = d3.scaleLinear().domain([0, d3.max(bins, function (d) {
        return d.length / j;
    })])
    .range([editorHeight / 4, 0]);

    bars = svg.selectAll("rect").data(bins);

    svg.selectAll("rect")
        .data(bins)
        .join(enter => enter.append("rect")
                            .attr("x", 1)
                            .attr("transform", d => "translate(" + xScale(d.x0) + "," + editorHeight / 4 + ")")
                            .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
                            .attr("height", 0)
                            .style("fill", "#AAAAAA")
                            .call(enter => enter.transition().duration(1000)
                            .attr("height", d => editorHeight / 4 - yScale(d.length / j))),
                        update => update
                            .call(update => update.transition().duration(1000)
                            .attr("x", 1)
                            .attr("transform", d => "translate(" + xScale(d.x0) + "," + editorHeight / 4 + ")")
                            .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
                            .attr("height", d => editorHeight / 4 - yScale(d.length / n))),
                        exit => exit
                            .call(exit => exit.transition().duration(1000)
                            .attr("height", 0)
                            .remove())
            );
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + editorHeight / 4 + ")")
        .call(d3.axisBottom(xScale));
    
        yAxis = svg.append("g")
        .call(d3.axisLeft(yScale));
    
    xLabel = svg.append("text")
        .attr("transform", "translate(" + (editorWidth + 50 / 2) + ", " + (editorHeight / 4) + ")")
        .attr("fill", "#fff")
        .style("text-anchor", "middle")
        .text("Density");
    
    yLabel = svg.append("text")
        .attr("transform", "translate(-45, 30) rotate(-90)")
        .attr("fill", "#fff")
        .style("text-anchor", "middle")
        .text("Intensity");
}