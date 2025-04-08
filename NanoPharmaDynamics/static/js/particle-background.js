/**
 * particle-background.js
 * Creates a particle background effect for the website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles.js
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": ["#00f3ff", "#9300ff", "#ff00aa"]
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": true,
                    "anim": {
                        "enable": true,
                        "speed": 0.5,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": true,
                        "speed": 2,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#00f3ff",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 1,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": true,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }

    // Initialize GSAP animations if GSAP is loaded
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // Initialize ScrollTrigger
        gsap.registerPlugin(ScrollTrigger);
        
        // Animate elements on scroll
        document.querySelectorAll('.lax-fade-in').forEach(element => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top 80%",
                    onEnter: () => element.classList.add('visible')
                }
            });
        });

        document.querySelectorAll('.lax-slide-left').forEach(element => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top 80%",
                    onEnter: () => element.classList.add('visible')
                }
            });
        });

        document.querySelectorAll('.lax-slide-right').forEach(element => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top 80%",
                    onEnter: () => element.classList.add('visible')
                }
            });
        });

        // Parallax effect for hero section
        gsap.to(".hero-parallax", {
            scrollTrigger: {
                trigger: "#hero",
                start: "top top",
                end: "bottom top",
                scrub: 0.5
            },
            y: 100,
            ease: "none"
        });
    }

    // Initialize lax.js if loaded
    if (typeof lax !== 'undefined') {
        lax.init();
        
        // Add driver
        lax.addDriver('scrollY', function() {
            return window.scrollY;
        });

        // Add elements
        lax.addElements('.lax-preset', {
            scrollY: {
                translateY: [
                    ["elInY", "elOutY"],
                    [0, -100],
                ]
            }
        });
    }

    // Apply neon text effect to headers
    const elementsWithGlitchEffect = document.querySelectorAll('.glitch-text');
    elementsWithGlitchEffect.forEach(element => {
        element.setAttribute('data-text', element.textContent);
    });

    // Apply cyber glow effect to elements with the class
    function applyCyberGlowEffect() {
        const glowElements = document.querySelectorAll('.cyber-glow');
        glowElements.forEach(element => {
            element.addEventListener('mouseover', function() {
                this.style.textShadow = '0 0 5px #fff, 0 0 10px #00f3ff, 0 0 15px #00f3ff, 0 0 20px #00f3ff';
            });
            element.addEventListener('mouseout', function() {
                this.style.textShadow = 'none';
            });
        });
    }
    
    applyCyberGlowEffect();
});
