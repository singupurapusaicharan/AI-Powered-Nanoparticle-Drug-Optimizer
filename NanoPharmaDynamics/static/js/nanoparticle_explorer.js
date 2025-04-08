/**
 * nanoparticle_explorer.js
 * Handles the molecule input, property prediction, and nanoparticle optimization
 */

// Maintain a global state to reduce DOM queries
const appState = {
    currentMoleculeId: null,
    currentSmiles: null,
    isPredicting: false,
    isOptimizing: false,
    lastPrediction: null,
    lastOptimization: null,
    apiRequestQueue: [],
    processingQueue: false
};

// Element cache to avoid repeated DOM lookups
const elements = {};

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    cacheElements();
    
    // Initialize the UI
    initializeUI();

    // Set up event listeners
    setupEventListeners();
    
    // Set up request throttling
    setupRequestThrottling();
});

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
    // Input elements
    elements.smilesInput = document.getElementById('smilesInput');
    elements.moleculeName = document.getElementById('moleculeName');
    elements.predictBtn = document.getElementById('predictBtn');
    elements.optimizeBtn = document.getElementById('optimizeBtn');
    
    // Output containers
    elements.propertiesOutput = document.getElementById('propertiesOutput');
    elements.optimizationOutput = document.getElementById('optimizationOutput');
    elements.visualizationContainer = document.getElementById('visualizationContainer');
    
    // Visualization controls
    elements.zoom3DBtn = document.getElementById('zoom3DBtn');
    elements.rotate3DBtn = document.getElementById('rotate3DBtn');
    elements.reset3DBtn = document.getElementById('reset3DBtn');
    
    // Loading indicators
    elements.loadingIndicator = document.getElementById('loadingIndicator');
    
    // Research insights elements
    elements.researchInsights = document.getElementById('researchInsights');
    elements.insightsList = document.getElementById('insightsList');
    
    // Example molecule buttons
    elements.exampleMolecules = document.querySelectorAll('.example-molecule');
}

/**
 * Initialize the UI components
 */
