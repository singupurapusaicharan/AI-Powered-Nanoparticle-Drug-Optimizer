/**
 * 3d_visualization.js
 * Handles the 3D visualization of molecules and nanoparticles using Three.js
 */

// Global variables for Three.js
let scene, camera, renderer, controls;
let moleculeGroup, nanoparticleGroup, interactionGroup;
let animationId = null;
let isInitialized = false;
let rotationSpeed = 0.003;
let devicePixelRatio = 1;
let isLowPerformanceMode = false;

// Object pools to reduce garbage collection
const geometryPool = {};
const materialPool = {};
const texturePool = {};

// Performance monitoring
let lastFrameTime = 0;
let frameCount = 0;
let fps = 60;

document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for visualization controls
    setupVisualizationControls();
    
    // Check device capabilities
    checkDeviceCapabilities();
});

/**
 * Check device capabilities and adjust settings accordingly
 */
function checkDeviceCapabilities() {
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check for WebGL support quality
    const canvas = document.createElement('canvas');
    let gl;
    
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
        console.warn('WebGL not supported, using low performance mode');
        isLowPerformanceMode = true;
        return;
    }
    
    if (!gl) {
        console.warn('WebGL not supported, using low performance mode');
        isLowPerformanceMode = true;
        return;
    }
    
    // Check extension support
    const extensions = gl.getSupportedExtensions();
    const hasGoodExtensions = extensions && (
        extensions.includes('WEBGL_compressed_texture_s3tc') || 
        extensions.includes('WEBGL_compressed_texture_etc')
    );
    
    // Set pixel ratio based on device
    if (isMobile || !hasGoodExtensions) {
        devicePixelRatio = Math.min(1.5, window.devicePixelRatio);
        console.log(`Using reduced pixel ratio: ${devicePixelRatio}`);
    } else {
        devicePixelRatio = window.devicePixelRatio;
    }
    
    // Enable low performance mode for mobile
    if (isMobile) {
        isLowPerformanceMode = true;
        console.log('Mobile device detected, enabling low performance mode');
    }
}

/**
 * Initialize the Three.js visualization for a molecule and nanoparticle
 * @param {Object} data - Visualization data from the API
 */
function initThreeJsVisualization(data) {
    console.log("Initializing 3D visualization");
    
    const container = document.getElementById('visualizationContainer');
    
    // Clear existing content
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Cancel any ongoing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    try {
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            showVisualizationError("Three.js library not loaded", container);
            return;
        }
        
        // Initialize scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
        scene.add(ambientLight);
        
        // Add directional light
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(1, 1, 1);
        scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0x0088ff, 0.3);
        directionalLight2.position.set(-1, -1, -1);
        scene.add(directionalLight2);
        
        // Initialize camera
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 15;
        
        // Initialize renderer with optimized settings
        renderer = new THREE.WebGLRenderer({ 
            antialias: !isLowPerformanceMode,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(devicePixelRatio);
        
        // Set renderer optimization flags
        renderer.shadowMap.enabled = !isLowPerformanceMode;
        renderer.shadowMap.type = isLowPerformanceMode ? 
            THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
        
        // Set color space and tone mapping
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        
        // Add controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.rotateSpeed = 0.5;
        controls.enablePan = false;
        controls.minDistance = 5;
        controls.maxDistance = 30;
        
        // Add renderer to container
        container.appendChild(renderer.domElement);
        
        // Create groups for organization
        moleculeGroup = new THREE.Group();
        nanoparticleGroup = new THREE.Group();
        interactionGroup = new THREE.Group();
        
        scene.add(moleculeGroup);
        scene.add(nanoparticleGroup);
        scene.add(interactionGroup);
        
        // Create visualization based on data
        createVisualization(data);
        
        // Set up window resize handler
        window.addEventListener('resize', onWindowResize);
        
        // Set initialization flag
        isInitialized = true;
        
        // Start animation loop
        animate();
        
        // Enable controls
        enableVisualizationControls();
        
    } catch (error) {
        console.error("Error initializing Three.js visualization:", error);
        showVisualizationError("Failed to initialize 3D visualization: " + error.message, container);
    }
}

/**
 * Create visualization based on data
 * @param {Object} data - Visualization data from the API
 */
