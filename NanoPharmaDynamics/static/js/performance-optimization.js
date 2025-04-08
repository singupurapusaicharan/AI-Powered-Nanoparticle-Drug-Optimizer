/**
 * performance-optimization.js
 * Optimizes website performance and reduces lag
 */

document.addEventListener('DOMContentLoaded', function() {
    // Lazy load non-critical resources
    lazyLoadResources();
    
    // Optimize particle effect
    optimizeParticleEffect();
    
    // Optimize 3D rendering performance
    optimize3DRendering();
    
    // Implement request throttling
    setupRequestThrottling();
    
    // Optimize animations
    optimizeAnimations();
    
    console.log("Performance optimizations applied");
});

/**
 * Lazy load non-critical resources
 */
function lazyLoadResources() {
    // Detect when elements enter viewport and then load them
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                
                // If it's an image with data-src
                if (target.tagName === 'IMG' && target.dataset.src) {
                    target.src = target.dataset.src;
                    observer.unobserve(target);
                }
                
                // If it contains a class to lazy load
                if (target.classList.contains('lazy-load')) {
                    target.classList.add('loaded');
                    observer.unobserve(target);
                }
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.1
    });
    
    // Observe all elements that should be lazy loaded
    document.querySelectorAll('img[data-src], .lazy-load').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Optimize particle effect to reduce CPU usage
 */
function optimizeParticleEffect() {
    // Check if particles.js is loaded and running
    if (typeof pJSDom !== 'undefined' && pJSDom.length > 0) {
        // Get the particles.js instance
        const instance = pJSDom[0];
        
        // Reduce the number of particles
        if (instance.pJS.particles.array.length > 30) {
            // Lower number of particles on mobile
            if (window.innerWidth < 768) {
                instance.pJS.particles.number.value = 20;
            } else {
                instance.pJS.particles.number.value = 40;
            }
            
            // Slower animation for better performance
            instance.pJS.particles.move.speed = 1;
            
            // Disable interactivity on mobile
            if (window.innerWidth < 768) {
                instance.pJS.interactivity.events.onhover.enable = false;
            }
            
            // Apply changes
            instance.pJS.fn.particlesRefresh();
        }
    }
}

/**
 * Optimize 3D rendering performance
 */
function optimize3DRendering() {
    // Lower resolution on mobile devices
    if (typeof renderer !== 'undefined' && window.innerWidth < 768) {
        renderer.setPixelRatio(1);
    }
    
    // Reduce rendering quality on lower-end devices
    if (typeof THREE !== 'undefined') {
        // Check if the device might be low-powered
        const fps = estimateDevicePerformance();
        
        if (fps < 30) {
            // Apply low-quality renderer settings
            if (typeof renderer !== 'undefined') {
                renderer.setSize(window.innerWidth, window.innerHeight, false);
                
                // Use simpler geometries
                useSimplifiedGeometries();
            }
        }
    }
}

/**
 * Estimate device performance by measuring FPS
 * @returns {number} Estimated FPS
 */
function estimateDevicePerformance() {
    let fps = 60; // Default assumption
    
    // Simple FPS counter
    let frameCount = 0;
    let startTime = performance.now();
    
    function countFrame() {
        frameCount++;
        
        if (performance.now() - startTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            startTime = performance.now();
            return;
        }
        
        requestAnimationFrame(countFrame);
    }
    
    // Start counting frames
    countFrame();
    
    return fps;
}

/**
 * Use simplified geometries for 3D rendering
 */
function useSimplifiedGeometries() {
    // Replace complex geometries with simpler ones
    // This function would be called if the device is detected to be low-powered
    if (typeof THREE === 'undefined') return;
    
    // Override geometry creation functions with simpler versions
    const originalSphereGeometry = THREE.SphereGeometry;
    THREE.SphereGeometry = function(radius, widthSegments, heightSegments, ...args) {
        // Reduce segment count for better performance
        widthSegments = Math.min(widthSegments, 16);
        heightSegments = Math.min(heightSegments, 12);
        return new originalSphereGeometry(radius, widthSegments, heightSegments, ...args);
    };
    
    console.log("Using simplified geometries for better performance");
}

/**
 * Set up request throttling to prevent API rate limits
 */
function setupRequestThrottling() {
    // Throttle API requests
    const requestQueue = [];
    let isProcessing = false;
    
    // Override fetch to implement throttling
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // If it's an API call that needs throttling
        if (typeof url === 'string' && url.includes('/api/')) {
            return new Promise((resolve, reject) => {
                // Add to queue
                requestQueue.push({
                    url: url,
                    options: options,
                    resolve: resolve,
                    reject: reject
                });
                
                processQueue();
            });
        }
        
        // Otherwise use original fetch
        return originalFetch(url, options);
    };
    
    function processQueue() {
        if (isProcessing || requestQueue.length === 0) return;
        
        isProcessing = true;
        const request = requestQueue.shift();
        
        // Process request
        originalFetch(request.url, request.options)
            .then(response => request.resolve(response))
            .catch(error => request.reject(error))
            .finally(() => {
                isProcessing = false;
                
                // Wait a bit before processing next request
                setTimeout(processQueue, 300);
            });
    }
}

/**
 * Optimize animations to reduce CPU/GPU usage
 */
function optimizeAnimations() {
    // Use passive event listeners
    const passiveSupported = false;
    try {
        const options = {
            get passive() {
                return passiveSupported = true;
            }
        };
        
        window.addEventListener("test", null, options);
        window.removeEventListener("test", null, options);
    } catch (err) {
        passiveSupported = false;
    }
    
    // Replace event listeners with passive ones
    if (passiveSupported) {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // For scroll, touchstart and touchmove, use passive by default
            const shouldBePassive = ['scroll', 'touchstart', 'touchmove'].includes(type);
            
            if (shouldBePassive && typeof options === 'object') {
                options.passive = options.passive !== false;
            } else if (shouldBePassive && !options) {
                options = { passive: true };
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
    }
    
    // Optimize GSAP animations on lower-end devices
    if (typeof gsap !== 'undefined') {
        // Detect low FPS
        if (estimateDevicePerformance() < 30) {
            // Disable some animations
            document.querySelectorAll('.lax-fade-in, .lax-slide-left, .lax-slide-right').forEach(el => {
                el.classList.add('visible');
                el.style.opacity = 1;
                el.style.transform = 'none';
            });
            
            // Override GSAP methods to use transform instead of individual properties
            gsap.config({
                force3D: false
            });
        }
    }
}
