from flask import Blueprint, request, jsonify, Response
from models import Molecule, NanoparticleOptimization, ResearchInsight, db, ChatSession
from services.ai_models import predict_molecular_properties, optimize_nanoparticle, classify_toxicity_stability
from services.chatbot_service import process_chat_message
from services.data_service import get_dataset_names, fetch_dataset, get_molecular_data_from_pubchem
from services.molecular_service import validate_smiles, process_smiles
from services.visualization_service import generate_3d_structure
from services.optimization_service import (
    memoize, optimize_response, optimize_query_parameters, batch_requests
)
import traceback
import logging
import time
import json
import gzip
import io

# Set up logging
logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__, url_prefix="/api")

# Apply response caching and compression
@api_bp.after_request
def after_request(response):
    # Only compress if not already compressed and response is large enough
    if not response.direct_passthrough and response.content_length is not None and response.content_length > 1024:
        if 'gzip' in request.headers.get('Accept-Encoding', '').lower():
            # Create a buffer
            buffer = io.BytesIO()
            
            # Create a gzip file handle
            with gzip.GzipFile(mode='wb', fileobj=buffer) as gzip_file:
                # Write the response data
                gzip_file.write(response.get_data())
            
            # Replace the response data with compressed data
            response.set_data(buffer.getvalue())
            
            # Update headers
            response.headers['Content-Encoding'] = 'gzip'
            response.headers['Content-Length'] = len(response.get_data())
            
    # Add cache headers for GET requests
    if request.method == 'GET':
        response.headers['Cache-Control'] = 'private, max-age=10'
    else:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    
    return response