function createVisualization(data) {
    try {
        if (!data || !data.visualization) {
            throw new Error("Invalid visualization data");
        }
        
        const visualization = data.visualization;
        
        // Clear existing objects
        while (moleculeGroup.children.length > 0) {
            const object = moleculeGroup.children[0];
            disposeObject(object);
            moleculeGroup.remove(object);
        }
        
        while (nanoparticleGroup.children.length > 0) {
            const object = nanoparticleGroup.children[0];
            disposeObject(object);
            nanoparticleGroup.remove(object);
        }
        
        while (interactionGroup.children.length > 0) {
            const object = interactionGroup.children[0];
            disposeObject(object);
            interactionGroup.remove(object);
        }
        
        // Create molecule visualization
        if (visualization.molecule) {
            createMoleculeVisualization(visualization.molecule);
        } else {
            console.warn("No molecule data for visualization");
        }
        
        // Create nanoparticle visualization
        if (visualization.nanoparticle) {
            createNanoparticleVisualization(visualization.nanoparticle);
        } else {
            console.warn("No nanoparticle data for visualization");
        }
        
        // Create interaction visualizations
        if (visualization.interaction_points && visualization.interaction_points.length > 0) {
            createInteractionVisualizations(visualization.interaction_points);
        }
        
        // Center camera on the combined visualization
        const combinedBox = new THREE.Box3();
        combinedBox.expandByObject(moleculeGroup);
        combinedBox.expandByObject(nanoparticleGroup);
        
        const center = new THREE.Vector3();
        combinedBox.getCenter(center);
        
        // Adjust groups to center
        moleculeGroup.position.sub(center);
        nanoparticleGroup.position.sub(center);
        interactionGroup.position.sub(center);
        
        // Position molecule and nanoparticle relative to each other
        const distance = 8; // Distance between molecule and nanoparticle
        moleculeGroup.position.x = -distance / 2;
        nanoparticleGroup.position.x = distance / 2;
        
    } catch (error) {
        console.error("Error creating visualization:", error);
        showVisualizationError("Failed to create visualization: " + error.message, document.getElementById('visualizationContainer'));
    }
}

/**
 * Dispose of a Three.js object and its resources
 * @param {THREE.Object3D} object - The object to dispose
 */
function disposeObject(object) {
    // Recursively dispose of geometries and materials
    if (object.children && object.children.length > 0) {
        const children = [...object.children];
        for (const child of children) {
            disposeObject(child);
        }
    }
    
    // Dispose of geometry
    if (object.geometry) {
        object.geometry.dispose();
    }
    
    // Dispose of material
    if (object.material) {
        if (Array.isArray(object.material)) {
            for (const material of object.material) {
                disposeMaterial(material);
            }
        } else {
            disposeMaterial(object.material);
        }
    }
}

/**
 * Dispose of a material's resources
 * @param {THREE.Material} material - The material to dispose
 */
function disposeMaterial(material) {
    if (!material) return;
    
    // Dispose textures
    for (const key in material) {
        if (material[key] && material[key].isTexture) {
            material[key].dispose();
        }
    }
    
    // Dispose material
    material.dispose();
}

/**
 * Get or create a geometry from the pool
 * @param {string} key - Geometry key
 * @param {function} createFunc - Function to create the geometry if not in pool
 * @returns {THREE.BufferGeometry} The geometry
 */
function getFromGeometryPool(key, createFunc) {
    if (!geometryPool[key]) {
        geometryPool[key] = createFunc();
    }
    return geometryPool[key].clone();
}

/**
 * Get or create a material from the pool
 * @param {string} key - Material key
 * @param {function} createFunc - Function to create the material if not in pool
 * @returns {THREE.Material} The material
 */
function getFromMaterialPool(key, createFunc) {
    if (!materialPool[key]) {
        materialPool[key] = createFunc();
    }
    return materialPool[key].clone();
}

/**
 * Create a visualization for a molecule
 * @param {Object} moleculeData - Molecule visualization data
 */
