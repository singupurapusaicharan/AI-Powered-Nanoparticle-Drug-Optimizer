from app import db
from datetime import datetime

class Molecule(db.Model):
    __tablename__ = 'molecule'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=True)
    smiles = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Molecule {self.id} - {self.name if self.name else self.smiles[:10]}>'

class NanoparticleOptimization(db.Model):
    __tablename__ = 'nanoparticle_optimization'
    
    id = db.Column(db.Integer, primary_key=True)
    molecule_id = db.Column(db.Integer, db.ForeignKey('molecule.id'), nullable=False)
    optimization_results = db.Column(db.JSON, nullable=False)
    stability_score = db.Column(db.Float, nullable=True)
    toxicity_score = db.Column(db.Float, nullable=True)
    effectiveness_score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    molecule = db.relationship('Molecule', backref=db.backref('optimizations', lazy=True))
    
    def __repr__(self):
        return f'<NanoparticleOptimization {self.id} for Molecule {self.molecule_id}>'

class ResearchInsight(db.Model):
    __tablename__ = 'research_insight'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    ref_data = db.Column(db.JSON, nullable=True)  # Changed from 'references' which is a reserved keyword
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ResearchInsight {self.id} - {self.title}>'

class ChatSession(db.Model):
    __tablename__ = 'chat_session'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    conversation_history = db.Column(db.JSON, nullable=False, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<ChatSession {self.session_id}>'
