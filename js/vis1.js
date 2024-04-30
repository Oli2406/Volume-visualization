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

let svg, x, y = null;

let margin = 50;
let histogramWidth = 500;
let histogramHeight = 800;

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

    svg.selectAll("rect").remove();

    updateHistogram(volume.voxels);

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
        .attr("width", histogramWidth)
        .attr("height", histogramHeight);

    x = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([margin, histogramWidth - margin]);

    svg.append("g")
        .attr("transform", `translate(0, ${histogramHeight / 2 - margin})`)
        .attr("id", "xAxis")
        .call(d3.axisBottom(x));

    svg.append("text")
        .style("fill", "white")
        .text("density")
        .attr("x", histogramWidth - (margin * 2))
        .attr("y", histogramHeight / 2 - 10);

    y = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([histogramHeight / 2 - margin, margin]);

    svg.append("g")
        .attr("transform", `translate(${margin}, 0)`)
        .attr("id", "yAxis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .style("fill", "white")
        .text("intensity")
        .attr("transform", `translate(10, ${margin * 2})rotate(270)`);
}

function updateHistogram(data) {
    const histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(100));

    const bins = histogram(data);

    const yHist = d3.scalePow()
        .range([histogramHeight / 2, 0])
        .domain([0, d3.max(bins, function (d) {
            return d.length;
        })])
        .exponent(0.2);

    svg.selectAll("rect")
        .data(bins)
        .transition()
        .duration(500)
        .attr("height", function (d) {
            return (histogramHeight / 2) - yHist(d.length);
        });

    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", margin)
        .attr("opacity", 0.6)
        .attr("transform", function (d) {
            return "translate(" + x(d.x0) + "," + 300 + ")";
        })
        .attr("width", function (d) {
            if ((x(d.x1) - x(d.x0)) === 0) {
                return 0;
            }
            return (x(d.x1) - x(d.x0)) - 1;
        })
        .attr("height", 0)
        .transition()
        .duration(500)
        .attr("height", function (d) {
            return (histogramHeight / 2) - yHist(d.length);
        })
        .style("fill", "#03AC13");

    svg.selectAll("rect")
        .data(bins)
        .exit()
        .transition()
        .duration(500)
        .attr("height", 0)
        .remove();
}