"""
Service for generating 3D visualization data for molecules and nanoparticles.
"""
import random
import logging
import math

# Set up logging
logger = logging.getLogger(__name__)

def generate_3d_structure(smiles, optimization_results):
    """
    Generate 3D visualization data for a molecule and its optimized nanoparticle.
    In a real application, this would use libraries like RDKit and PyMOL.
    
    Args:
        smiles (str): SMILES representation of molecule
        optimization_results (dict): Nanoparticle optimization results
        
    Returns:
        dict: 3D visualization data suitable for Three.js
    """
    try:
        logger.debug(f"Generating 3D structure for SMILES: {smiles}")
        
        # Generate simplified molecule
        molecule_data = generate_simplified_molecule(smiles)
        
        # Generate nanoparticle representation
        nanoparticle_data = generate_nanoparticle_representation(
            optimization_results.get('size_nm', 100),
            optimization_results.get('surface_charge_mv', 0),
            optimization_results.get('coating', 'Unknown')
        )
        
        # Calculate interaction points
        interaction_points = calculate_drug_nanoparticle_interactions(
            molecule_data, nanoparticle_data
        )
        
        # Add additional metadata for the visualization
        shape = nanoparticle_data.get('shape', 'sphere')
        texture = nanoparticle_data.get('texture', 'smooth')
        surface_density = nanoparticle_data.get('surface_density', 'medium')
        
        # Create a more detailed response with additional properties
        return {
            'molecule': molecule_data,
            'nanoparticle': nanoparticle_data,
            'interactions': interaction_points,
            'molecule_atom_count': len(molecule_data.get('atoms', [])),
            'nanoparticle_size_nm': optimization_results.get('size_nm', 100),
            'nanoparticle_charge_mv': optimization_results.get('surface_charge_mv', 0),
            'nanoparticle_coating': optimization_results.get('coating', 'Unknown'),
            'nanoparticle_shape': shape,
            'nanoparticle_texture': texture,
            'nanoparticle_surface_density': surface_density,
            'interaction_points_count': len(interaction_points),
            'visualization_quality': 'high',
            'data_source': 'molecular_model'
        }
    
    except Exception as e:
        logger.error(f"Error generating 3D structure: {str(e)}")
        # Pass the original inputs to the fallback to create more relevant visualization
        return generate_fallback_visualization(smiles, optimization_results)

