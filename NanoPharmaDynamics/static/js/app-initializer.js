/**
 * app-initializer.js
 * Initializes application components and sets defaults
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing app components');
    
    // Initialize components
    initializeComponents();
});

/**
 * Initialize all application components
 */
function initializeComponents() {
    // Check for required JavaScript libraries
    if (typeof THREE === 'undefined') {
        console.error('THREE.js library not loaded!');
    }

    // Set up molecules examples
    setupExampleMolecules();
    
    // Disable research insights if configured
    let researchSection = document.getElementById('researchSection');
    if (researchSection) {
        researchSection.style.display = 'none';
        console.log('Research insights section has been disabled');
    }
}

/**
 * Setup example molecules from the predefined list
 */
function setupExampleMolecules() {
    // Example molecules are already defined in the HTML
}