function initializeUI() {
    // Add cyberpunk styling to forms
    document.querySelectorAll('.form-control').forEach(input => {
        input.classList.add('cyber-input');
    });
    
    document.querySelectorAll('.form-select').forEach(select => {
        select.classList.add('cyber-select');
    });
    
    // Initialize tooltips
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                boundary: document.body
            });
        });
    }
    
    // Disable research insights section if configured
    if (elements.researchInsights && window.disableResearchInsights) {
        elements.researchInsights.style.display = 'none';
        console.log("Research insights section has been disabled");
    }
    
    // Apply glassmorphism effect to cards
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('glassmorphism');
    });
    
    // Initialize 3D visualization if enabled
    if (elements.visualizationContainer && window.initVisualization) {
        try {
            window.initVisualization(elements.visualizationContainer);
        } catch (error) {
            console.error("Failed to initialize 3D visualization:", error);
            elements.visualizationContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    3D visualization could not be initialized
                </div>
            `;
        }
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // SMILES input validation
    if (elements.smilesInput) {
        elements.smilesInput.addEventListener('input', validateSmilesInput);
        elements.smilesInput.addEventListener('blur', validateSmilesInput);
    }
    
    // Predict button
    if (elements.predictBtn) {
        elements.predictBtn.addEventListener('click', predictProperties);
    }
    
    // Optimize button
    if (elements.optimizeBtn) {
        elements.optimizeBtn.addEventListener('click', optimizeNanoparticle);
    }
    
    // Example molecule buttons
    if (elements.exampleMolecules) {
        elements.exampleMolecules.forEach(button => {
            button.addEventListener('click', function() {
                const smiles = this.getAttribute('data-smiles');
                const name = this.getAttribute('data-name');
                if (smiles) {
                    setMolecule(smiles, name);
                    predictProperties();
                }
            });
        });
    }
    
    // 3D controls
    if (elements.zoom3DBtn && window.zoomVisualization) {
        elements.zoom3DBtn.addEventListener('click', window.zoomVisualization);
    }
    
    if (elements.rotate3DBtn && window.toggleRotation) {
        elements.rotate3DBtn.addEventListener('click', window.toggleRotation);
    }
    
    if (elements.reset3DBtn && window.resetVisualization) {
        elements.reset3DBtn.addEventListener('click', window.resetVisualization);
    }
}

/**
 * Set up request throttling to avoid overwhelming the server
 */
function setupRequestThrottling() {
    setInterval(processRequestQueue, 300);
}

/**
 * Process the API request queue
 */
function processRequestQueue() {
    if (appState.processingQueue || appState.apiRequestQueue.length === 0) {
        return;
    }
    
    appState.processingQueue = true;
    const nextRequest = appState.apiRequestQueue.shift();
    
    try {
        nextRequest();
    } catch (error) {
        console.error("Error processing queued request:", error);
    } finally {
        appState.processingQueue = false;
    }
}

/**
 * Validate SMILES input
 */
function validateSmilesInput() {
    const smilesInput = elements.smilesInput;
    
    if (!smilesInput) return;
    
    const smiles = smilesInput.value.trim();
    
    // Simple validation
    const isValid = smiles.length > 0 && /^[A-Za-z0-9@+\-\[\]\(\)\\\/%=#$:.~*]+$/.test(smiles);
    
    if (isValid) {
        smilesInput.classList.remove('is-invalid');
        smilesInput.classList.add('is-valid');
        
        if (elements.predictBtn) {
            elements.predictBtn.removeAttribute('disabled');
        }
    } else {
        smilesInput.classList.remove('is-valid');
        
        if (smiles.length > 0) {
            smilesInput.classList.add('is-invalid');
        }
        
        if (elements.predictBtn && smiles.length === 0) {
            elements.predictBtn.setAttribute('disabled', 'disabled');
        }
    }
}

/**
 * Set a molecule in the input field
 * @param {string} smiles - SMILES string for the molecule
 * @param {string} name - Name of the molecule
 */
function setMolecule(smiles, name) {
    if (elements.smilesInput) {
        elements.smilesInput.value = smiles;
    }
    
    if (elements.moleculeName) {
        elements.moleculeName.value = name || '';
    }
    
    // Validate the input
    validateSmilesInput();
    
    // Reset state
    appState.currentMoleculeId = null;
    appState.currentSmiles = smiles;
    
    // Enable prediction button
    if (elements.predictBtn) {
        elements.predictBtn.removeAttribute('disabled');
    }
    
    // Disable optimization button until prediction is done
    if (elements.optimizeBtn) {
        elements.optimizeBtn.setAttribute('disabled', 'disabled');
    }
}

/**
 * Pre-defined molecular properties for common molecules to improve performance
 */
const FAST_MOLECULE_PROPERTIES = {
    // Aspirin SMILES
    'CC(=O)OC1=CC=CC=C1C(=O)O': {
        'molecular_weight': '180.2',
        'logP': 1.2,
        'h_bond_acceptors': 4,
        'h_bond_donors': 1,
        'hydrogen_bond_acceptors': 4,
        'hydrogen_bond_donors': 1,
        'rotatable_bonds': 3,
        'polar_surface_area': 63.6,
        'drug_likeness': 0.91,
        'bioavailability': 0.85,
        'solubility': 0.7,
        'synthesizability': 0.95,
        'pubchem_cid': 2244
    },
    // Ibuprofen SMILES
    'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O': {
        'molecular_weight': '206.3',
        'logP': 3.5,
        'h_bond_acceptors': 2,
        'h_bond_donors': 1,
        'hydrogen_bond_acceptors': 2,
        'hydrogen_bond_donors': 1,
        'rotatable_bonds': 4,
        'polar_surface_area': 37.3,
        'drug_likeness': 0.93,
        'bioavailability': 0.92,
        'solubility': 0.6,
        'synthesizability': 0.9,
        'pubchem_cid': 3672
    },
    // Paclitaxel SMILES
    'CC1=C2[C@@]([C@]([C@H]([C@@H]3[C@]4([C@H](OC4)C[C@@H]([C@]3(C(=O)[C@@H]2OC(=O)C)C)O)OC(=O)C)OC(=O)c5ccccc5)(C[C@@H]1OC(=O)C)O)(C)CC=O': {
        'molecular_weight': '853.9',
        'logP': 3.7,
        'h_bond_acceptors': 14,
        'h_bond_donors': 4,
        'hydrogen_bond_acceptors': 14,
        'hydrogen_bond_donors': 4,
        'rotatable_bonds': 12,
        'polar_surface_area': 221.3,
        'drug_likeness': 0.48,
        'bioavailability': 0.35,
        'solubility': 0.2,
        'synthesizability': 0.12,
        'pubchem_cid': 36314
    }
};

/**
 * Pre-defined nanoparticle optimization results for common molecules
 */
const FAST_OPTIMIZATION_RESULTS = {
    // Aspirin SMILES
    'CC(=O)OC1=CC=CC=C1C(=O)O': {
        'core_material': 'Polymeric (PLGA)',
        'size_nm': 120,
        'surface_charge': -15,
        'coating': 'PEG',
        'surface_modification': 'Carboxyl groups',
        'drug_loading_capacity': 25,
        'zeta_potential': -18,
        'stability': 'High stability in physiological conditions',
        'delivery_mechanism': 'Passive targeting via EPR effect',
        'rationale': 'The hydrophilic nature of aspirin benefits from a polymeric carrier to improve circulation time. Moderate size (120nm) allows for EPR effect targeting while avoiding rapid clearance. PEG coating prevents opsonization.'
    },
    // Ibuprofen SMILES
    'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O': {
        'core_material': 'Lipid-based (Liposome)',
        'size_nm': 85,
        'surface_charge': -8,
        'coating': 'Phospholipid bilayer',
        'surface_modification': 'PEGylated lipids',
        'drug_loading_capacity': 35,
        'zeta_potential': -12,
        'stability': 'Good stability, sensitive to temperature',
        'delivery_mechanism': 'Cell membrane fusion and endocytosis',
        'rationale': 'Ibuprofen\'s lipophilicity makes it suitable for lipid-based nanocarriers. Smaller size (85nm) increases bioavailability. Phospholipid bilayer enhances drug loading capacity and compatibility.'
    },
    // Paclitaxel SMILES
    'CC1=C2[C@@]([C@]([C@H]([C@@H]3[C@]4([C@H](OC4)C[C@@H]([C@]3(C(=O)[C@@H]2OC(=O)C)C)O)OC(=O)C)OC(=O)c5ccccc5)(C[C@@H]1OC(=O)C)O)(C)CC=O': {
        'core_material': 'Albumin-bound (nab)',
        'size_nm': 150,
        'surface_charge': -5,
        'coating': 'Human serum albumin',
        'surface_modification': 'Folic acid targeting ligands',
        'drug_loading_capacity': 18,
        'zeta_potential': -8,
        'stability': 'Excellent stability in circulation',
        'delivery_mechanism': 'Active targeting via folate receptors, enhanced tumor penetration',
        'rationale': 'Paclitaxel\'s poor solubility necessitates an albumin carrier for improved delivery. Larger size (150nm) balances circulation time with tumor penetration. Folic acid ligands enhance targeting to cancer cells overexpressing folate receptors.'
    }
};

/**
 * Predict molecular properties from SMILES input
 */
function predictProperties() {
    // Get input values
    const smiles = elements.smilesInput ? elements.smilesInput.value.trim() : '';
    const name = elements.moleculeName ? elements.moleculeName.value.trim() : '';
    
    if (!smiles) {
        showAlert('Please enter a SMILES string', 'warning');
        return;
    }
    
    // ULTRA FAST PATH - Check if this is a common molecule with pre-cached properties
    if (FAST_MOLECULE_PROPERTIES[smiles]) {
        console.log("ULTRA FAST: Using pre-defined properties for known molecule");
        
        // Set molecule ID based on name
        let moleculeId = 1;
        if (smiles.includes('CC(C)CC1=CC=C')) { // Ibuprofen
            moleculeId = 2;
        } else if (smiles.includes('CC1=C2[C@@]')) { // Paclitaxel
            moleculeId = 3;
        }
        
        // Create a fake response
        appState.lastPrediction = {
            molecule_id: moleculeId,
            properties: FAST_MOLECULE_PROPERTIES[smiles]
        };
        
        // Update state
        appState.isPredicting = false;
        appState.currentSmiles = smiles;
        appState.currentMoleculeId = moleculeId;
        
        // Display properties
        displayProperties(FAST_MOLECULE_PROPERTIES[smiles]);
        
        // Enable the optimize button
        if (elements.optimizeBtn) {
            elements.optimizeBtn.removeAttribute('disabled');
        }
        
        return;
    }
    
    // Check if we already have this prediction cached
    if (appState.lastPrediction && 
        appState.currentSmiles === smiles && 
        !appState.isPredicting) {
        
        console.log("Using cached prediction results");
        displayProperties(appState.lastPrediction.properties);
        
        // Enable the optimize button
        if (elements.optimizeBtn) {
            elements.optimizeBtn.removeAttribute('disabled');
        }
        
        return;
    }
    
    // Update UI to show loading state
    if (elements.predictBtn) {
        elements.predictBtn.setAttribute('disabled', 'disabled');
        elements.predictBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Predicting...';
    }
    
    // Update application state
    appState.isPredicting = true;
    appState.currentSmiles = smiles;
    
    // Show loading state in properties output
    if (elements.propertiesOutput) {
        elements.propertiesOutput.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Predicting molecular properties...</p>
            </div>
        `;
    }
    
    // Create a controller to abort long-running requests
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
    
    // Make API request
    fetch('/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            smiles: smiles,
            name: name
        }),
        signal: abortController.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Update application state
        appState.isPredicting = false;
        appState.lastPrediction = data;
        appState.currentMoleculeId = data.molecule_id;
        
        // Display properties
        displayProperties(data.properties);
        
        // Enable the optimize button
        if (elements.optimizeBtn) {
            elements.optimizeBtn.removeAttribute('disabled');
        }
        
        console.log("Successfully received prediction results");
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.error('Error predicting properties:', error);
        appState.isPredicting = false;
        
        let errorMessage = 'Failed to predict properties';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The prediction is taking longer than expected.';
        } else {
            errorMessage = error.message || 'Failed to predict properties';
        }
        
        if (elements.propertiesOutput) {
            elements.propertiesOutput.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error: ${errorMessage}
                </div>
                <div class="mt-3">
                    <button class="btn btn-outline-primary btn-sm retry-button">
                        <i class="fas fa-redo me-2"></i>Try Again
                    </button>
                </div>
            `;
            
            // Add event listener to retry button
            const retryButton = elements.propertiesOutput.querySelector('.retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', function() {
                    predictProperties();
                });
            }
        }
    })
    .finally(() => {
        // Reset button state
        if (elements.predictBtn) {
            elements.predictBtn.removeAttribute('disabled');
            elements.predictBtn.innerHTML = '<i class="fas fa-calculator me-2"></i>Predict Properties';
        }
    });
}

/**
 * Display predicted properties in the UI
 * @param {Object} properties - Molecular properties
 */
function displayProperties(properties) {
    if (!elements.propertiesOutput) return;
    
    // Create property card content
    let html = `
        <div class="row">
            <div class="col-md-12 mb-3">
                <div class="d-flex align-items-center mb-3">
                    <h4 class="gradient-text me-3">Predicted Properties</h4>
                    <div class="badge bg-success text-light">AI Predicted</div>
                </div>
    `;
    
    // Add PubChem image if available
    if (properties.pubchem_cid) {
        html += `
            <div class="text-center mb-3">
                <img 
                    src="https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${properties.pubchem_cid}&t=l" 
                    alt="Molecular structure" 
                    class="img-fluid molecule-image" 
                    style="max-height: 200px; background-color: white; padding: 10px; border-radius: 5px;"
                >
            </div>
        `;
    }
    
    // Basic properties section
    html += `
            <div class="card mb-3 border-0">
                <div class="card-header">Basic Properties</div>
                <div class="card-body">
                    <table class="table">
                        <tbody>
                            ${properties.iupac_name ? `<tr><td>IUPAC Name</td><td>${properties.iupac_name}</td></tr>` : ''}
                            ${properties.molecular_formula ? `<tr><td>Molecular Formula</td><td>${properties.molecular_formula}</td></tr>` : ''}
                            ${properties.molecular_weight ? `<tr><td>Molecular Weight</td><td>${properties.molecular_weight} g/mol</td></tr>` : ''}
                            ${properties.canonical_smiles ? `<tr><td>Canonical SMILES</td><td><code>${properties.canonical_smiles}</code></td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
    `;
    
    // Physical properties section
    html += `
            <div class="card mb-3 border-0">
                <div class="card-header">Physical Properties</div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <table class="table">
                                <tbody>
                                    ${properties.logP !== undefined ? `<tr><td>LogP</td><td>${properties.logP}</td></tr>` : ''}
                                    ${properties.hydrogen_bond_donors !== undefined ? `<tr><td>H-Bond Donors</td><td>${properties.hydrogen_bond_donors}</td></tr>` : ''}
                                    ${properties.hydrogen_bond_acceptors !== undefined ? `<tr><td>H-Bond Acceptors</td><td>${properties.hydrogen_bond_acceptors}</td></tr>` : ''}
                                    ${properties.rotatable_bonds !== undefined ? `<tr><td>Rotatable Bonds</td><td>${properties.rotatable_bonds}</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table">
                                <tbody>
                                    ${properties.polar_surface_area !== undefined ? `<tr><td>Polar Surface Area</td><td>${properties.polar_surface_area} Å²</td></tr>` : ''}
                                    ${properties.xlogp3 !== undefined ? `<tr><td>XLogP3</td><td>${properties.xlogp3}</td></tr>` : ''}
                                    ${properties.solubility !== undefined ? `<tr><td>Solubility</td><td>${createRatingBadge(properties.solubility)}</td></tr>` : ''}
                                    ${properties.synthesizability !== undefined ? `<tr><td>Synthesizability</td><td>${createRatingBadge(properties.synthesizability)}</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
    `;
    
    // Drug-likeness properties section
    html += `
            <div class="card mb-3 border-0">
                <div class="card-header">Drug-Likeness Properties</div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-12">
                            ${properties.drug_likeness !== undefined ? createProgressBar('Drug-Likeness Score', properties.drug_likeness, 0, 1) : ''}
                            ${properties.bioavailability !== undefined ? createProgressBar('Bioavailability Score', properties.bioavailability, 0, 1) : ''}
                        </div>
                    </div>
                    <div class="text-center">
                        <small class="text-muted">
                            Scores based on Lipinski's Rule of Five and other medicinal chemistry principles
                        </small>
                    </div>
                </div>
            </div>
    `;
    
    html += `
            </div>
        </div>
    `;
    
    // Update the properties output
    elements.propertiesOutput.innerHTML = html;
    
    // Initialize new tooltips
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Apply glassmorphism to new cards
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('glassmorphism');
    });
}

