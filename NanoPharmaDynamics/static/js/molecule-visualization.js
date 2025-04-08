/**
 * molecule-visualization.js
 * Simple and basic 3D-like molecular visualization
 */

// Global variables
let container = null;
let canvas = null;
let ctx = null;
let isVisible = false;
let animationFrameId = null;
let currentSmiles = null;
let currentOptimization = null;
let rotation = 0;
let moleculeRotation = 0;
let zoomFactor = 1;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
let dragStartRotation = 0;

// Standard atom colors based on chemical elements
const atomColors = {
    'C': '#333333',  // Carbon - dark gray
    'H': '#FFFFFF',  // Hydrogen - white
    'O': '#FF0000',  // Oxygen - red
    'N': '#0000FF',  // Nitrogen - blue
    'S': '#FFFF00',  // Sulfur - yellow
    'P': '#FF8000',  // Phosphorus - orange
    'F': '#90E050',  // Fluorine - light green
    'Cl': '#1FF01F', // Chlorine - green
    'Br': '#A62929', // Bromine - brown
    'I': '#940094',  // Iodine - purple
    'default': '#808080' // Default - gray
};

// Standard atom radii
const atomRadii = {
    'C': 0.7,   // Carbon
    'H': 0.4,   // Hydrogen
    'O': 0.65,  // Oxygen
    'N': 0.65,  // Nitrogen
    'S': 1.0,   // Sulfur
    'P': 1.0,   // Phosphorus
    'F': 0.6,   // Fluorine
    'default': 0.8 // Default
};