function createMoleculeVisualization(moleculeData) {
    const atoms = moleculeData.atoms || [];
    const bonds = moleculeData.bonds || [];
    
    // Material pools for common atom types
    const atomMaterials = {
        'C': getFromMaterialPool('atom_C', () => new THREE.MeshPhongMaterial({ color: 0x808080 })),
        'H': getFromMaterialPool('atom_H', () => new THREE.MeshPhongMaterial({ color: 0xffffff })),
        'O': getFromMaterialPool('atom_O', () => new THREE.MeshPhongMaterial({ color: 0xff0000 })),
        'N': getFromMaterialPool('atom_N', () => new THREE.MeshPhongMaterial({ color: 0x0000ff })),
        'S': getFromMaterialPool('atom_S', () => new THREE.MeshPhongMaterial({ color: 0xffff00 })),
        'P': getFromMaterialPool('atom_P', () => new THREE.MeshPhongMaterial({ color: 0xff8000 })),
        'F': getFromMaterialPool('atom_F', () => new THREE.MeshPhongMaterial({ color: 0x00ff00 })),
        'Cl': getFromMaterialPool('atom_Cl', () => new THREE.MeshPhongMaterial({ color: 0x00ff00 })),
        'Br': getFromMaterialPool('atom_Br', () => new THREE.MeshPhongMaterial({ color: 0x882200 })),
        'I': getFromMaterialPool('atom_I', () => new THREE.MeshPhongMaterial({ color: 0x6600bb }))
    };
    
    // Default material for other atom types
    const defaultMaterial = getFromMaterialPool('atom_default', () => 
        new THREE.MeshPhongMaterial({ color: 0xdddddd }));
    
    // Geometry quality based on performance mode
    const atomSegments = isLowPerformanceMode ? 8 : 16;
    
    // Create atoms
    atoms.forEach(atom => {
        if (!atom || !atom.position) return;
        
        try {
            // Get radius for atom
            const radius = atom.radius || 0.5;
            
            // Create sphere for atom
            const geometry = getFromGeometryPool(`sphere_${radius.toFixed(2)}`, () => 
                new THREE.SphereGeometry(radius, atomSegments, atomSegments));
            
            // Select material based on atom type
            const material = atom.element && atomMaterials[atom.element] ? 
                atomMaterials[atom.element] : defaultMaterial;
            
            // Create mesh
            const sphere = new THREE.Mesh(geometry, material);
            
            // Set position
            sphere.position.set(
                atom.position.x || 0,
                atom.position.y || 0,
                atom.position.z || 0
            );
            
            // Add to molecule group
            moleculeGroup.add(sphere);
            
            // Optional label
            if (atom.element && !isLowPerformanceMode) {
                addLabel(atom.position, atom.element, moleculeGroup);
            }
        } catch (error) {
            console.error("Error creating atom:", error);
        }
    });
    
    // Bond material
    const bondMaterial = getFromMaterialPool('bond', () => 
        new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    
    // Create bonds
    bonds.forEach(bond => {
        if (!bond || !bond.start || !bond.end) return;
        
        try {
            // Get positions
            const start = new THREE.Vector3(
                bond.start.x || 0,
                bond.start.y || 0,
                bond.start.z || 0
            );
            
            const end = new THREE.Vector3(
                bond.end.x || 0,
                bond.end.y || 0,
                bond.end.z || 0
            );
            
            // Create bond cylinder
            createBond(start, end, bondMaterial, moleculeGroup);
        } catch (error) {
            console.error("Error creating bond:", error);
        }
    });
}

/**
 * Create a bond between two positions
 * @param {THREE.Vector3} start - Start position
 * @param {THREE.Vector3} end - End position
 * @param {THREE.Material} material - Material for the bond
 * @param {THREE.Group} group - Group to add the bond to
 */
function createBond(start, end, material, group) {
    // Calculate bond properties
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    // Skip very short bonds
    if (length < 0.1) return;
    
    // Bond geometry
    const bondRadius = 0.1;
    const cylinderSegments = isLowPerformanceMode ? 6 : 8;
    
    // Get geometry from pool
    const geometry = getFromGeometryPool(`cylinder_${bondRadius.toFixed(2)}_${cylinderSegments}`, () => 
        new THREE.CylinderGeometry(bondRadius, bondRadius, 1, cylinderSegments));
    
    // Create mesh
    const cylinder = new THREE.Mesh(geometry, material);
    
    // Position and rotate cylinder
    cylinder.position.copy(start);
    cylinder.position.add(direction.multiplyScalar(0.5));
    
    // Set height to bond length
    cylinder.scale.y = length;
    
    // Rotate to align with direction
    cylinder.lookAt(end);
    cylinder.rotateX(Math.PI / 2);
    
    // Add to group
    group.add(cylinder);
}

/**
 * Create a visualization for a nanoparticle
 * @param {Object} data - Nanoparticle visualization data
 */
function createNanoparticleVisualization(data) {
    // Get nanoparticle properties
    const size = data.size_nm || 10;
    const type = data.type || 'sphere';
    const coating = data.coating || 'polymer';
    
    // Different shapes based on type
    switch (type.toLowerCase()) {
        case 'sphere':
            createSphericalNanoparticle(size, data);
            break;
        case 'rod':
            createRodNanoparticle(size, data);
            break;
        case 'cube':
            createCubicNanoparticle(size, data);
            break;
        default:
            createSphericalNanoparticle(size, data);
    }
    
    // Add coating visualization
    if (coating && !isLowPerformanceMode) {
        addNanoparticleCoating(data);
    }
}

/**
 * Create a spherical nanoparticle
 * @param {number} size - Size in nm
 * @param {Object} data - Nanoparticle data
 */
function createSphericalNanoparticle(size, data) {
    // Calculate radius (in Three.js units)
    const radius = size / 20;
    
    // Surface charge affects color
    const charge = data.surface_charge || 0;
    let color;
    
    if (charge < -15) {
        color = 0x0055ff; // Negative - blue
    } else if (charge > 15) {
        color = 0xff5500; // Positive - red
    } else {
        color = 0x00aa55; // Neutral - green
    }
    
    // Create materials - inner core and outer shell
    const coreMaterial = getFromMaterialPool(`core_${color.toString(16)}`, () => 
        new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            shininess: 80
        }));
    
    const shellMaterial = getFromMaterialPool(`shell_${color.toString(16)}`, () => 
        new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            shininess: 100,
            wireframe: isLowPerformanceMode
        }));
    
    // Geometry quality based on performance mode
    const segments = isLowPerformanceMode ? 16 : 32;
    
    // Core sphere
    const coreGeometry = getFromGeometryPool(`sphere_${radius.toFixed(2)}_${segments}`, () => 
        new THREE.SphereGeometry(radius, segments, segments));
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    nanoparticleGroup.add(core);
    
    // Outer shell (slightly larger)
    const shellRadius = radius * 1.2;
    const shellGeometry = getFromGeometryPool(`sphere_${shellRadius.toFixed(2)}_${segments}`, () => 
        new THREE.SphereGeometry(shellRadius, segments, segments));
    
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    nanoparticleGroup.add(shell);
    
    // Add glow effect if not in low performance mode
    if (!isLowPerformanceMode) {
        // Glow sprite
        const spriteMaterial = getFromMaterialPool(`glow_${color.toString(16)}`, () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            
            // Draw radial gradient
            const gradient = context.createRadialGradient(
                128, 128, 0,
                128, 128, 128
            );
            
            const hexColor = '#' + color.toString(16).padStart(6, '0');
            gradient.addColorStop(0, hexColor);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, 256, 256);
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            return new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(shellRadius * 5, shellRadius * 5, 1);
        nanoparticleGroup.add(sprite);
    }
    
    // Add a label
    const label = data.coating || 'Nanoparticle';
    addLabel(new THREE.Vector3(0, -radius * 1.5, 0), label, nanoparticleGroup);
}