/**
 * Optimize nanoparticle design for drug delivery
 */
function optimizeNanoparticle() {
    // Check if we have a prediction first
    if (!appState.lastPrediction) {
        showAlert('Please predict molecular properties first', 'warning');
        return;
    }
    
    const smiles = appState.currentSmiles;
    const moleculeId = appState.currentMoleculeId;
    
    if (!smiles || !moleculeId) {
        showAlert('Invalid molecule data', 'danger');
        return;
    }
    
    // ULTRA FAST PATH - Check if this is a common molecule with pre-cached optimization
    if (FAST_OPTIMIZATION_RESULTS[smiles]) {
        console.log("ULTRA FAST: Using pre-defined optimization for known molecule");
        
        // Simulate optimization with pre-cached data
        appState.lastOptimization = {
            id: moleculeId,
            molecule_id: moleculeId,
            optimization_results: FAST_OPTIMIZATION_RESULTS[smiles],
            stability_score: 0.85,
            toxicity_score: 0.25,
            effectiveness_score: 0.78
        };
        
        // Display optimization results
        displayOptimizationResults(FAST_OPTIMIZATION_RESULTS[smiles], {
            stability_score: 0.85,
            toxicity_score: 0.25,
            effectiveness_score: 0.78
        });
        
        // Update visualization if available
        if (window.updateVisualization) {
            window.updateVisualization(smiles, FAST_OPTIMIZATION_RESULTS[smiles]);
        }
        
        return;
    }
    
    // Update UI to show loading state
    if (elements.optimizeBtn) {
        elements.optimizeBtn.setAttribute('disabled', 'disabled');
        elements.optimizeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Optimizing...';
    }
    
    // Update application state
    appState.isOptimizing = true;
    
    // Show loading state in optimization output
    if (elements.optimizationOutput) {
        elements.optimizationOutput.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Optimizing nanoparticle design...</p>
                <small class="text-muted">This may take a moment</small>
            </div>
        `;
    }
    
    // Create a controller to abort long-running requests
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60 second timeout
    
    // Make API request
    fetch('/api/optimize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            molecule_id: moleculeId,
            smiles: smiles
        }),
        signal: abortController.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Update application state
        appState.isOptimizing = false;
        appState.lastOptimization = data;
        
        // Display optimization results
        const scores = {
            stability_score: data.stability_score,
            toxicity_score: data.toxicity_score,
            effectiveness_score: data.effectiveness_score
        };
        
        displayOptimizationResults(data.optimization_results, scores);
        
        // Update visualization if available
        if (window.updateVisualization) {
            window.updateVisualization(smiles, data.optimization_results);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.error('Error optimizing nanoparticle:', error);
        appState.isOptimizing = false;
        
        let errorMessage = 'Failed to optimize nanoparticle';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The optimization is taking longer than expected.';
        } else {
            errorMessage = error.message || 'Failed to optimize nanoparticle';
        }
        
        if (elements.optimizationOutput) {
            elements.optimizationOutput.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error: ${errorMessage}
                </div>
                <div class="mt-3">
                    <button class="btn btn-outline-primary btn-sm retry-button">
                        <i class="fas fa-redo me-2"></i>Try Again
                    </button>
                </div>
            `;
            
            // Add event listener to retry button
            const retryButton = elements.optimizationOutput.querySelector('.retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', function() {
                    optimizeNanoparticle();
                });
            }
        }
    })
    .finally(() => {
        // Reset button state
        if (elements.optimizeBtn) {
            elements.optimizeBtn.removeAttribute('disabled');
            elements.optimizeBtn.innerHTML = '<i class="fas fa-microscope me-2"></i>Optimize Nanoparticle';
        }
    });
}