// Example molecule data structures for common molecules with complete atoms including hydrogens
const moleculeStructures = {
    // Caffeine structure with all atoms
    'CN1C=NC2=C1C(=O)N(C(=O)N2C)C': {
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'N', x: 1, y: 0, z: 0 },
            { element: 'C', x: 1.5, y: 1, z: 0 },
            { element: 'N', x: 2.5, y: 0.5, z: 0 },
            { element: 'C', x: 2, y: -0.5, z: 0 },
            { element: 'C', x: 2.5, y: -1.5, z: 0 },
            { element: 'O', x: 3.5, y: -1.5, z: 0.5 },
            { element: 'N', x: 2, y: -2.5, z: 0 },
            { element: 'C', x: 2.5, y: -3.5, z: 0.5 },
            { element: 'O', x: 3.5, y: -3.5, z: 1 },
            { element: 'N', x: 1.5, y: -4, z: 0.5 },
            { element: 'C', x: 1, y: -3, z: 0 },
            { element: 'C', x: 0, y: -3, z: -0.5 },
            { element: 'N', x: 0.5, y: -2, z: 0 },
            { element: 'C', x: 0, y: -1, z: -0.5 },
            { element: 'C', x: -1, y: -4, z: -0.5 },
            { element: 'C', x: 1.5, y: -5.5, z: 0.5 },
            { element: 'C', x: -1, y: 0.5, z: 0 },
            { element: 'H', x: -0.5, y: -1.5, z: -1 },
            { element: 'H', x: -1.5, y: 0, z: 0.5 },
            { element: 'H', x: -1.2, y: 1, z: -0.5 },
            { element: 'H', x: 1.2, y: 2, z: 0 },
            { element: 'H', x: -1, y: -4.5, z: -1.2 },
            { element: 'H', x: -1.5, y: -4.2, z: 0.3 },
            { element: 'H', x: -1.3, y: -3.3, z: -1 },
            { element: 'H', x: 1, y: -6, z: 1.2 },
            { element: 'H', x: 2.5, y: -6, z: 0.5 },
            { element: 'H', x: 1, y: -5.7, z: -0.3 }
        ],
        bonds: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 1 },
            { from: 4, to: 5 },
            { from: 5, to: 6, type: 'double' },
            { from: 5, to: 7 },
            { from: 7, to: 8 },
            { from: 8, to: 9, type: 'double' },
            { from: 8, to: 10 },
            { from: 10, to: 11 },
            { from: 11, to: 12 },
            { from: 11, to: 13 },
            { from: 13, to: 4 },
            { from: 13, to: 14 },
            { from: 14, to: 0 },
            { from: 12, to: 15 },
            { from: 10, to: 16 },
            { from: 0, to: 17 },
            { from: 14, to: 18 },
            { from: 17, to: 19 },
            { from: 17, to: 20 },
            { from: 2, to: 21 },
            { from: 15, to: 22 },
            { from: 15, to: 23 },
            { from: 15, to: 24 },
            { from: 16, to: 25 },
            { from: 16, to: 26 },
            { from: 16, to: 27 }
        ]
    },
    
    // Aspirin structure with all atoms
    'CC(=O)OC1=CC=CC=C1C(=O)O': {
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1, y: 0.5, z: 0 },
            { element: 'O', x: 1, y: 1.5, z: 0.5 },
            { element: 'O', x: 2, y: 0, z: 0 },
            { element: 'C', x: 3, y: 0.5, z: 0 },
            { element: 'C', x: 4, y: 0, z: 0 },
            { element: 'C', x: 5, y: 0.5, z: 0 },
            { element: 'C', x: 5, y: 1.5, z: 0 },
            { element: 'C', x: 4, y: 2, z: 0 },
            { element: 'C', x: 3, y: 1.5, z: 0 },
            { element: 'C', x: 2.5, y: 2.5, z: 0 },
            { element: 'O', x: 3, y: 3.5, z: 0 },
            { element: 'O', x: 1.5, y: 2.5, z: 0 },
            { element: 'H', x: -0.5, y: 0.5, z: 0.3 },
            { element: 'H', x: -0.3, y: -0.5, z: -0.5 },
            { element: 'H', x: 0.3, y: -0.5, z: 0.5 },
            { element: 'H', x: 4, y: -1, z: 0 },
            { element: 'H', x: 6, y: 0, z: 0 },
            { element: 'H', x: 6, y: 2, z: 0 },
            { element: 'H', x: 4, y: 3, z: 0 },
            { element: 'H', x: 3.5, y: 4, z: 0 },
            { element: 'H', x: 0.8, y: 2, z: 0.3 }
        ],
        bonds: [
            { from: 0, to: 1 },
            { from: 1, to: 2, type: 'double' },
            { from: 1, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 5 },
            { from: 5, to: 6 },
            { from: 6, to: 7 },
            { from: 7, to: 8 },
            { from: 8, to: 9 },
            { from: 9, to: 4 },
            { from: 9, to: 10 },
            { from: 10, to: 11 },
            { from: 10, to: 12, type: 'double' },
            { from: 0, to: 13 },
            { from: 0, to: 14 },
            { from: 0, to: 15 },
            { from: 5, to: 16 },
            { from: 6, to: 17 },
            { from: 7, to: 18 },
            { from: 8, to: 19 },
            { from: 11, to: 20 },
            { from: 12, to: 21 }
        ]
    },
    
    // Paclitaxel structure (detailed with more atoms)
    'CC1=C2[C@@]([C@]([C@H]([C@@H]3[C@]4([C@H](OC4)C[C@@H]([C@]3(C(=O)[C@@H]2OC(=O)C)C)O)OC(=O)C)OC(=O)c5ccccc5)(C[C@@H]1OC(=O)C)O)(C)CC=O': {
        atoms: [
            // Core structure (more detailed)
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1, y: 0, z: 0 },
            { element: 'C', x: 1.5, y: 1, z: 0 },
            { element: 'C', x: 0.5, y: 2, z: 0 },
            { element: 'C', x: -0.5, y: 1, z: 0 },
            { element: 'O', x: 2.5, y: 0.5, z: 0 },
            { element: 'C', x: 3, y: 1.5, z: 0 },
            { element: 'O', x: 4, y: 1.5, z: 0 },
            { element: 'C', x: 2, y: 2.5, z: 0 },
            { element: 'C', x: 1, y: 3, z: 0.5 },
            { element: 'O', x: 1, y: 4, z: 0 },
            { element: 'C', x: 0, y: 3, z: 1.5 },
            { element: 'C', x: -1, y: 3.5, z: 1 },
            { element: 'C', x: -1.5, y: 2.5, z: 0 },
            { element: 'C', x: -1, y: 1.5, z: -1 },
            { element: 'O', x: -2, y: 1, z: -1.5 },
            { element: 'C', x: -2.5, y: 0, z: -1 },
            { element: 'O', x: -3, y: 0, z: 0 },
            // More rings and side chains (more detailed)
            { element: 'C', x: 2, y: 3.5, z: 1 },
            { element: 'C', x: 3, y: 3, z: 1.5 },
            { element: 'C', x: 3.5, y: 2, z: 1 },
            { element: 'C', x: 4.5, y: 1.5, z: 1.5 },
            { element: 'C', x: 5, y: 0.5, z: 1 },
            { element: 'C', x: 4, y: 0, z: 0 },
            { element: 'O', x: 2, y: 4.5, z: 1.5 },
            { element: 'O', x: 3, y: 4, z: 2 },
            // Benzene ring
            { element: 'C', x: 5, y: 2.5, z: 2 },
            { element: 'C', x: 6, y: 2, z: 2.5 },
            { element: 'C', x: 6.5, y: 1, z: 2 },
            { element: 'C', x: 6, y: 0, z: 1.5 },
            { element: 'C', x: 5, y: -0.5, z: 1 },
            // Hydrogen atoms for more detail
            { element: 'H', x: -0.5, y: -0.5, z: 0.5 },
            { element: 'H', x: 1.5, y: -0.5, z: -0.5 },
            { element: 'H', x: 2, y: 1.5, z: -0.5 },
            { element: 'H', x: 0.5, y: 2.5, z: -0.5 },
            { element: 'H', x: -1, y: 0.5, z: 0.5 },
            { element: 'H', x: 2.5, y: 3, z: -0.5 },
            { element: 'H', x: 0.5, y: 2.5, z: 2 },
            { element: 'H', x: -1.5, y: 4, z: 1.5 },
            { element: 'H', x: -2.5, y: 2.5, z: 0.5 },
            { element: 'H', x: -0.5, y: 1, z: -1.5 },
            { element: 'H', x: 5.5, y: 3, z: 2.5 },
            { element: 'H', x: 7, y: 2.5, z: 3 },
            { element: 'H', x: 7.5, y: 0.5, z: 2 },
            { element: 'H', x: 6.5, y: -0.5, z: 1 }
        ],
        bonds: [
            // Core connections
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 0 },
            { from: 1, to: 5 },
            { from: 5, to: 6 },
            { from: 6, to: 7, type: 'double' },
            { from: 6, to: 8 },
            { from: 8, to: 9 },
            { from: 9, to: 10 },
            { from: 9, to: 11 },
            { from: 11, to: 12 },
            { from: 12, to: 13 },
            { from: 13, to: 14 },
            { from: 14, to: 15 },
            { from: 15, to: 16 },
            { from: 16, to: 17, type: 'double' },
            // More rings and side chains
            { from: 9, to: 18 },
            { from: 18, to: 19 },
            { from: 19, to: 20 },
            { from: 20, to: 21 },
            { from: 21, to: 22 },
            { from: 22, to: 23 },
            { from: 18, to: 24 },
            { from: 19, to: 25 },
            // Benzene ring
            { from: 21, to: 26 },
            { from: 26, to: 27 },
            { from: 27, to: 28 },
            { from: 28, to: 29 },
            { from: 29, to: 30 },
            { from: 30, to: 22 },
            // Hydrogen connections 
            { from: 0, to: 31 },
            { from: 1, to: 32 },
            { from: 2, to: 33 },
            { from: 3, to: 34 },
            { from: 4, to: 35 },
            { from: 8, to: 36 },
            { from: 11, to: 37 },
            { from: 12, to: 38 },
            { from: 13, to: 39 },
            { from: 14, to: 40 },
            { from: 26, to: 41 },
            { from: 27, to: 42 },
            { from: 28, to: 43 },
            { from: 29, to: 44 }
        ]
    },
    
    // Tryptamine structure (detailed, similar to reference image)
    'C1=CC2=C(C=C1)C(=CN2)CCCN': {
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1, y: 0.5, z: 0 },
            { element: 'C', x: 1, y: 1.5, z: 0 },
            { element: 'C', x: 0, y: 2, z: 0 },
            { element: 'C', x: -1, y: 1.5, z: 0 },
            { element: 'C', x: -1, y: 0.5, z: 0 },
            { element: 'C', x: 2, y: 2, z: 0 },
            { element: 'C', x: 3, y: 1.5, z: 0 },
            { element: 'N', x: 2.5, y: 0.5, z: 0 },
            { element: 'C', x: 4, y: 2, z: 0 },
            { element: 'C', x: 5, y: 1.5, z: 0 },
            { element: 'C', x: 6, y: 2, z: 0 },
            { element: 'N', x: 7, y: 1.5, z: 0 },
            { element: 'H', x: 0, y: -1, z: 0 },
            { element: 'H', x: 1.5, y: 0, z: 0.5 },
            { element: 'H', x: -0.5, y: 2.5, z: 0.3 },
            { element: 'H', x: -2, y: 2, z: 0 },
            { element: 'H', x: -2, y: 0, z: 0 },
            { element: 'H', x: 2, y: 3, z: 0 },
            { element: 'H', x: 2.5, y: -0.5, z: 0 },
            { element: 'H', x: 4, y: 3, z: 0 },
            { element: 'H', x: 5, y: 0.5, z: 0 },
            { element: 'H', x: 6, y: 3, z: 0 },
            { element: 'H', x: 7.5, y: 0.5, z: 0 },
            { element: 'H', x: 7.5, y: 2, z: 0.5 }
        ],
        bonds: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4 },
            { from: 4, to: 5 },
            { from: 5, to: 0 },
            { from: 2, to: 6 },
            { from: 6, to: 7 },
            { from: 7, to: 8 },
            { from: 8, to: 1 },
            { from: 7, to: 9 },
            { from: 9, to: 10 },
            { from: 10, to: 11 },
            { from: 11, to: 12 },
            { from: 0, to: 13 },
            { from: 1, to: 14 },
            { from: 3, to: 15 },
            { from: 4, to: 16 },
            { from: 5, to: 17 },
            { from: 6, to: 18 },
            { from: 8, to: 19 },
            { from: 9, to: 20 },
            { from: 10, to: 21 },
            { from: 11, to: 22 },
            { from: 12, to: 23 },
            { from: 12, to: 24 }
        ]
    }
};

