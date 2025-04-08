/**
 * molecule-examples.js
 * Handles example molecule display and selection
 */

document.addEventListener('DOMContentLoaded', function() {
    // Example molecule SMILES structures
    const exampleMolecules = {
        'Aspirin': 'CC(=O)OC1=CC=CC=C1C(=O)O',
        'Paclitaxel': 'CC1=C2[C@@]([C@]([C@H]([C@@H]3[C@]4([C@H](OC4)C[C@@H]([C@]3(C(=O)[C@@H]2OC(=O)C)C)O)OC(=O)C)OC(=O)c5ccccc5)(C[C@@H]1OC(=O)C)O)(C)CC=O',
        'Ibuprofen': 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O',
        'Caffeine': 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
        'Dopamine': 'C1=CC(=C(C=C1CCN)O)O',
        'Folic Acid': 'C1=CC(=CC=C1C(=O)NC(CCC(=O)O)C(=O)O)NCC2=CN=C3C(=N2)C(=O)NC(=N3)N',
        'Melatonin': 'CC(=O)NCCC1=CNc2c1cc(OC)cc2',
        'Morphine': 'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O',
        'Penicillin G': 'CC1(C(N2C(S1)C(C2=O)NC(=O)CC3=CC=CC=C3)C(=O)O)C',
        'Tetracycline': 'CC1C2C(C3C(C(=O)C(C(C3(C(=O)C2C(=C1O)O)O)N(C)C)C)O)O'
    };

    // Set default molecule when page loads
    function setDefaultMolecule(smiles) {
        const smilesInput = document.getElementById('smilesInput');
        if (smilesInput && !smilesInput.value) {
            smilesInput.value = smiles;
            console.log("Setting default molecule:", smiles);
            
            // Do not automatically trigger property prediction to avoid loading issues
            // Let the user click the button when ready
        }
    }

    // Add click event listeners to example molecule buttons
    function setupExampleMoleculeButtons() {
        const exampleButtons = document.querySelectorAll('.example-molecule');
        
        exampleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const smiles = this.getAttribute('data-smiles');
                const name = this.textContent.trim();
                
                const smilesInput = document.getElementById('smilesInput');
                const moleculeName = document.getElementById('moleculeName');
                
                if (smilesInput) smilesInput.value = smiles;
                if (moleculeName) moleculeName.value = name;
                
                // Don't automatically trigger property prediction
                // Let the user click the button manually to avoid loading issues
            });
        });
    }

    // Set up example molecules not already defined in HTML
    function setupAdditionalExamples() {
        const exampleContainer = document.querySelector('.example-molecules .d-flex');
        if (!exampleContainer) return;
        
        // Check which molecules are already in the DOM
        const existingMolecules = Array.from(exampleContainer.querySelectorAll('.example-molecule'))
            .map(btn => btn.textContent.trim());
        
        // Add additional examples not already present
        for (const [name, smiles] of Object.entries(exampleMolecules)) {
            if (!existingMolecules.includes(name)) {
                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-outline-info example-molecule';
                button.setAttribute('data-smiles', smiles);
                button.textContent = name;
                exampleContainer.appendChild(button);
            }
        }
    }

    // Initialize
    setupExampleMoleculeButtons();
    setupAdditionalExamples();
    
    // Set a default molecule (Paclitaxel)
    setDefaultMolecule(exampleMolecules['Paclitaxel']);
});