def generate_simplified_molecule(smiles):
    """
    Generate a simplified 3D representation of a molecule from SMILES.
    This is a placeholder - in a real application, you would use RDKit.
    
    Args:
        smiles (str): SMILES representation of molecule
        
    Returns:
        dict: Molecular representation with atoms and bonds
    """
    # Predefined structures for known molecules
    known_molecules = {
        'CC(=O)OC1=CC=CC=C1C(=O)O': {  # Aspirin
            'atoms': [
                {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [1.2, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [1.8, 1.1, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'O', 'position': [1.8, -1.1, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'C', 'position': [-1.2, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [-1.8, 1.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [-1.8, -1.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [-3.0, 1.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [-3.0, -1.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [-3.6, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [3.0, -1.2, 0.5], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'C', 'position': [3.0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [4.0, 0.5, 0], 'color': 0xFF0000, 'radius': 0.35}
            ],
            'bonds': [
                {'atom1': 0, 'atom2': 1, 'order': 1},
                {'atom1': 1, 'atom2': 2, 'order': 2},
                {'atom1': 1, 'atom2': 3, 'order': 1},
                {'atom1': 0, 'atom2': 4, 'order': 1},
                {'atom1': 4, 'atom2': 5, 'order': 1},
                {'atom1': 4, 'atom2': 6, 'order': 1},
                {'atom1': 5, 'atom2': 7, 'order': 1},
                {'atom1': 6, 'atom2': 8, 'order': 1},
                {'atom1': 7, 'atom2': 9, 'order': 1},
                {'atom1': 8, 'atom2': 9, 'order': 1},
                {'atom1': 3, 'atom2': 10, 'order': 1},
                {'atom1': 10, 'atom2': 11, 'order': 1},
                {'atom1': 11, 'atom2': 12, 'order': 2}
            ]
        },
        'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O': {  # Ibuprofen
            'atoms': [
                {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [1.2, 0.5, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [1.2, 2.0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [2.4, -0.3, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [3.7, 0.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [4.2, 1.5, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [5.6, 1.7, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [6.4, 0.6, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [5.9, -0.7, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [4.5, -0.9, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [7.9, 0.8, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [8.5, 0.8, 1.4], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [8.7, -0.1, -0.9], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [10.0, 0.2, -0.9], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'O', 'position': [8.3, -1.1, -1.5], 'color': 0xFF0000, 'radius': 0.35}
            ],
            'bonds': [
                {'atom1': 0, 'atom2': 1, 'order': 1},
                {'atom1': 1, 'atom2': 2, 'order': 1},
                {'atom1': 1, 'atom2': 3, 'order': 1},
                {'atom1': 3, 'atom2': 4, 'order': 1},
                {'atom1': 4, 'atom2': 5, 'order': 2},
                {'atom1': 5, 'atom2': 6, 'order': 1},
                {'atom1': 6, 'atom2': 7, 'order': 2},
                {'atom1': 7, 'atom2': 8, 'order': 1},
                {'atom1': 8, 'atom2': 9, 'order': 2},
                {'atom1': 4, 'atom2': 9, 'order': 1},
                {'atom1': 7, 'atom2': 10, 'order': 1},
                {'atom1': 10, 'atom2': 11, 'order': 1},
                {'atom1': 10, 'atom2': 12, 'order': 1},
                {'atom1': 12, 'atom2': 13, 'order': 1},
                {'atom1': 12, 'atom2': 14, 'order': 2}
            ]
        },
        'CC(=O)NC1=CC=C(O)C=C1': {  # Paracetamol/Acetaminophen
            'atoms': [
                {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [1.4, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [2.0, 1.0, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'N', 'position': [2.0, -1.2, 0], 'color': 0x0000FF, 'radius': 0.35},
                {'element': 'C', 'position': [3.4, -1.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [4.1, -0.1, 0.5], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [5.5, -0.1, 0.5], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [6.2, -1.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [7.6, -1.2, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'C', 'position': [5.5, -2.3, -0.5], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [4.1, -2.3, -0.5], 'color': 0x808080, 'radius': 0.4}
            ],
            'bonds': [
                {'atom1': 0, 'atom2': 1, 'order': 1},
                {'atom1': 1, 'atom2': 2, 'order': 2},
                {'atom1': 1, 'atom2': 3, 'order': 1},
                {'atom1': 3, 'atom2': 4, 'order': 1},
                {'atom1': 4, 'atom2': 5, 'order': 2},
                {'atom1': 5, 'atom2': 6, 'order': 1},
                {'atom1': 6, 'atom2': 7, 'order': 2},
                {'atom1': 7, 'atom2': 8, 'order': 1},
                {'atom1': 7, 'atom2': 9, 'order': 1},
                {'atom1': 9, 'atom2': 10, 'order': 2},
                {'atom1': 10, 'atom2': 4, 'order': 1}
            ]
        },
        'CN1C=NC2=C1C(=O)N(C(=O)N2C)C': {  # Caffeine
            'atoms': [
                {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'N', 'position': [1.4, 0, 0], 'color': 0x0000FF, 'radius': 0.35},
                {'element': 'C', 'position': [2.0, 1.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'N', 'position': [3.4, 1.2, 0], 'color': 0x0000FF, 'radius': 0.35},
                {'element': 'C', 'position': [3.8, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [2.8, -1.0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [5.2, -0.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [6.0, 0.7, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'N', 'position': [5.6, -1.5, 0], 'color': 0x0000FF, 'radius': 0.35},
                {'element': 'C', 'position': [7.0, -1.8, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [4.6, -2.5, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [4.8, -3.7, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'N', 'position': [3.3, -2.0, 0], 'color': 0x0000FF, 'radius': 0.35},
                {'element': 'C', 'position': [2.2, -2.9, 0], 'color': 0x808080, 'radius': 0.4}
            ],
            'bonds': [
                {'atom1': 0, 'atom2': 1, 'order': 1},
                {'atom1': 1, 'atom2': 2, 'order': 1},
                {'atom1': 2, 'atom2': 3, 'order': 2},
                {'atom1': 3, 'atom2': 4, 'order': 1},
                {'atom1': 4, 'atom2': 5, 'order': 2},
                {'atom1': 5, 'atom2': 1, 'order': 1},
                {'atom1': 4, 'atom2': 6, 'order': 1},
                {'atom1': 6, 'atom2': 7, 'order': 2},
                {'atom1': 6, 'atom2': 8, 'order': 1},
                {'atom1': 8, 'atom2': 9, 'order': 1},
                {'atom1': 8, 'atom2': 10, 'order': 1},
                {'atom1': 10, 'atom2': 11, 'order': 2},
                {'atom1': 10, 'atom2': 12, 'order': 1},
                {'atom1': 12, 'atom2': 5, 'order': 1},
                {'atom1': 12, 'atom2': 13, 'order': 1}
            ]
        },
        'C1=CC(=C(C=C1CCN)O)O': {  # Dopamine
            'atoms': [
                {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [1.3, 0.4, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [2.3, -0.6, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [2.0, -2.0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [0.7, -2.4, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [-0.3, -1.4, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [3.7, -0.2, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [4.7, -1.3, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'N', 'position': [6.1, -0.9, 0], 'color': 0x0000FF, 'radius': 0.35},
                {'element': 'O', 'position': [3.0, -2.9, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'O', 'position': [0.4, -3.7, 0], 'color': 0xFF0000, 'radius': 0.35}
            ],
            'bonds': [
                {'atom1': 0, 'atom2': 1, 'order': 2},
                {'atom1': 1, 'atom2': 2, 'order': 1},
                {'atom1': 2, 'atom2': 3, 'order': 2},
                {'atom1': 3, 'atom2': 4, 'order': 1},
                {'atom1': 4, 'atom2': 5, 'order': 2},
                {'atom1': 5, 'atom2': 0, 'order': 1},
                {'atom1': 2, 'atom2': 6, 'order': 1},
                {'atom1': 6, 'atom2': 7, 'order': 1},
                {'atom1': 7, 'atom2': 8, 'order': 1},
                {'atom1': 3, 'atom2': 9, 'order': 1},
                {'atom1': 4, 'atom2': 10, 'order': 1}
            ]
        }
    }
    
    # Return predefined structure if molecule is known
    if smiles in known_molecules:
        return known_molecules[smiles]
    
    # Otherwise generate a structure based on SMILES
    # Parse SMILES to count atoms (simplified approach)
    atoms_count = {
        'C': smiles.count('C') - smiles.count('Cl'),
        'O': smiles.count('O'),
        'N': smiles.count('N'),
        'H': max(5, len(smiles) // 2),  # Simplified estimate
        'Cl': smiles.count('Cl'),
        'F': smiles.count('F'),
        'Br': smiles.count('Br'),
        'S': smiles.count('S')
    }
    
    # Generate random 3D coordinates for atoms (simplified approach)
    atoms = []
    used_positions = set()
    
    # Color mapping for atoms
    color_map = {
        'C': 0x808080,  # Gray
        'O': 0xFF0000,  # Red
        'N': 0x0000FF,  # Blue
        'H': 0xFFFFFF,  # White
        'Cl': 0x00FF00, # Green
        'F': 0x00FFFF,  # Cyan
        'Br': 0x800000, # Brown
        'S': 0xFFFF00   # Yellow
    }
    
    # Size mapping for atoms
    size_map = {
        'C': 0.4,
        'O': 0.35,
        'N': 0.35,
        'H': 0.25,
        'Cl': 0.45,
        'F': 0.3,
        'Br': 0.5,
        'S': 0.45
    }
    
    # Use hash of SMILES to seed the random generator for consistent but varied results
    random.seed(hash(smiles))
    
    # Generate atoms with positions
    for element, count in atoms_count.items():
        if count <= 0:
            continue
            
        for _ in range(count):
            while True:
                # Generate random position within a sphere
                theta = random.random() * 2 * math.pi
                phi = random.random() * math.pi
                r = random.random() * 3
                
                x = round(r * math.sin(phi) * math.cos(theta), 2)
                y = round(r * math.sin(phi) * math.sin(theta), 2)
                z = round(r * math.cos(phi), 2)
                
                # Check for collision with existing atoms
                pos_tuple = (x, y, z)
                too_close = False
                
                for pos in used_positions:
                    dx = pos[0] - x
                    dy = pos[1] - y
                    dz = pos[2] - z
                    distance = math.sqrt(dx*dx + dy*dy + dz*dz)
                    if distance < 0.8:  # Minimum distance between atoms
                        too_close = True
                        break
                
                if not too_close:
                    used_positions.add(pos_tuple)
                    break
            
            atoms.append({
                'element': element,
                'position': [x, y, z],
                'color': color_map.get(element, 0xCCCCCC),
                'radius': size_map.get(element, 0.4)
            })
    
    # Generate bonds (simplified approach)
    bonds = []
    for i in range(len(atoms)):
        for j in range(i+1, len(atoms)):
            # Calculate distance between atoms
            dx = atoms[i]['position'][0] - atoms[j]['position'][0]
            dy = atoms[i]['position'][1] - atoms[j]['position'][1]
            dz = atoms[i]['position'][2] - atoms[j]['position'][2]
            distance = math.sqrt(dx*dx + dy*dy + dz*dz)
            
            # Create bond if atoms are close enough
            if distance < 1.2:
                # Use hash of atoms' positions to determine bond order for consistency
                bond_seed = hash(f"{i}_{j}_{smiles}")
                bond_order = 1
                if bond_seed % 10 < 3:  # 30% chance of double bond
                    bond_order = 2
                elif bond_seed % 100 < 5: # 5% chance of triple bond
                    bond_order = 3
                
                bonds.append({
                    'atom1': i,
                    'atom2': j,
                    'order': bond_order
                })
    
    # Reset random seed
    random.seed()
    
    return {
        'atoms': atoms,
        'bonds': bonds
    }

def generate_nanoparticle_representation(size_nm, surface_charge, coating):
    """
    Generate a 3D representation of a nanoparticle.
    
    Args:
        size_nm (float): Nanoparticle size in nanometers
        surface_charge (float): Surface charge in millivolts
        coating (str): Coating material
        
    Returns:
        dict: Nanoparticle representation
    """
    # Enhanced coating to color and type map
    coating_color_map = {
        'PEG': 0x00FF00,           # Green
        'PLGA': 0x0000FF,          # Blue
        'PEG-PLGA': 0x00B3B3,      # Teal
        'Chitosan': 0xFF0000,      # Red
        'Chitosan-PEG': 0xFF7F00,  # Orange
        'Lipid': 0xFFFF00,         # Yellow
        'Phospholipid': 0xFFD700,  # Gold
        'Phospholipid-PEG': 0xD4AF37, # Darker gold
        'Gold': 0xFFD700,          # Gold
        'Thiol-PEG': 0xB8860B,     # Dark goldenrod
        'Silica': 0xF5F5F5,        # White
        'PEI-PEG': 0x7FFF00,       # Chartreuse
        'Transferrin': 0x8B4513,   # SaddleBrown
        'Polysorbate': 0x9400D3,   # DarkViolet
        'Poloxamer': 0x1E90FF,     # DodgerBlue
        'Albumin': 0xFF00FF,       # Magenta
        'PAMAM-PEG': 0xBA55D3,     # MediumOrchid
        'Hydrogenated Soy PC': 0xDAA520, # GoldenRod
        'PEGylated Phospholipid': 0xD2B48C # Tan
    }
    
    # More specific nanoparticle type mapping
    type_keywords = {
        'polymeric': ['PEG', 'PLGA', 'Chitosan', 'PAMAM', 'Polymer'],
        'liposome': ['Lipid', 'Phospholipid', 'Liposome', 'PC', 'Cholesterol'],
        'gold': ['Gold', 'Au', 'Thiol-PEG'],
        'silica': ['Silica', 'SiO2', 'Mesoporous'],
        'solid_lipid': ['Solid Lipid', 'SLN', 'Polysorbate', 'Poloxamer'],
        'dendrimer': ['Dendrimer', 'PAMAM'],
        'plga-peg': ['PLGA-PEG']
    }
    
    # Determine nanoparticle type based on coating
    nano_type = 'polymeric'  # Default type
    
    # Check if the coating matches any type keywords
    for type_name, keywords in type_keywords.items():
        for keyword in keywords:
            if keyword.lower() in coating.lower():
                nano_type = type_name
                break
    
    # Check specific type from full nanoparticle type name
    if 'polymeric' in coating.lower():
        nano_type = 'polymeric'
    elif 'liposome' in coating.lower():
        nano_type = 'liposome'
    elif 'gold' in coating.lower():
        nano_type = 'gold'
    elif 'silica' in coating.lower() or 'mesoporous' in coating.lower():
        nano_type = 'silica'
    elif 'solid lipid' in coating.lower():
        nano_type = 'solid_lipid'
    elif 'dendrimer' in coating.lower():
        nano_type = 'dendrimer'
    elif 'plga-peg' in coating.lower():
        nano_type = 'plga-peg'
    
    # Determine color based on coating
    color = 0x6C757D  # Default gray
    best_match = ''
    for key, clr in coating_color_map.items():
        if key.lower() in coating.lower() and len(key) > len(best_match):
            best_match = key
            color = clr
    
    # Add some variation based on charge and size
    # Modify brightness based on surface charge
    if surface_charge > 0:
        # Make brighter for positive charge
        r = ((color >> 16) & 0xFF)
        g = ((color >> 8) & 0xFF)
        b = (color & 0xFF)
        
        # Brighten based on charge magnitude
        factor = min(1.3, 1 + abs(surface_charge) / 50)
        r = min(255, int(r * factor))
        g = min(255, int(g * factor))
        b = min(255, int(b * factor))
        
        color = (r << 16) | (g << 8) | b
    elif surface_charge < 0:
        # Make darker for negative charge
        r = ((color >> 16) & 0xFF)
        g = ((color >> 8) & 0xFF)
        b = (color & 0xFF)
        
        # Darken based on charge magnitude
        factor = max(0.7, 1 - abs(surface_charge) / 50)
        r = max(0, int(r * factor))
        g = max(0, int(g * factor))
        b = max(0, int(b * factor))
        
        color = (r << 16) | (g << 8) | b
    
    # Calculate morphology parameters based on type
    shape = 'sphere'
    if nano_type == 'liposome':
        shape = 'vesicle'
    elif nano_type == 'dendrimer':
        shape = 'branched'
    elif nano_type == 'plga-peg':
        shape = 'core-shell'
    
    # Surface texture based on coating
    texture = 'smooth'
    if 'PEG' in coating:
        texture = 'brush'
    elif 'Chitosan' in coating:
        texture = 'rough'
    elif 'Polysorbate' in coating or 'Poloxamer' in coating:
        texture = 'wavy'
    
    # Surface density varies by coating type
    surface_density = 'medium'
    if 'PEG' in coating:
        surface_density = 'high'
    elif 'Thiol' in coating:
        surface_density = 'sparse'
    
    return {
        'type': nano_type,
        'size_nm': size_nm,
        'color': color,
        'surface_charge_mv': surface_charge,
        'coating': coating,
        'shape': shape,
        'texture': texture,
        'surface_density': surface_density
    }

def calculate_drug_nanoparticle_interactions(molecule, nanoparticle):
    """
    Calculate potential interaction points between drug and nanoparticle.
    
    Args:
        molecule (dict): Molecule representation
        nanoparticle (dict): Nanoparticle representation
        
    Returns:
        list: Interaction points
    """
    interactions = []
    
    # In a real application, this would involve physics-based simulations
    # Here we're creating simplified interaction points with more variation
    
    # Use molecule and nanoparticle properties to determine interaction patterns
    # Specific atoms are more likely to interact based on their element type
    interaction_preferences = {
        'O': {  # Oxygen atoms
            'likelihood': 0.7,
            'types': ['hydrogen_bond', 'electrostatic'],
            'color': '#FF7F00',  # Orange
            'min_strength': 0.6
        },
        'N': {  # Nitrogen atoms
            'likelihood': 0.6,
            'types': ['hydrogen_bond', 'electrostatic', 'coordination'],
            'color': '#3333FF',  # Blue
            'min_strength': 0.5
        },
        'S': {  # Sulfur atoms
            'likelihood': 0.5,
            'types': ['coordination', 'hydrophobic'],
            'color': '#FFFF00',  # Yellow
            'min_strength': 0.4
        },
        'Cl': {  # Chlorine atoms
            'likelihood': 0.4,
            'types': ['halogen_bond', 'hydrophobic'],
            'color': '#00FF00',  # Green
            'min_strength': 0.3
        },
        'F': {  # Fluorine atoms
            'likelihood': 0.3,
            'types': ['halogen_bond', 'electrostatic'],
            'color': '#00FFFF',  # Cyan
            'min_strength': 0.2
        },
        'Br': {  # Bromine atoms
            'likelihood': 0.5,
            'types': ['halogen_bond', 'hydrophobic'],
            'color': '#800000',  # Brown
            'min_strength': 0.4
        },
        'C': {  # Carbon atoms (least reactive)
            'likelihood': 0.2,
            'types': ['hydrophobic', 'van_der_waals'],
            'color': '#CCCCCC',  # Light Gray
            'min_strength': 0.1
        }
    }
    
    # Nanoparticle coating affects interaction preferences
    coating_modifiers = {
        'PEG': {
            'electrostatic': 0.8,
            'hydrogen_bond': 1.2,
            'coordination': 0.5,
            'hydrophobic': 0.3
        },
        'PLGA': {
            'electrostatic': 1.0,
            'hydrogen_bond': 1.0,
            'coordination': 0.7,
            'hydrophobic': 0.8
        },
        'Chitosan': {
            'electrostatic': 1.3,
            'hydrogen_bond': 1.1,
            'coordination': 0.6,
            'hydrophobic': 0.4
        },
        'Lipid': {
            'electrostatic': 0.7,
            'hydrogen_bond': 0.8,
            'coordination': 0.5,
            'hydrophobic': 1.5
        },
        'Gold': {
            'electrostatic': 0.6,
            'hydrogen_bond': 0.4,
            'coordination': 1.8,
            'hydrophobic': 0.6
        },
        'Silica': {
            'electrostatic': 1.2,
            'hydrogen_bond': 1.0,
            'coordination': 0.7,
            'hydrophobic': 0.5
        },
        'Thiol': {
            'electrostatic': 0.8,
            'hydrogen_bond': 0.6,
            'coordination': 1.5,
            'hydrophobic': 0.7
        },
        'Phospholipid': {
            'electrostatic': 0.9,
            'hydrogen_bond': 0.8,
            'coordination': 0.5,
            'hydrophobic': 1.3
        }
    }
    
    # Get coating modifier factor
    coating_modifier = {}
    for key, modifier in coating_modifiers.items():
        if key.lower() in nanoparticle.get('coating', '').lower():
            for interaction_type, factor in modifier.items():
                if interaction_type in coating_modifier:
                    coating_modifier[interaction_type] *= factor
                else:
                    coating_modifier[interaction_type] = factor
    
    # Default modifiers if none were found
    if not coating_modifier:
        coating_modifier = {
            'electrostatic': 1.0,
            'hydrogen_bond': 1.0,
            'coordination': 1.0,
            'hydrophobic': 1.0,
            'van_der_waals': 1.0,
            'halogen_bond': 1.0
        }
    
    # Surface charge also affects electrostatic interactions
    if 'surface_charge_mv' in nanoparticle:
        charge = nanoparticle['surface_charge_mv']
        if abs(charge) > 20:
            coating_modifier['electrostatic'] *= 1.5
        elif abs(charge) > 10:
            coating_modifier['electrostatic'] *= 1.2
    
    # Process each atom in the molecule for potential interactions
    if not molecule.get('atoms'):
        return interactions
    
    # Determine how many interactions to generate
    base_interactions = min(8, max(3, len(molecule.get('atoms', [])) // 3))
    
    # Use deterministic randomness based on molecule and nanoparticle
    # This ensures the same molecule with the same nanoparticle gets consistent interactions
    seed_string = f"{len(molecule.get('atoms', []))}_{nanoparticle.get('type', '')}_{nanoparticle.get('size_nm', 0)}"
    random.seed(hash(seed_string))
    
    # Select atoms that are likely to interact
    potential_interactions = []
    for i, atom in enumerate(molecule.get('atoms', [])):
        element = atom.get('element', 'C')
        prefs = interaction_preferences.get(element, interaction_preferences['C'])
        
        # Check if this atom should interact
        if random.random() < prefs['likelihood']:
            # Select interaction type
            interaction_type = random.choice(prefs['types'])
            # Modify strength by coating factors
            base_strength = prefs['min_strength'] + (random.random() * (1.0 - prefs['min_strength']))
            modifier = coating_modifier.get(interaction_type, 1.0)
            strength = min(1.0, base_strength * modifier)
            
            potential_interactions.append({
                'atom_index': i,
                'atom': atom,
                'type': interaction_type,
                'strength': strength,
                'color': prefs['color']
            })
    
    # Sort by strength and take the top interactions
    potential_interactions.sort(key=lambda x: x['strength'], reverse=True)
    selected_interactions = potential_interactions[:base_interactions]
    
    # Generate the interaction data
    for interaction in selected_interactions:
        atom = interaction['atom']
        atom_pos = atom['position']
        
        # Surface point on the nanoparticle (deterministic pseudo-random point on a sphere)
        angle_seed = hash(f"{interaction['atom_index']}_{interaction['type']}")
        theta = (angle_seed % 1000) / 1000.0 * 2 * math.pi
        phi = (angle_seed % 500) / 500.0 * math.pi
        
        r = nanoparticle.get('size_nm', 5) * 0.1  # Scale down for visualization
        
        surface_x = r * math.sin(phi) * math.cos(theta)
        surface_y = r * math.sin(phi) * math.sin(theta)
        surface_z = r * math.cos(phi)
        
        # Adjust interaction point visualization based on type
        interaction_visuals = {
            'hydrogen_bond': {'scale': 1.0, 'color_suffix': 'AA'},
            'electrostatic': {'scale': 1.2, 'color_suffix': 'CC'},
            'coordination': {'scale': 0.8, 'color_suffix': '88'},
            'hydrophobic': {'scale': 1.1, 'color_suffix': '99'},
            'van_der_waals': {'scale': 0.9, 'color_suffix': '77'},
            'halogen_bond': {'scale': 1.0, 'color_suffix': 'BB'}
        }
        
        visuals = interaction_visuals.get(interaction['type'], {'scale': 1.0, 'color_suffix': 'AA'})
        
        # Create color with transparency based on strength
        color = interaction['color'] + visuals['color_suffix']
        
        # Scale surface point based on interaction type
        scale = visuals['scale']
        surface_point = [
            surface_x * 10 * scale, 
            surface_y * 10 * scale, 
            surface_z * 10 * scale
        ]
        
        interactions.append({
            'position': atom_pos,
            'surface_point': surface_point,
            'strength': interaction['strength'],
            'type': interaction['type'],
            'atom_index': interaction['atom_index'],
            'color': color
        })
    
    # Reset random seed
    random.seed()
    
    return interactions

def generate_fallback_visualization(smiles=None, optimization_results=None):
    """
    Generate fallback visualization data when the main function fails.
    
    Args:
        smiles (str, optional): SMILES string that failed to process
        optimization_results (dict, optional): Optimization results that failed to visualize
        
    Returns:
        dict: Basic visualization data
    """
    # Create more varied fallback data based on the provided inputs
    
    # Create a basic molecule - use different structures based on the SMILES if provided
    if smiles:
        # For simplicity, determine a model type based on SMILES features
        if 'O' in smiles and 'N' in smiles:
            # Model a drug-like compound with N and O atoms
            molecule_data = {
                'atoms': [
                    {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [1, 0, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'O', 'position': [1.5, 1, 0], 'color': 0xFF0000, 'radius': 0.35},
                    {'element': 'N', 'position': [2, 0, 0], 'color': 0x0000FF, 'radius': 0.35},
                    {'element': 'C', 'position': [-1, 0, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [-1.5, 1, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [-1.5, -1, 0], 'color': 0x808080, 'radius': 0.4}
                ],
                'bonds': [
                    {'atom1': 0, 'atom2': 1, 'order': 1},
                    {'atom1': 1, 'atom2': 2, 'order': 2},
                    {'atom1': 1, 'atom2': 3, 'order': 1},
                    {'atom1': 0, 'atom2': 4, 'order': 1},
                    {'atom1': 4, 'atom2': 5, 'order': 1},
                    {'atom1': 4, 'atom2': 6, 'order': 1}
                ]
            }
        elif 'C' in smiles and len(smiles) > 20:
            # Model a large carbon-rich molecule
            molecule_data = {
                'atoms': [
                    {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [1, 0.5, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [2, 0, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [2, -1, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [1, -1.5, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [0, -1, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [3, 0.5, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [3, 1.5, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'O', 'position': [4, 2, 0], 'color': 0xFF0000, 'radius': 0.35}
                ],
                'bonds': [
                    {'atom1': 0, 'atom2': 1, 'order': 1},
                    {'atom1': 1, 'atom2': 2, 'order': 2},
                    {'atom1': 2, 'atom2': 3, 'order': 1},
                    {'atom1': 3, 'atom2': 4, 'order': 2},
                    {'atom1': 4, 'atom2': 5, 'order': 1},
                    {'atom1': 5, 'atom2': 0, 'order': 2},
                    {'atom1': 2, 'atom2': 6, 'order': 1},
                    {'atom1': 6, 'atom2': 7, 'order': 1},
                    {'atom1': 7, 'atom2': 8, 'order': 2}
                ]
            }
        else:
            # Simple molecule
            molecule_data = {
                'atoms': [
                    {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'O', 'position': [1, 0, 0], 'color': 0xFF0000, 'radius': 0.35},
                    {'element': 'C', 'position': [-1, 0, 0], 'color': 0x808080, 'radius': 0.4},
                    {'element': 'C', 'position': [0, 1, 0], 'color': 0x808080, 'radius': 0.4}
                ],
                'bonds': [
                    {'atom1': 0, 'atom2': 1, 'order': 2},
                    {'atom1': 0, 'atom2': 2, 'order': 1},
                    {'atom1': 0, 'atom2': 3, 'order': 1}
                ]
            }
    else:
        # Default molecule if no SMILES provided
        molecule_data = {
            'atoms': [
                {'element': 'C', 'position': [0, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'O', 'position': [1, 0, 0], 'color': 0xFF0000, 'radius': 0.35},
                {'element': 'N', 'position': [0, 1, 0], 'color': 0x0000FF, 'radius': 0.35},
                {'element': 'C', 'position': [-1, 0, 0], 'color': 0x808080, 'radius': 0.4},
                {'element': 'C', 'position': [0, -1, 0], 'color': 0x808080, 'radius': 0.4}
            ],
            'bonds': [
                {'atom1': 0, 'atom2': 1, 'order': 1},
                {'atom1': 0, 'atom2': 2, 'order': 1},
                {'atom1': 0, 'atom2': 3, 'order': 1},
                {'atom1': 0, 'atom2': 4, 'order': 1}
            ]
        }
    
    # Create a nanoparticle based on optimization results if provided
    if optimization_results:
        size_nm = optimization_results.get('size_nm', 100)
        surface_charge_mv = optimization_results.get('surface_charge_mv', -10)
        coating = optimization_results.get('coating', 'PEG-PLGA')
        nano_type = optimization_results.get('nanoparticle_type', 'polymeric').lower()
        
        # Determine color based on type
        color = 0x0000FF  # Default blue
        if 'gold' in nano_type:
            color = 0xFFD700
        elif 'lipid' in nano_type or 'liposome' in nano_type:
            color = 0xFFFF00
        elif 'silica' in nano_type:
            color = 0xF5F5F5
        elif 'dendrimer' in nano_type:
            color = 0xBA55D3
        
        # Create basic data
        nanoparticle_data = {
            'type': nano_type,
            'size_nm': size_nm,
            'color': color,
            'surface_charge_mv': surface_charge_mv,
            'coating': coating,
            'shape': 'sphere',
            'texture': 'smooth',
            'surface_density': 'medium'
        }
    else:
        # Default nanoparticle
        nanoparticle_data = {
            'type': 'polymeric',
            'size_nm': 100,
            'color': 0x0000FF,
            'surface_charge_mv': -10,
            'coating': 'PEG-PLGA',
            'shape': 'sphere',
            'texture': 'smooth',
            'surface_density': 'medium'
        }
    
    # Create interaction points based on molecule and nanoparticle
    interaction_points = []
    
    # Generate at least two interaction points
    if molecule_data.get('atoms'):
        # First interaction - preferably with oxygen if present
        o_index = -1
        for i, atom in enumerate(molecule_data['atoms']):
            if atom.get('element') == 'O':
                o_index = i
                break
        
        if o_index >= 0:
            interaction_points.append({
                'position': molecule_data['atoms'][o_index]['position'],
                'surface_point': [5, 5, 0],
                'strength': 0.8,
                'type': 'hydrogen_bond',
                'atom_index': o_index,
                'color': '#FF7F00AA'  # Orange with alpha
            })
        else:
            # Use first atom
            interaction_points.append({
                'position': molecule_data['atoms'][0]['position'],
                'surface_point': [5, 5, 0],
                'strength': 0.7,
                'type': 'hydrophobic',
                'atom_index': 0,
                'color': '#CCCCCC99'  # Gray with alpha
            })
        
        # Second interaction - preferably with nitrogen if present
        n_index = -1
        for i, atom in enumerate(molecule_data['atoms']):
            if atom.get('element') == 'N':
                n_index = i
                break
        
        if n_index >= 0:
            interaction_points.append({
                'position': molecule_data['atoms'][n_index]['position'],
                'surface_point': [0, 5, 5],
                'strength': 0.7,
                'type': 'electrostatic',
                'atom_index': n_index,
                'color': '#3333FFCC'  # Blue with alpha
            })
        elif len(molecule_data['atoms']) > 1:
            # Use second atom
            interaction_points.append({
                'position': molecule_data['atoms'][1]['position'],
                'surface_point': [0, 5, 5],
                'strength': 0.6,
                'type': 'van_der_waals',
                'atom_index': 1,
                'color': '#CCCCCC77'  # Gray with alpha
            })
    
    return {
        'molecule': molecule_data,
        'nanoparticle': nanoparticle_data,
        'interactions': interaction_points,
        'molecule_atom_count': len(molecule_data.get('atoms', [])),
        'nanoparticle_size_nm': nanoparticle_data.get('size_nm', 100),
        'nanoparticle_charge_mv': nanoparticle_data.get('surface_charge_mv', -10),
        'nanoparticle_coating': nanoparticle_data.get('coating', 'PEG-PLGA'),
        'interaction_points_count': len(interaction_points)
    }