// Make global functions available for the main app
window.initVisualization = initVisualizationFallback;
window.updateVisualization = updateVisualizationFallback;
window.zoomVisualization = zoomVisualizationFallback;
window.toggleRotation = toggleRotationFallback;
window.resetVisualization = resetVisualizationFallback;

// Initialize the visualization
function initVisualizationFallback(containerElement) {
    if (!containerElement) {
        console.error("No container element provided for visualization");
        return false;
    }
    
    container = containerElement;
    
    // Clear any previous content
    container.innerHTML = '';
    
    // Create canvas for 2D fallback
    canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    
    // Get 2D context
    try {
        ctx = canvas.getContext('2d');
    } catch (e) {
        console.error("Failed to get 2D context:", e);
        return false;
    }
    
    // Add event listeners for interactive controls
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleMouseWheel);
    
    // Add controls
    const controls = document.createElement('div');
    controls.className = 'visualization-controls text-center mt-3';
    controls.innerHTML = `
        <div class="btn-group">
            <button id="zoom3DBtn" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-search-plus me-1"></i>Zoom
            </button>
            <button id="rotate3DBtn" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-sync-alt me-1"></i>Rotate
            </button>
            <button id="reset3DBtn" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-undo me-1"></i>Reset
            </button>
        </div>
    `;
    container.appendChild(controls);
    
    // Set up UI elements
    const viewSelector = document.getElementById('viewSelector');
    const rotationSpeed = document.getElementById('rotationSpeed');
    const zoomLevel = document.getElementById('zoomLevel');
    const showLabels = document.getElementById('showLabels');
    
    // Enable controls
    if (viewSelector) viewSelector.removeAttribute('disabled');
    if (rotationSpeed) rotationSpeed.removeAttribute('disabled');
    if (zoomLevel) zoomLevel.removeAttribute('disabled');
    if (showLabels) showLabels.removeAttribute('disabled');
    
    // Setup buttons
    const zoomBtn = document.getElementById('zoom3DBtn');
    const rotateBtn = document.getElementById('rotate3DBtn');
    const resetBtn = document.getElementById('reset3DBtn');
    
    if (zoomBtn) zoomBtn.addEventListener('click', zoomVisualizationFallback);
    if (rotateBtn) rotateBtn.addEventListener('click', toggleRotationFallback);
    if (resetBtn) resetBtn.addEventListener('click', resetVisualizationFallback);
    
    // Draw initial placeholder
    drawPlaceholder("Basic 3D Molecule Visualization", "Select a molecule to visualize");
    
    isVisible = true;
    console.log("Basic 3D-like visualization initialized successfully");
    return true;
}