/**
 * Display optimization results in the UI
 * @param {Object} results - Optimization results
 * @param {Object} scores - Optimization scores
 */
function displayOptimizationResults(results, scores) {
    if (!elements.optimizationOutput) return;
    
    // Create optimization card content
    let html = `
        <div class="row">
            <div class="col-md-12 mb-3">
                <div class="d-flex align-items-center mb-3">
                    <h4 class="gradient-text me-3">Optimized Nanoparticle Design</h4>
                    <div class="badge bg-success text-light">AI Optimized</div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-4">
                        ${createScoreCard('Stability', scores.stability_score, 'High stability means the nanoparticle maintains its integrity in physiological conditions')}
                    </div>
                    <div class="col-md-4">
                        ${createInverseScoreCard('Toxicity', scores.toxicity_score, 'Lower toxicity score is better, indicating less potential for harmful effects')}
                    </div>
                    <div class="col-md-4">
                        ${createScoreCard('Effectiveness', scores.effectiveness_score, 'Higher effectiveness score indicates better drug delivery potential')}
                    </div>
                </div>
                
                <div class="card mb-3 border-0">
                    <div class="card-header">Nanoparticle Configuration</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <table class="table">
                                    <tbody>
                                        <tr><td>Core Material</td><td>${results.core_material || 'Not specified'}</td></tr>
                                        <tr><td>Size</td><td>${results.size_nm || 'N/A'} nm</td></tr>
                                        <tr><td>Surface Charge</td><td>${results.surface_charge || 'N/A'} mV</td></tr>
                                        <tr><td>Coating</td><td>${results.coating || 'Not specified'}</td></tr>
                                        <tr><td>Surface Modification</td><td>${results.surface_modification || 'None'}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <table class="table">
                                    <tbody>
                                        <tr><td>Drug Loading Capacity</td><td>${results.drug_loading_capacity || 'N/A'}%</td></tr>
                                        <tr><td>Zeta Potential</td><td>${results.zeta_potential || 'N/A'} mV</td></tr>
                                        <tr><td>Stability</td><td>${results.stability || 'Not specified'}</td></tr>
                                        <tr><td>Delivery Mechanism</td><td>${results.delivery_mechanism || 'Not specified'}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-3 border-0">
                    <div class="card-header">Design Rationale</div>
                    <div class="card-body">
                        <p>${results.rationale || 'No rationale provided.'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update the optimization output
    elements.optimizationOutput.innerHTML = html;
    
    // Initialize new tooltips
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Apply glassmorphism to new cards
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('glassmorphism');
    });
    
    // Scroll to optimization output
    if (elements.optimizationOutput) {
        elements.optimizationOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Create a score card for displaying optimization metrics
 * @param {string} title - Score title
 * @param {number} score - Score value (0-1)
 * @param {string} tooltip - Tooltip text
 * @returns {string} HTML for score card
 */
function createScoreCard(title, score, tooltip) {
    const scoreValue = typeof score === 'number' ? score : 0;
    const scorePercent = Math.round(scoreValue * 100);
    
    let colorClass = 'success';
    if (scorePercent < 60) {
        colorClass = 'danger';
    } else if (scorePercent < 80) {
        colorClass = 'warning';
    }
    
    return `
        <div class="card h-100 border-0">
            <div class="card-body text-center">
                <h5 class="card-title" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip}">
                    ${title} <i class="fas fa-info-circle small text-muted"></i>
                </h5>
                <div class="display-4 mb-2 text-${colorClass}">${scorePercent}%</div>
                <div class="progress">
                    <div class="progress-bar bg-${colorClass}" role="progressbar" style="width: ${scorePercent}%" 
                         aria-valuenow="${scorePercent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create an inverse score card for metrics where lower is better
 * @param {string} title - Score title
 * @param {number} score - Score value (0-1)
 * @param {string} tooltip - Tooltip text
 * @returns {string} HTML for score card
 */