/**
 * Create a rod-shaped nanoparticle
 * @param {number} size - Size in nm
 * @param {Object} data - Nanoparticle data
 */
function createRodNanoparticle(size, data) {
    // Rod dimensions
    const radius = size / 30;
    const length = size / 10;
    
    // Surface charge affects color
    const charge = data.surface_charge || 0;
    let color;
    
    if (charge < -15) {
        color = 0x0055ff; // Negative - blue
    } else if (charge > 15) {
        color = 0xff5500; // Positive - red
    } else {
        color = 0x00aa55; // Neutral - green
    }
    
    // Create materials
    const material = getFromMaterialPool(`rod_${color.toString(16)}`, () => 
        new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            shininess: 80
        }));
    
    // Create rod
    const segments = isLowPerformanceMode ? 8 : 16;
    const geometry = getFromGeometryPool(`cylinder_${radius.toFixed(2)}_${length.toFixed(2)}_${segments}`, () => 
        new THREE.CylinderGeometry(radius, radius, length, segments, 1, false));
    
    const rod = new THREE.Mesh(geometry, material);
    rod.rotation.x = Math.PI / 2;
    nanoparticleGroup.add(rod);
    
    // Add end caps (hemispheres)
    const capGeometry = getFromGeometryPool(`sphere_${radius.toFixed(2)}_${segments}`, () => 
        new THREE.SphereGeometry(radius, segments, segments));
    
    const topCap = new THREE.Mesh(capGeometry, material);
    topCap.position.set(0, length/2, 0);
    nanoparticleGroup.add(topCap);
    
    const bottomCap = new THREE.Mesh(capGeometry, material);
    bottomCap.position.set(0, -length/2, 0);
    nanoparticleGroup.add(bottomCap);
    
    // Add a label
    const label = data.coating || 'Nanorod';
    addLabel(new THREE.Vector3(0, -length, 0), label, nanoparticleGroup);
}