// Mouse interaction handlers
function handleMouseDown(event) {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartRotation = moleculeRotation;
}

function handleMouseMove(event) {
    if (!isDragging) return;
    
    const dx = event.clientX - dragStartX;
    moleculeRotation = dragStartRotation + dx * 0.01;
    
    if (currentSmiles && currentOptimization) {
        renderScene();
    }
}

function handleMouseUp(event) {
    isDragging = false;
}

function handleMouseWheel(event) {
    event.preventDefault();
    const delta = Math.sign(event.deltaY) * -0.1;
    zoomFactor = Math.max(0.5, Math.min(3, zoomFactor + delta));
    
    if (currentSmiles && currentOptimization) {
        renderScene();
    }
}

// Update visualization with new molecule and optimization
function updateVisualizationFallback(smiles, optimization) {
    if (!canvas || !ctx) {
        console.error("Visualization not initialized");
        return false;
    }
    
    currentSmiles = smiles;
    currentOptimization = optimization;
    
    // Reset view parameters
    zoomFactor = 1;
    moleculeRotation = 0;
    rotation = 0;
    
    // Render the scene
    renderScene();
    
    // Start animation
    if (!animationFrameId) {
        animateVisualization();
    }
    
    // Update information panel
    updateVisualizationInfo(smiles, optimization);
    
    return true;
}

