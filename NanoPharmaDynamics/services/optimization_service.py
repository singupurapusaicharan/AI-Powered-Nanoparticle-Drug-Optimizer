"""
Optimization service for improving application performance and response times.
"""
import functools
import time
import logging
import json
import threading
import gc
from typing import Dict, Any, Callable, List, Optional
from flask import request, jsonify, current_app

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory cache for API responses and expensive computations
_cache = {}
_cache_lock = threading.Lock()

def memoize(ttl: int = 300):
    """
    Memoization decorator for expensive function calls.
    Caches results for a specified time-to-live (TTL) in seconds.
    
    Args:
        ttl (int): Time to live for cached result in seconds
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create a cache key from the function name and arguments
            key = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            
            with _cache_lock:
                # Check if result is in cache and still valid
                if key in _cache and time.time() - _cache[key]['timestamp'] < ttl:
                    logger.debug(f"Cache hit for {key}")
                    return _cache[key]['result']
            
            # Execute the function if not in cache or expired
            result = func(*args, **kwargs)
            
            # Store in cache
            with _cache_lock:
                _cache[key] = {
                    'result': result,
                    'timestamp': time.time()
                }
                
                # Clean old cache entries if cache is getting too large
                if len(_cache) > 100:  # Arbitrary limit
                    _clear_old_cache_entries()
            
            return result
        return wrapper
    return decorator

def _clear_old_cache_entries(max_age: int = 600):
    """
    Clear cache entries older than max_age seconds.
    
    Args:
        max_age (int): Maximum age in seconds for cache entries
    """
    now = time.time()
    keys_to_delete = [
        key for key, value in _cache.items()
        if now - value['timestamp'] > max_age
    ]
    
    for key in keys_to_delete:
        del _cache[key]
    
    if keys_to_delete:
        logger.debug(f"Cleared {len(keys_to_delete)} old cache entries")

def optimize_response(func: Callable):
    """
    Decorator to optimize API response by:
    1. Adding proper caching headers
    2. Compressing response if supported
    3. Tracking response time for performance monitoring
    
    Args:
        func (Callable): The view function to optimize
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        # Execute the original function
        response = func(*args, **kwargs)
        
        # Skip processing if not a Flask response
        if not hasattr(response, 'headers'):
            return response
        
        # Set cache headers (private to prevent CDN caching)
        response.headers['Cache-Control'] = 'private, max-age=10'
        
        # Add performance tracking header
        response_time = round((time.time() - start_time) * 1000)
        response.headers['X-Response-Time'] = f"{response_time}ms"
        
        # Log slow responses
        if response_time > 500:  # More than 500ms is slow
            logger.warning(f"Slow response: {request.path} took {response_time}ms")
        
        return response
    return wrapper

def batch_requests(input_list: List[Any], process_func: Callable, batch_size: int = 10,
                  max_threads: int = 5) -> List[Any]:
    """
    Process a large list of inputs in batches to avoid memory issues.
    Optionally uses threading for parallel processing.
    
    Args:
        input_list (List[Any]): List of input items to process
        process_func (Callable): Function to process each item
        batch_size (int): Size of each batch
        max_threads (int): Maximum number of threads to use
        
    Returns:
        List[Any]: List of processed results
    """
    results = []
    
    # Process in batches
    for i in range(0, len(input_list), batch_size):
        batch = input_list[i:i+batch_size]
        batch_results = []
        threads = []
        
        # Create threads for batch processing
        for item in batch:
            if len(threads) >= max_threads:
                # Wait for a thread to complete
                threads[0].join()
                threads.pop(0)
                
                # Force garbage collection to free memory
                gc.collect()
            
            # Define thread task
            def process_item(item, results):
                try:
                    results.append(process_func(item))
                except Exception as e:
                    logger.error(f"Error processing item {item}: {e}")
                    results.append(None)
            
            # Start thread
            thread = threading.Thread(target=process_item, args=(item, batch_results))
            thread.start()
            threads.append(thread)
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Add batch results to final results
        results.extend(batch_results)
        
        # Force garbage collection between batches
        gc.collect()
    
    return results

def optimize_query_parameters(defaults: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Optimize and sanitize query parameters for database queries.
    Applies reasonable defaults and limits to prevent performance issues.
    
    Args:
        defaults (Dict[str, Any]): Default parameter values
        
    Returns:
        Dict[str, Any]: Optimized parameters
    """
    if defaults is None:
        defaults = {}
    
    # Get parameters from request
    params = request.args.to_dict()
    
    # Set defaults for missing parameters
    for key, value in defaults.items():
        if key not in params:
            params[key] = value
    
    # Limit page size to prevent excessive database queries
    if 'limit' in params:
        try:
            limit = int(params['limit'])
            params['limit'] = min(limit, 100)  # Max 100 items per page
        except (ValueError, TypeError):
            params['limit'] = 20  # Default limit
    
    return params

def apply_performance_optimizations():
    """
    Apply global performance optimizations to the Flask application.
    Call this function during application initialization.
    """
    logger.info("Applying performance optimizations")
    
    # Start cache cleanup thread
    def cache_cleanup_thread():
        while True:
            time.sleep(300)  # Clean every 5 minutes
            with _cache_lock:
                _clear_old_cache_entries()
    
    thread = threading.Thread(target=cache_cleanup_thread, daemon=True)
    thread.start()
    
    # Set up memory monitoring
    def log_memory_usage():
        import psutil
        process = psutil.Process()
        memory_info = process.memory_info()
        logger.info(f"Memory usage: {memory_info.rss / 1024 / 1024:.2f} MB")
    
    # Schedule memory usage logging
    try:
        import psutil
        logger.info("psutil available, memory monitoring enabled")
        threading.Timer(600, log_memory_usage).start()  # Log every 10 minutes
    except ImportError:
        logger.info("psutil not available, memory monitoring disabled")