/**
 * Create a cubic nanoparticle
 * @param {number} size - Size in nm
 * @param {Object} data - Nanoparticle data
 */
function createCubicNanoparticle(size, data) {
    // Cube dimensions
    const sideLength = size / 15;
    
    // Surface charge affects color
    const charge = data.surface_charge || 0;
    let color;
    
    if (charge < -15) {
        color = 0x0055ff; // Negative - blue
    } else if (charge > 15) {
        color = 0xff5500; // Positive - red
    } else {
        color = 0x00aa55; // Neutral - green
    }
    
    // Create materials
    const material = getFromMaterialPool(`cube_${color.toString(16)}`, () => 
        new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            shininess: 80
        }));
    
    // Create cube
    const geometry = getFromGeometryPool(`box_${sideLength.toFixed(2)}`, () => 
        new THREE.BoxGeometry(sideLength, sideLength, sideLength));
    
    const cube = new THREE.Mesh(geometry, material);
    nanoparticleGroup.add(cube);
    
    // Add edges for better visibility
    if (!isLowPerformanceMode) {
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = getFromMaterialPool('edges', () => 
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
        
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        nanoparticleGroup.add(edges);
    }
    
    // Add a label
    const label = data.coating || 'Nanocube';
    addLabel(new THREE.Vector3(0, -sideLength, 0), label, nanoparticleGroup);
}

/**
 * Add coating visualization to nanoparticle
 * @param {Object} data - Nanoparticle data
 */
function addNanoparticleCoating(data) {
    // Skip in low performance mode
    if (isLowPerformanceMode) return;
    
    const coating = data.coating || 'polymer';
    const size = data.size_nm || 10;
    const radius = size / 20;
    
    // Number of coating particles based on size
    const numParticles = Math.floor(size * 2);
    
    // Different colors based on coating type
    let color;
    switch (coating.toLowerCase()) {
        case 'peg':
            color = 0x88aaff;
            break;
        case 'lipid':
            color = 0xffaa33;
            break;
        case 'polymer':
            color = 0xaa88cc;
            break;
        case 'protein':
            color = 0x33ccaa;
            break;
        default:
            color = 0xaaaaaa;
    }
    
    // Create material for coating particles
    const material = getFromMaterialPool(`coating_${color.toString(16)}`, () => 
        new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.7
        }));
    
    // Small sphere geometry for coating particles
    const particleRadius = radius * 0.15;
    const geometry = getFromGeometryPool(`sphere_${particleRadius.toFixed(3)}`, () => 
        new THREE.SphereGeometry(particleRadius, 8, 8));
    
    // Group for coating
    const coatingGroup = new THREE.Group();
    
    // Create coating particles distributed on a sphere
    for (let i = 0; i < numParticles; i++) {
        // Random position on a sphere
        const phi = Math.acos(-1 + (2 * i) / numParticles);
        const theta = Math.sqrt(numParticles * Math.PI) * phi;
        
        // Convert to Cartesian coordinates with slight randomness
        const x = (radius * 1.3) * Math.sin(phi) * Math.cos(theta) * (0.9 + Math.random() * 0.2);
        const y = (radius * 1.3) * Math.sin(phi) * Math.sin(theta) * (0.9 + Math.random() * 0.2);
        const z = (radius * 1.3) * Math.cos(phi) * (0.9 + Math.random() * 0.2);
        
        // Create particle
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x, y, z);
        
        // Add to coating group
        coatingGroup.add(particle);
    }
    
    // Add coating group to nanoparticle
    nanoparticleGroup.add(coatingGroup);
}

/**
 * Create visualizations for interaction points
 * @param {Array} interactions - Interaction data
 */
