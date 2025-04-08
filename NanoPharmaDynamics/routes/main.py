from flask import Blueprint, render_template
import logging

logger = logging.getLogger(__name__)

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the main application page."""
    logger.debug("Rendering index page")
    return render_template('index.html')

@main_bp.route('/test')
def test_page():
    """Render a simple test page to verify basic functionality."""
    logger.debug("Rendering test page")
    return render_template('simple_test.html')