@api_bp.route('/predict', methods=['POST'])
@optimize_response
def predict():
    """API endpoint for predicting molecular properties."""
    try:
        start_time = time.time()
        data = request.json
        smiles = data.get('smiles')
        
        if not smiles:
            return jsonify({"error": "SMILES string is required"}), 400
        
        # Validate SMILES string
        if not validate_smiles(smiles):
            return jsonify({"error": "Invalid SMILES string provided"}), 400
        
        # Process SMILES string
        processed_smiles = process_smiles(smiles)
        
        # Use cached PubChem data if available
        pubchem_data = get_molecular_data_cached(processed_smiles)
        
        # Check if molecule exists in database, create if not
        molecule = Molecule.query.filter_by(smiles=processed_smiles).first()
        if not molecule:
            molecule = Molecule(
                smiles=processed_smiles,
                name=data.get('name') or (pubchem_data.get('title') if pubchem_data else None)
            )
            db.session.add(molecule)
            db.session.commit()
        
        # Predict properties using memoized function
        properties = predict_properties_cached(processed_smiles)
        
        # Add PubChem data if available
        if pubchem_data:
            properties.update({
                "pubchem_cid": pubchem_data.get("cid"),
                "iupac_name": pubchem_data.get("iupac_name"),
                "molecular_formula": pubchem_data.get("molecular_formula"),
                "canonical_smiles": pubchem_data.get("canonical_smiles"),
                "xlogp3": pubchem_data.get("xlogp3"),
                "drug_likeness": pubchem_data.get("drug_likeness", properties.get("drug_likeness"))
            })
        
        # Log performance
        elapsed_time = time.time() - start_time
        logger.info(f"Property prediction completed in {elapsed_time:.2f}s")
        
        # Return the properties
        return jsonify({
            "molecule_id": molecule.id,
            "properties": properties
        })
    
    except Exception as e:
        logger.error(f"Error in predict endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@api_bp.route('/optimize', methods=['POST'])
@optimize_response
def optimize():
    """API endpoint for optimizing nanoparticle design for drug delivery."""
    try:
        start_time = time.time()
        data = request.json
        molecule_id = data.get('molecule_id')
        smiles = data.get('smiles')
        
        # Allow either molecule_id or direct SMILES
        if not molecule_id and not smiles:
            return jsonify({"error": "Either molecule_id or smiles is required"}), 400
        
        # Get molecule from database or create new one
        if molecule_id:
            molecule = Molecule.query.get(molecule_id)
            if not molecule:
                return jsonify({"error": "Molecule not found"}), 404
            smiles = molecule.smiles
        else:
            # Validate and process SMILES
            if not validate_smiles(smiles):
                return jsonify({"error": "Invalid SMILES string provided"}), 400
            
            processed_smiles = process_smiles(smiles)
            
            # Check if this molecule already exists
            existing_molecule = Molecule.query.filter_by(smiles=processed_smiles).first()
            if existing_molecule:
                molecule = existing_molecule
            else:
                # Create new molecule record
                molecule = Molecule(
                    smiles=processed_smiles,
                    name=data.get('name')
                )
                db.session.add(molecule)
                db.session.commit()
        
        # Generate optimization results
        optimization_results = optimize_nanoparticle(smiles)
        
        # Classify toxicity and stability
        classification = classify_toxicity_stability(smiles, optimization_results)
        
        # Create optimization record
        optimization = NanoparticleOptimization(
            molecule_id=molecule.id,
            optimization_results=optimization_results,
            stability_score=classification.get('stability_score'),
            toxicity_score=classification.get('toxicity_score'),
            effectiveness_score=classification.get('effectiveness_score')
        )
        db.session.add(optimization)
        db.session.commit()
        
        # Log performance
        elapsed_time = time.time() - start_time
        logger.info(f"Nanoparticle optimization completed in {elapsed_time:.2f}s")
        
        # Return the optimization results
        return jsonify({
            "optimization_id": optimization.id,
            "optimization_results": optimization_results,
            "stability_score": optimization.stability_score,
            "toxicity_score": optimization.toxicity_score,
            "effectiveness_score": optimization.effectiveness_score
        })
    
    except Exception as e:
        logger.error(f"Error in optimize endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@api_bp.route('/visualize/<int:optimization_id>', methods=['GET'])
@optimize_response
@memoize(ttl=300)  # Cache visualization results for 5 minutes
def visualize(optimization_id):
    """Generate 3D visualization data for a specific optimization."""
    try:
        optimization = NanoparticleOptimization.query.get(optimization_id)
        if not optimization:
            return jsonify({"error": "Optimization not found"}), 404
        
        molecule = Molecule.query.get(optimization.molecule_id)
        
        # Generate 3D visualization data
        visualization_data = generate_3d_structure(
            molecule.smiles, 
            optimization.optimization_results
        )
        
        return jsonify({
            "visualization": visualization_data,
            "molecule": {
                "id": molecule.id,
                "smiles": molecule.smiles,
                "name": molecule.name
            },
            "optimization": {
                "id": optimization.id,
                "stability_score": optimization.stability_score,
                "toxicity_score": optimization.toxicity_score,
                "effectiveness_score": optimization.effectiveness_score
            }
        })
    
    except Exception as e:
        logger.error(f"Error in visualize endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@api_bp.route('/datasets', methods=['GET'])
@optimize_response
@memoize(ttl=3600)  # Cache dataset list for an hour
def datasets():
    """Get available datasets for molecular analysis."""
    try:
        dataset_names = get_dataset_names()
        return jsonify({"datasets": dataset_names})
    
    except Exception as e:
        logger.error(f"Error in datasets endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@api_bp.route('/dataset', methods=['GET'])
@optimize_response
@memoize(ttl=3600)  # Cache dataset content for an hour
def get_dataset():
    """Fetch a specific dataset for analysis."""
    try:
        dataset_name = request.args.get('name')
        if not dataset_name:
            return jsonify({"error": "Dataset name is required"}), 400
        
        dataset = fetch_dataset(dataset_name)
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404
        
        return jsonify(dataset)
    
    except Exception as e:
        logger.error(f"Error in fetch_dataset endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@api_bp.route('/research-insights', methods=['GET'])
@optimize_response
@memoize(ttl=3600)  # Cache research insights for an hour
def get_research_insights():
    """Get AI-generated research insights."""
    try:
        insights = ResearchInsight.query.order_by(ResearchInsight.created_at.desc()).limit(10).all()
        
        result = [{
            "id": insight.id,
            "title": insight.title,
            "content": insight.content,
            "references": insight.references,
            "created_at": insight.created_at.isoformat()
        } for insight in insights]
        
        return jsonify({"insights": result})
    
    except Exception as e:
        logger.error(f"Error in research_insights endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@api_bp.route('/chat', methods=['POST'])
@optimize_response
def chat():
    """Process a chat message from the user."""
    try:
        data = request.json
        message = data.get('message')
        session_id = data.get('session_id')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        if not session_id:
            return jsonify({"error": "Session ID is required"}), 400
        
        # Process the chat message
        response = process_chat_message(message, session_id)
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Cached function for PubChem data to reduce external API calls
@memoize(ttl=86400)  # Cache for 24 hours
def get_molecular_data_cached(smiles):
    """Cached version of get_molecular_data_from_pubchem."""
    return get_molecular_data_from_pubchem(smiles)

# Cached function for property prediction to improve performance
# Pre-cache common molecules' properties
COMMON_MOLECULES_PROPERTIES = {
    'CC(=O)OC1=CC=CC=C1C(=O)O': {  # Aspirin
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
        'synthesizability': 0.95
    },
    'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O': {  # Ibuprofen
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
        'synthesizability': 0.9
    },
    'CC1=C2[C@@]([C@]([C@H]([C@@H]3[C@]4([C@H](OC4)C[C@@H]([C@]3(C(=O)[C@@H]2OC(=O)C)C)O)OC(=O)C)OC(=O)c5ccccc5)(C[C@@H]1OC(=O)C)O)(C)CC=O': { # Paclitaxel
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
        'synthesizability': 0.12
    }
}

@memoize(ttl=3600)  # Cache for 1 hour
def predict_properties_cached(smiles):
    """Cached version of predict_molecular_properties with optimization."""
    # Check if this is a common molecule with pre-cached properties
    if smiles in COMMON_MOLECULES_PROPERTIES:
        logger.info(f"Using pre-cached properties for common molecule: {smiles[:20]}...")
        return COMMON_MOLECULES_PROPERTIES[smiles]
    
    # Otherwise, calculate properties normally
    return predict_molecular_properties(smiles)