function createInteractionVisualizations(interactions) {
    if (!interactions || interactions.length === 0) return;
    
    // Material for interaction points
    const material = getFromMaterialPool('interaction', () => 
        new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7,
            emissive: 0xff00ff,
            emissiveIntensity: 0.3
        }));
    
    // Line material for connections
    const lineMaterial = getFromMaterialPool('interaction_line', () => 
        new THREE.LineBasicMaterial({
            color: 0xff88ff,
            transparent: true,
            opacity: 0.5,
            linewidth: 1
        }));
    
    // Geometry for interaction points
    const radius = 0.2;
    const geometry = getFromGeometryPool(`sphere_${radius.toFixed(2)}`, () => 
        new THREE.SphereGeometry(radius, 8, 8));
    
    // Create visualization for each interaction point
    interactions.forEach(interaction => {
        if (!interaction || !interaction.position || !interaction.target_position) return;
        
        try {
            // Create interaction point
            const point = new THREE.Mesh(geometry, material);
            
            // Set position
            point.position.set(
                interaction.position.x || 0,
                interaction.position.y || 0,
                interaction.position.z || 0
            );
            
            // Add to interaction group
            interactionGroup.add(point);
            
            // Create connection line
            const points = [
                new THREE.Vector3(
                    interaction.position.x || 0,
                    interaction.position.y || 0,
                    interaction.position.z || 0
                ),
                new THREE.Vector3(
                    interaction.target_position.x || 0,
                    interaction.target_position.y || 0,
                    interaction.target_position.z || 0
                )
            ];
            
            // Create line geometry
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, lineMaterial);
            
            // Add to interaction group
            interactionGroup.add(line);
            
            // Add label if type is specified and not in low performance mode
            if (interaction.type && !isLowPerformanceMode) {
                const midpoint = new THREE.Vector3().addVectors(
                    points[0], points[1]
                ).multiplyScalar(0.5);
                
                addLabel(midpoint, interaction.type, interactionGroup);
            }
            
            // Add pulsing effect if not in low performance mode
            if (!isLowPerformanceMode) {
                // Create a slightly larger transparent sphere that will pulse
                const pulseGeometry = getFromGeometryPool(`sphere_${(radius * 1.5).toFixed(2)}`, () => 
                    new THREE.SphereGeometry(radius * 1.5, 8, 8));
                
                const pulseMaterial = getFromMaterialPool('pulse', () => 
                    new THREE.MeshBasicMaterial({
                        color: 0xff00ff,
                        transparent: true,
                        opacity: 0.3,
                        wireframe: true
                    }));
                
                const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
                pulse.position.copy(point.position);
                
                // Store initial scale for animation
                pulse.userData.initialScale = new THREE.Vector3(1, 1, 1);
                pulse.userData.pulsePhase = Math.random() * Math.PI * 2; // Random phase
                
                interactionGroup.add(pulse);
            }
        } catch (error) {
            console.error("Error creating interaction point:", error);
        }
    });
}

/**
 * Add a text label at a position
 * @param {THREE.Vector3} position - Position for label
 * @param {string} text - Label text
 * @param {THREE.Group} group - Group to add label to
 */
function addLabel(position, text, group) {
    // Skip labels in low performance mode
    if (isLowPerformanceMode) return;
    
    try {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 256;
        canvas.height = 64;
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set text styles
        context.font = 'Bold 20px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(material);
        
        // Scale sprite
        sprite.scale.set(2, 0.5, 1);
        
        // Position sprite
        sprite.position.copy(position);
        sprite.position.y += 0.5; // Offset slightly
        
        // Add to group
        group.add(sprite);
        
        // Store reference to show/hide
        if (!group.userData.labels) {
            group.userData.labels = [];
        }
        group.userData.labels.push(sprite);
    } catch (error) {
        console.error("Error creating label:", error);
    }
}

/**
 * Create a fallback visualization when no data is available
 */