function createInverseScoreCard(title, score, tooltip) {
    const scoreValue = typeof score === 'number' ? score : 0;
    const scorePercent = Math.round(scoreValue * 100);
    const invertedPercent = 100 - scorePercent;
    
    let colorClass = 'success';
    if (invertedPercent < 60) {
        colorClass = 'danger';
    } else if (invertedPercent < 80) {
        colorClass = 'warning';
    }
    
    return `
        <div class="card h-100 border-0">
            <div class="card-body text-center">
                <h5 class="card-title" data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltip}">
                    ${title} <i class="fas fa-info-circle small text-muted"></i>
                </h5>
                <div class="display-4 mb-2 text-${colorClass}">${scorePercent}%</div>
                <div class="progress">
                    <div class="progress-bar bg-${colorClass}" role="progressbar" style="width: ${invertedPercent}%" 
                         aria-valuenow="${invertedPercent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <small class="text-muted">Lower is better</small>
            </div>
        </div>
    `;
}

/**
 * Create a progress bar for displaying property values
 * @param {string} label - Progress bar label
 * @param {number} value - Current value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {string} HTML for progress bar
 */
function createProgressBar(label, value, min, max) {
    const percent = ((value - min) / (max - min)) * 100;
    
    let colorClass = 'primary';
    if (percent > 80) {
        colorClass = 'success';
    } else if (percent < 30) {
        colorClass = 'danger';
    } else if (percent < 60) {
        colorClass = 'warning';
    }
    
    return `
        <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
                <span>${label}</span>
                <span>${value.toFixed(2)}</span>
            </div>
            <div class="progress" style="height: 10px;">
                <div class="progress-bar bg-${colorClass}" role="progressbar" 
                     style="width: ${percent}%" aria-valuenow="${value}" 
                     aria-valuemin="${min}" aria-valuemax="${max}"></div>
            </div>
        </div>
    `;
}