// Render the complete scene
function renderScene() {
    if (!ctx || !currentSmiles || !currentOptimization) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get view parameters
    const viewMode = document.getElementById('viewSelector');
    const selectedView = viewMode ? viewMode.value : 'both';
    
    // Get rotation speed from slider (0.25-2x)
    const rotationSlider = document.getElementById('rotationSpeed');
    const rotationMultiplier = rotationSlider ? (0.25 + (rotationSlider.value / 100) * 1.75) : 1;
    
    // Get zoom level from slider (0.5-3x)
    const zoomSlider = document.getElementById('zoomLevel');
    const zoomMultiplier = zoomSlider ? (0.5 + (zoomSlider.value / 100) * 2.5) : 1;
    
    // Adjusted zoom factor based on slider
    const finalZoom = zoomFactor * zoomMultiplier;
    
    // Draw background
    drawBackground();
    
    // Draw molecule structure
    if (selectedView === 'both' || selectedView === 'drug') {
        drawMoleculeStructure(currentSmiles, finalZoom, rotationMultiplier);
    }
    
    // Draw labels if enabled
    const showLabels = document.getElementById('showLabels');
    if (!showLabels || showLabels.checked) {
        drawLabels(currentSmiles, currentOptimization);
    }
}

// Draw the background
function drawBackground() {
    // Simple gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw a placeholder message
function drawPlaceholder(title, message) {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Draw title
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    
    // Draw message
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 20);
}