function createFallbackVisualization() {
    console.log("Creating fallback visualization");
    
    // Clear existing groups
    while (moleculeGroup.children.length > 0) {
        moleculeGroup.remove(moleculeGroup.children[0]);
    }
    
    while (nanoparticleGroup.children.length > 0) {
        nanoparticleGroup.remove(nanoparticleGroup.children[0]);
    }
    
    while (interactionGroup.children.length > 0) {
        interactionGroup.remove(interactionGroup.children[0]);
    }
    
    // Create a simple molecule (methane-like structure)
    const atomMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const hydrogenMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const bondMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    
    // Carbon atom
    const carbonGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const carbon = new THREE.Mesh(carbonGeometry, atomMaterial);
    moleculeGroup.add(carbon);
    
    // Hydrogen atoms and bonds
    const hydrogenGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    
    // Create 4 hydrogen atoms in tetrahedral arrangement
    const tetrahedralAngles = [
        { theta: 0, phi: 0 },
        { theta: 2 * Math.PI / 3, phi: Math.PI - Math.acos(-1/3) },
        { theta: 4 * Math.PI / 3, phi: Math.PI - Math.acos(-1/3) },
        { theta: 0, phi: Math.acos(-1/3) }
    ];
    
    tetrahedralAngles.forEach(angle => {
        // Convert spherical to Cartesian coordinates
        const x = Math.sin(angle.phi) * Math.cos(angle.theta);
        const y = Math.sin(angle.phi) * Math.sin(angle.theta);
        const z = Math.cos(angle.phi);
        
        // Create hydrogen
        const hydrogen = new THREE.Mesh(hydrogenGeometry, hydrogenMaterial);
        hydrogen.position.set(x, y, z);
        moleculeGroup.add(hydrogen);
        
        // Create bond
        const bond = new THREE.Mesh(bondGeometry, bondMaterial);
        
        // Position bond between atoms
        bond.position.set(x/2, y/2, z/2);
        
        // Rotate bond to point at hydrogen
        bond.lookAt(hydrogen.position);
        bond.rotateX(Math.PI / 2);
        
        // Scale bond length
        bond.scale.y = hydrogen.position.length();
        
        moleculeGroup.add(bond);
    });
    
    // Simple nanoparticle (sphere)
    const nanoGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const nanoMaterial = new THREE.MeshPhongMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.7,
        shininess: 100
    });
    
    const nanoparticle = new THREE.Mesh(nanoGeometry, nanoMaterial);
    nanoparticleGroup.add(nanoparticle);
    
    // Add wireframe for visual effect
    const wireGeometry = new THREE.SphereGeometry(1.7, 16, 16);
    const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    nanoparticleGroup.add(wireframe);
    
    // Position groups
    moleculeGroup.position.x = -3;
    nanoparticleGroup.position.x = 3;
}

/**
 * Handle window resize
 */
function onWindowResize() {
    if (!camera || !renderer) return;
    
    const container = document.getElementById('visualizationContainer');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
}

/**
 * Animation loop
 */
function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Track FPS
    const now = performance.now();
    frameCount++;
    
    if (now - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
        
        // Adjust quality if necessary
        if (fps < 20 && !isLowPerformanceMode) {
            console.log(`Low FPS detected (${fps}), enabling low performance mode`);
            isLowPerformanceMode = true;
            
            // Reduce pixel ratio
            if (renderer) {
                renderer.setPixelRatio(Math.min(1, window.devicePixelRatio));
            }
        }
    }
    
    // Check if rotation is enabled
    if (moleculeGroup && nanoparticleGroup) {
        // Rotate molecule and nanoparticle groups
        moleculeGroup.rotation.y += rotationSpeed;
        nanoparticleGroup.rotation.y += rotationSpeed;
    }
    
    // Update orbit controls
    if (controls) {
        controls.update();
    }
    
    // Update pulsing effects
    if (interactionGroup && !isLowPerformanceMode) {
        interactionGroup.children.forEach(child => {
            if (child.userData && child.userData.initialScale) {
                // Calculate scale based on time
                const phase = child.userData.pulsePhase || 0;
                const scale = 1 + 0.3 * Math.sin(Date.now() * 0.003 + phase);
                
                // Apply scale
                child.scale.set(scale, scale, scale);
            }
        });
    }
    
    // Render scene
    if (scene && camera && renderer) {
        renderer.render(scene, camera);
    }
}

/**
 * Set up visualization controls based on UI elements
 */
function setupVisualizationControls() {
    // View selector
    const viewSelector = document.getElementById('viewSelector');
    if (viewSelector) {
        viewSelector.addEventListener('change', function() {
            updateVisibilityBasedOnView(this.value);
        });
    }
    
    // Rotation speed
    const rotationSpeed = document.getElementById('rotationSpeed');
    if (rotationSpeed) {
        rotationSpeed.addEventListener('input', function() {
            updateRotationSpeed(this.value);
        });
    }
    
    // Zoom level
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.addEventListener('input', function() {
            updateZoomLevel(this.value);
        });
    }
    
    // Show labels
    const showLabels = document.getElementById('showLabels');
    if (showLabels) {
        showLabels.addEventListener('change', function() {
            toggleLabels(this.checked);
        });
    }
}

/**
 * Enable UI controls for the visualization
 */
function enableVisualizationControls() {
    // View selector
    const viewSelector = document.getElementById('viewSelector');
    if (viewSelector) {
        viewSelector.disabled = false;
    }
    
    // Rotation speed
    const rotationSpeedControl = document.getElementById('rotationSpeed');
    if (rotationSpeedControl) {
        rotationSpeedControl.disabled = false;
    }
    
    // Zoom level
    const zoomLevelControl = document.getElementById('zoomLevel');
    if (zoomLevelControl) {
        zoomLevelControl.disabled = false;
    }
    
    // Show labels
    const showLabelsControl = document.getElementById('showLabels');
    if (showLabelsControl) {
        showLabelsControl.disabled = false;
    }
}

