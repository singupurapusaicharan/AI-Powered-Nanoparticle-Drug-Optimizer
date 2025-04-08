from app import app
import logging
from services.optimization_service import apply_performance_optimizations

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

if __name__ == "__main__":
    # Apply performance optimizations
    logger.info("Applying performance optimizations...")
    apply_performance_optimizations()
    
    logger.info("Starting application server...")
    app.run(host="0.0.0.0", port=5000, debug=True)