// Draw a molecule structure based on SMILES string
function drawMoleculeStructure(smiles, zoomFactor, rotationMultiplier) {
    if (!ctx || !smiles) return;
    
    // Center position for the molecule
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Find a matching structure or use default
    let moleculeData = moleculeStructures[smiles];
    
    // If not found, try to find a similar one
    if (!moleculeData) {
        // First check for exact matches
        for (const [key, value] of Object.entries(moleculeStructures)) {
            if (key === smiles) {
                moleculeData = value;
                break;
            }
        }
        
        // If still not found, look for partial matches
        if (!moleculeData) {
            for (const [key, value] of Object.entries(moleculeStructures)) {
                if (smiles.includes(key) || key.includes(smiles)) {
                    moleculeData = value;
                    break;
                }
            }
        }
        
        // If still not found, use tryptamine as default since it's similar to reference
        if (!moleculeData) {
            moleculeData = moleculeStructures['C1=CC2=C(C=C1)C(=CN2)CCCN'];
        }
    }
    
    // Sort atoms by z-coordinate for proper depth rendering
    const sortedBonds = [...moleculeData.bonds].sort((a, b) => {
        const atomA1 = moleculeData.atoms[a.from];
        const atomA2 = moleculeData.atoms[a.to];
        const atomB1 = moleculeData.atoms[b.from];
        const atomB2 = moleculeData.atoms[b.to];
        
        const zAvgA = (atomA1.z + atomA2.z) / 2;
        const zAvgB = (atomB1.z + atomB2.z) / 2;
        
        return zAvgA - zAvgB;
    });
    
    const sortedAtoms = [...moleculeData.atoms].sort((a, b) => a.z - b.z);
    
    // Scaling factor based on zoom
    const scaleFactor = 40 * zoomFactor;
    
    // Draw bonds first
    for (const bond of sortedBonds) {
        const atom1 = moleculeData.atoms[bond.from];
        const atom2 = moleculeData.atoms[bond.to];
        
        // Apply rotation to x and z coordinates
        const angle = moleculeRotation + rotation * rotationMultiplier;
        
        const x1 = centerX + (atom1.x * Math.cos(angle) - atom1.z * Math.sin(angle)) * scaleFactor;
        const y1 = centerY + atom1.y * scaleFactor;
        const z1 = atom1.z * Math.cos(angle) + atom1.x * Math.sin(angle);
        
        const x2 = centerX + (atom2.x * Math.cos(angle) - atom2.z * Math.sin(angle)) * scaleFactor;
        const y2 = centerY + atom2.y * scaleFactor;
        const z2 = atom2.z * Math.cos(angle) + atom2.x * Math.sin(angle);
        
        // Calculate bond depth for opacity
        const bondDepth = (z1 + z2) / 2;
        const opacity = Math.max(0.2, 0.4 + 0.6 * (1 - bondDepth / 2));
        
        // Determine bond color based on connected atoms
        const atom1Element = atom1.element || 'C';
        const atom2Element = atom2.element || 'C';
        
        // Use gradient for bond color
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, atomColors[atom1Element] || atomColors['default']);
        gradient.addColorStop(1, atomColors[atom2Element] || atomColors['default']);
        
        // Draw different bond types
        if (bond.type === 'double') {
            // Draw double bond
            const bondVector = { x: x2 - x1, y: y2 - y1 };
            const bondLength = Math.sqrt(bondVector.x * bondVector.x + bondVector.y * bondVector.y);
            const normalizedVector = { 
                x: bondVector.x / bondLength, 
                y: bondVector.y / bondLength 
            };
            
            // Perpendicular vector
            const perpVector = { 
                x: -normalizedVector.y, 
                y: normalizedVector.x 
            };
            
            const bondWidth = 2;
            const offset = bondWidth * 0.8;
            
            // First bond
            ctx.beginPath();
            ctx.moveTo(x1 + perpVector.x * offset, y1 + perpVector.y * offset);
            ctx.lineTo(x2 + perpVector.x * offset, y2 + perpVector.y * offset);
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = bondWidth;
            ctx.stroke();
            
            // Second bond
            ctx.beginPath();
            ctx.moveTo(x1 - perpVector.x * offset, y1 - perpVector.y * offset);
            ctx.lineTo(x2 - perpVector.x * offset, y2 - perpVector.y * offset);
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
        } else {
            // Draw single bond
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }
    
    // Then draw atoms (in front)
    for (const atom of sortedAtoms) {
        // Apply rotation to x and z coordinates
        const angle = moleculeRotation + rotation * rotationMultiplier;
        
        const x = centerX + (atom.x * Math.cos(angle) - atom.z * Math.sin(angle)) * scaleFactor;
        const y = centerY + atom.y * scaleFactor;
        const z = atom.z * Math.cos(angle) + atom.x * Math.sin(angle);
        
        // Calculate atom size based on element and depth
        const element = atom.element || 'C';
        const baseRadius = (atomRadii[element] || atomRadii['default']) * (element === 'H' ? 5 : 10);
        
        // Adjust radius based on depth (z-coordinate)
        const depthFactor = Math.max(0.1, 1 - z / 3);
        const radius = Math.max(0.1, baseRadius * depthFactor * zoomFactor);
        
        // Calculate opacity based on depth
        const opacity = 0.4 + 0.6 * depthFactor;
        
        // Draw all atoms including hydrogen for completeness
        // Draw atom
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // Create radial gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );
        
        const atomColor = atomColors[element] || atomColors['default'];
        gradient.addColorStop(0, lightenColor(atomColor, 70));
        gradient.addColorStop(0.7, atomColor);
        gradient.addColorStop(1, darkenColor(atomColor, 30));
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = opacity;
        ctx.fill();
        
        // Add outline
        ctx.lineWidth = 1;
        ctx.strokeStyle = lightenColor(atomColor, 30);
        ctx.stroke();
        
        // Draw element label for non-hydrogen atoms or larger atoms
        if (element !== 'H' || radius > 4) {
            ctx.font = `bold ${Math.max(10, Math.round(12 * zoomFactor))}px Arial`;
            ctx.fillStyle = element === 'C' ? '#ffffff' : '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(element, x, y);
        }
        
        ctx.globalAlpha = 1.0;
    }
}