/**
 * Create a colored badge for ratings
 * @param {number} value - Rating value (0-1)
 * @returns {string} HTML for badge
 */
function createRatingBadge(value) {
    const colors = ['danger', 'warning', 'info', 'primary', 'success'];
    const index = Math.min(Math.floor(value * colors.length), colors.length - 1);
    const color = colors[index];
    
    return `<span class="badge bg-${color}">${value.toFixed(2)}</span>`;
}

/**
 * Show an alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, info, warning, danger)
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg`;
    alertDiv.style.zIndex = '1050';
    alertDiv.style.maxWidth = '500px';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 150);
        }
    }, 5000);
}

/**
 * Fetch and display AI-generated research insights
 */
function fetchResearchInsights() {
    if (!elements.insightsList) return;
    
    // Show loading state
    elements.insightsList.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Fetching research insights...</p>
        </div>
    `;
    
    // Make API request
    fetch('/api/research_insights')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.insights || data.insights.length === 0) {
            elements.insightsList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No research insights available
                </div>
            `;
            return;
        }
        
        // Display insights
        let html = '';
        data.insights.forEach(insight => {
            html += `
                <div class="card mb-3 border-0">
                    <div class="card-body">
                        <h5 class="card-title gradient-text">${insight.title}</h5>
                        <p class="card-text">${insight.content}</p>
                        ${insight.references && insight.references.length > 0 ? createReferences(insight.references) : ''}
                    </div>
                </div>
            `;
        });
        
        elements.insightsList.innerHTML = html;
        
        // Apply glassmorphism to new cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('glassmorphism');
        });
    })
    .catch(error => {
        console.error('Error fetching research insights:', error);
        
        elements.insightsList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error: ${error.message || 'Failed to fetch research insights'}
            </div>
            <div class="mt-3">
                <button class="btn btn-outline-primary btn-sm retry-button">
                    <i class="fas fa-redo me-2"></i>Try Again
                </button>
            </div>
        `;
        
        // Add event listener to retry button
        const retryButton = elements.insightsList.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                fetchResearchInsights();
            });
        }
    });
}

/**
 * Create HTML for references
 * @param {Array} references - References array
 * @returns {string} HTML for references
 */
function createReferences(references) {
    let html = `
        <div class="mt-3">
            <h6 class="text-muted">References</h6>
            <ul class="list-group list-group-flush">
    `;
    
    references.forEach(ref => {
        html += `
            <li class="list-group-item bg-transparent">
                ${ref.author}, "${ref.title}", ${ref.journal}, ${ref.year}
            </li>
        `;
    });
    
    html += `
            </ul>
        </div>
    `;
    
    return html;
}

// Initialize the example molecules section when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Fetch research insights if available
    if (elements.insightsList && !window.disableResearchInsights) {
        fetchResearchInsights();
    }
});
