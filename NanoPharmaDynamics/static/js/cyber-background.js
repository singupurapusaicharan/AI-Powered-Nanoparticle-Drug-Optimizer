/**
 * cyber-background.js
 * Creates a 3D cyberpunk grid background for the hero section
 */

document.addEventListener('DOMContentLoaded', function() {
    const cyberBackground = document.getElementById('cyber-background');
    
    if (!cyberBackground || typeof THREE === 'undefined') return;
    
    let scene, camera, renderer;
    let grid, gridMaterial;
    let clock = new THREE.Clock();
    
    function init() {
        // Scene setup
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0b0d, 5, 30);
        
        // Camera setup
        camera = new THREE.PerspectiveCamera(75, cyberBackground.clientWidth / cyberBackground.clientHeight, 0.1, 1000);
        camera.position.set(0, 1, 5);
        camera.lookAt(0, 0, 0);
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(cyberBackground.clientWidth, cyberBackground.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        cyberBackground.appendChild(renderer.domElement);
        
        // Create grid
        createGrid();
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);
        
        const light1 = new THREE.DirectionalLight(0x00f3ff, 2);
        light1.position.set(0, 10, 10);
        scene.add(light1);
        
        const light2 = new THREE.DirectionalLight(0xff00aa, 1);
        light2.position.set(-10, 5, -10);
        scene.add(light2);
        
        // Add resize event listener
        window.addEventListener('resize', onWindowResize, false);
        
        // Start animation loop
        animate();
    }
    
    function createGrid() {
        // Grid parameters
        const size = 20;
        const divisions = 40;
        
        // Create grid material with custom shader
        const gridShader = {
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x00f3ff) },
                color2: { value: new THREE.Color(0xff00aa) }
            },
            vertexShader: `
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec3 vPosition;
                
                void main() {
                    float gridSize = 1.0;
                    float lineWidth = 0.05;
                    
                    float xGrid = smoothstep(0.0, lineWidth, abs(mod(vPosition.x, gridSize) - gridSize * 0.5));
                    float zGrid = smoothstep(0.0, lineWidth, abs(mod(vPosition.z, gridSize) - gridSize * 0.5));
                    
                    float grid = min(xGrid, zGrid);
                    
                    // Pulse effect
                    float pulse = sin(time * 2.0) * 0.5 + 0.5;
                    
                    // Distance from center for radial effect
                    float dist = length(vPosition.xz) / 15.0;
                    float radialFade = 1.0 - smoothstep(0.0, 1.0, dist);
                    
                    // Mix colors based on position and time
                    vec3 color = mix(color1, color2, sin(dist * 5.0 - time) * 0.5 + 0.5);
                    
                    // Combine effects
                    float alpha = (1.0 - grid) * radialFade * (0.7 + pulse * 0.3);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true
        };
        
        gridMaterial = new THREE.ShaderMaterial({
            uniforms: gridShader.uniforms,
            vertexShader: gridShader.vertexShader,
            fragmentShader: gridShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create grid plane
        const gridGeometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
        gridGeometry.rotateX(-Math.PI / 2);
        
        grid = new THREE.Mesh(gridGeometry, gridMaterial);
        scene.add(grid);
        
        // Add another grid for more complex effect
        const gridGeometry2 = new THREE.PlaneGeometry(size, size, divisions, divisions);
        gridGeometry2.rotateX(-Math.PI / 2);
        gridGeometry2.translate(0, 0.1, 0);
        
        const grid2 = new THREE.Mesh(gridGeometry2, gridMaterial.clone());
        scene.add(grid2);
    }
    
    function onWindowResize() {
        camera.aspect = cyberBackground.clientWidth / cyberBackground.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(cyberBackground.clientWidth, cyberBackground.clientHeight);
    }
    
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        
        if (gridMaterial && gridMaterial.uniforms) {
            gridMaterial.uniforms.time.value = elapsedTime;
        }
        
        // Slight camera movement
        camera.position.y = 1.5 + Math.sin(elapsedTime * 0.3) * 0.2;
        camera.position.x = Math.sin(elapsedTime * 0.2) * 0.5;
        camera.lookAt(0, 0, -5);
        
        renderer.render(scene, camera);
    }
    
    // Initialize the cyber background
    init();
});