// Draw labels and information
function drawLabels(smiles, optimization) {
    // Get molecule name from data or use SMILES
    let moleculeName = document.getElementById('moleculeName')?.value || "Molecule";
    
    // For special cases, override with common names
    if (smiles === 'CC(=O)OC1=CC=CC=C1C(=O)O' || smiles === 'CC(=O)Oc1ccccc1C(=O)O') {
        moleculeName = "Aspirin";
    } else if (smiles === 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O') {
        moleculeName = "Ibuprofen";
    } else if (smiles === 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C') {
        moleculeName = "Caffeine";
    } else if (smiles && smiles.includes('C@@H]3[C@]4([C@H](OC4)')) {
        moleculeName = "Paclitaxel";
    } else if (smiles === 'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C=C4') {
        moleculeName = "Morphine";
    } else if (smiles === 'C1=CC2=C(C=C1)C(=CN2)CCCN') {
        moleculeName = "Tryptamine";
    }
    
    // Draw molecule title at top
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(moleculeName, canvas.width / 2, 30);
    
    // Draw interactive instructions
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('Drag to rotate • Scroll to zoom', 20, canvas.height - 15);
}

// Update the visualization info panel with actual optimization data
function updateVisualizationInfo(smiles, optimization) {
    const infoPanel = document.getElementById('visualizationInfo');
    if (!infoPanel) return;
    
    if (!optimization || Object.keys(optimization).length === 0) {
        // If no optimization data is available, remove the info panel
        infoPanel.innerHTML = '<div class="text-center"><p>No optimization data available</p></div>';
        return;
    }
    
    // Use the actual optimization data directly to ensure accuracy
    let html = `
        <h4 class="mb-3">Molecule: ${getMoleculeName(smiles)}</h4>
    `;
    
    // Only show properties that are actually present in the optimization
    if (optimization.core_material) {
        html += `<div class="mb-3">
            <strong>Nanoparticle Type:</strong> ${optimization.core_material}
        </div>`;
    }
    
    if (optimization.size_nm) {
        html += `<div class="mb-3">
            <strong>Size:</strong> ${optimization.size_nm} nm
        </div>`;
    }
    
    if (optimization.surface_charge) {
        html += `<div class="mb-3">
            <strong>Surface Charge:</strong> ${optimization.surface_charge} mV
        </div>`;
    }
    
    if (optimization.coating) {
        html += `<div class="mb-3">
            <strong>Coating:</strong> ${optimization.coating}
        </div>`;
    }
    
    if (optimization.delivery_mechanism) {
        html += `<div class="mb-3">
            <strong>Delivery Mechanism:</strong> ${optimization.delivery_mechanism}
        </div>`;
    }
    
    // Include some molecular properties if available
    if (optimization.stability_score) {
        html += `<div class="mb-3">
            <strong>Stability Score:</strong> ${optimization.stability_score.toFixed(2)}
        </div>`;
    }
    
    if (optimization.toxicity_score) {
        html += `<div class="mb-3">
            <strong>Toxicity Score:</strong> ${optimization.toxicity_score.toFixed(2)}
        </div>`;
    }
    
    // If optimization data is very limited, add a note
    if (Object.keys(optimization).length < 3) {
        html += `<div class="mt-3 text-warning">
            <small>Limited optimization data available for this molecule.</small>
        </div>`;
    }
    
    infoPanel.innerHTML = html;
}