/**
 * Update visibility of scene elements based on view mode
 * @param {string} viewMode - The selected view mode
 */
function updateVisibilityBasedOnView(viewMode) {
    if (!moleculeGroup || !nanoparticleGroup || !interactionGroup) return;
    
    switch (viewMode) {
        case 'both':
            moleculeGroup.visible = true;
            nanoparticleGroup.visible = true;
            interactionGroup.visible = true;
            break;
        case 'nano':
            moleculeGroup.visible = false;
            nanoparticleGroup.visible = true;
            interactionGroup.visible = false;
            break;
        case 'drug':
            moleculeGroup.visible = true;
            nanoparticleGroup.visible = false;
            interactionGroup.visible = false;
            break;
        case 'interaction':
            moleculeGroup.visible = true;
            nanoparticleGroup.visible = true;
            interactionGroup.visible = true;
            break;
    }
}

/**
 * Update the rotation speed
 * @param {number} speed - Speed value from the slider (0-100)
 */
function updateRotationSpeed(speed) {
    // Convert 0-100 range to appropriate rotation speed
    rotationSpeed = (speed / 100) * 0.01;
}

/**
 * Update the zoom level
 * @param {number} zoom - Zoom value from the slider (0-100)
 */
function updateZoomLevel(zoom) {
    if (!camera) return;
    
    // Convert 0-100 range to camera distance (5-30)
    const distance = 30 - ((zoom / 100) * 25);
    
    // Set camera position
    if (camera.position.z !== distance) {
        // Create a smooth transition
        const currentDistance = camera.position.z;
        const startTime = Date.now();
        const duration = 300; // ms
        
        function animateZoom() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Update camera position
            camera.position.z = currentDistance + (distance - currentDistance) * easedProgress;
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animateZoom);
            }
        }
        
        animateZoom();
    }
}

/**
 * Toggle visibility of labels
 * @param {boolean} show - Whether to show labels
 */
function toggleLabels(show) {
    if (!moleculeGroup || !nanoparticleGroup || !interactionGroup) return;
    
    // Update labels in molecule group
    if (moleculeGroup.userData && moleculeGroup.userData.labels) {
        moleculeGroup.userData.labels.forEach(label => {
            label.visible = show;
        });
    }
    
    // Update labels in nanoparticle group
    if (nanoparticleGroup.userData && nanoparticleGroup.userData.labels) {
        nanoparticleGroup.userData.labels.forEach(label => {
            label.visible = show;
        });
    }
    
    // Update labels in interaction group
    if (interactionGroup.userData && interactionGroup.userData.labels) {
        interactionGroup.userData.labels.forEach(label => {
            label.visible = show;
        });
    }
}

/**
 * Display an error message in the visualization container
 * @param {string} message - Error message to display
 * @param {HTMLElement} container - The visualization container
 */
function showVisualizationError(message, container) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="alert alert-danger d-inline-block">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        </div>
    `;
}

/**
 * Update the visualization info panel with data
 * @param {Object} data - Visualization data
 */
function updateVisualizationInfo(data) {
    const infoPanel = document.getElementById('visualizationInfo');
    if (!infoPanel) return;
    
    const molecule = data.molecule || {};
    const optimization = data.optimization || {};
    const visualization = data.visualization || {};
    
    let html = `
        <h4>Visualization Info</h4>
        <table class="table table-sm">
            <tbody>
                <tr>
                    <th>Molecule</th>
                    <td>${molecule.name || 'Unnamed'}</td>
                </tr>
                <tr>
                    <th>Nanoparticle Type</th>
                    <td>${visualization.nanoparticle?.type || 'Standard'}</td>
                </tr>
                <tr>
                    <th>Size</th>
                    <td>${visualization.nanoparticle?.size_nm || '?'} nm</td>
                </tr>
            </tbody>
        </table>
        
        <p class="small text-muted">
            <i class="fas fa-info-circle me-1"></i>
            Use controls to adjust the visualization view.
        </p>
        
        <p class="small text-muted">
            <i class="fas fa-hand-pointer me-1"></i>
            Click and drag to rotate. Scroll to zoom.
        </p>
    `;
    
    infoPanel.innerHTML = html;
}