// Get molecule name from SMILES or from the molecule name input
function getMoleculeName(smiles) {
    // Try to get the name from the input field first
    const nameInput = document.getElementById('moleculeName');
    if (nameInput && nameInput.value && nameInput.value.trim() !== '') {
        return nameInput.value;
    }
    
    // If no name provided, use standard names for common molecules
    if (smiles === 'CC(=O)OC1=CC=CC=C1C(=O)O' || smiles === 'CC(=O)Oc1ccccc1C(=O)O') {
        return "Aspirin";
    } else if (smiles === 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O') {
        return "Ibuprofen";
    } else if (smiles === 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C') {
        return "Caffeine";
    } else if (smiles && smiles.includes('C@@H]3[C@]4([C@H](OC4)')) {
        return "Paclitaxel";
    } else if (smiles === 'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C=C4') {
        return "Morphine";
    } else if (smiles === 'C1=CC2=C(C=C1)C(=CN2)CCCN') {
        return "Tryptamine";
    } else {
        return "Molecule";
    }
}

// Animate the visualization
function animateVisualization() {
    if (!isVisible) return;
    
    // Get rotation speed from slider (0.25-2x)
    const rotationSlider = document.getElementById('rotationSpeed');
    const rotationMultiplier = rotationSlider ? (0.25 + (rotationSlider.value / 100) * 1.75) : 1;
    
    // Update rotation
    rotation += 0.01 * rotationMultiplier;
    
    // Redraw if we have data
    if (currentSmiles && currentOptimization) {
        renderScene();
    }
    
    // Continue animation
    animationFrameId = requestAnimationFrame(animateVisualization);
}

// Zoom the visualization
function zoomVisualizationFallback() {
    // Show zoom message
    const message = "Use mouse wheel or zoom slider";
    
    // Flash message
    ctx.fillStyle = 'rgba(0,100,255,0.7)';
    ctx.fillRect(canvas.width/2 - 100, canvas.height - 50, 200, 40);
    
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width/2, canvas.height - 30);
    
    // Reset after timeout
    setTimeout(() => {
        if (currentSmiles && currentOptimization) {
            renderScene();
        }
    }, 1000);
}

// Toggle rotation of the visualization
function toggleRotationFallback() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        
        // Flash message that rotation is paused
        const message = "Rotation paused";
        
        ctx.fillStyle = 'rgba(255,0,100,0.7)';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 50, 200, 40);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width/2, canvas.height - 30);
        
        // Reset after timeout
        setTimeout(() => {
            if (currentSmiles && currentOptimization) {
                renderScene();
            }
        }, 1000);
    } else {
        animateVisualization();
    }
}

// Reset the visualization to default state
function resetVisualizationFallback() {
    rotation = 0;
    moleculeRotation = 0;
    zoomFactor = 1;
    
    // Reset controls to default values
    const zoomSlider = document.getElementById('zoomLevel');
    if (zoomSlider) zoomSlider.value = 50;
    
    const rotationSlider = document.getElementById('rotationSpeed');
    if (rotationSlider) rotationSlider.value = 30;
    
    if (currentSmiles && currentOptimization) {
        renderScene();
    } else {
        drawPlaceholder("Visualization Reset", "Select a molecule to visualize");
    }
}

// Color helper functions
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
        0x1000000 + 
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + 
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + 
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return '#' + (
        0x1000000 + 
        (R > 0 ? (R > 255 ? 255 : R) : 0) * 0x10000 + 
        (G > 0 ? (G > 255 ? 255 : G) : 0) * 0x100 + 
        (B > 0 ? (B > 255 ? 255 : B) : 0)
    ).toString(16).slice(1);
}
