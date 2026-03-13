/**
 * Dosa Craft - Main JavaScript
 * Handles Lenis smooth scrolling, GSAP animations, mobile navigation, and menu filters.
 */

class SiteAnimations {
    constructor() {
        this.initLenis();
        this.initGSAP();
        this.initMobileNav();
        this.initScrollHeader();
        this.initMenuFilter();
    }

    /**
     * Initialize Lenis for smooth scrolling
     */
    initLenis() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        // Sync GSAP ScrollTrigger with Lenis
        this.lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        // Handle smooth scroll for anchor links
        document.querySelectorAll('a.smooth-scroll').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId.startsWith('#')) {
                    e.preventDefault();
                    this.lenis.scrollTo(targetId, {
                        offset: -100 // adjust for header
                    });
                }
            });
        });
    }

    /**
     * Initialize GSAP and ScrollTrigger animations
     */
    initGSAP() {
        gsap.registerPlugin(ScrollTrigger);

        // 1. Initial Hero Load Animation (Curtain Loader + Staggered Text Reveal)
        const pageLoader = document.getElementById('page-loader');
        const loaderBar = document.getElementById('loader-bar');
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroCta = document.querySelector('.hero-cta');
        const dosaVector = document.getElementById('dosa-vector');
        const floaters = document.querySelectorAll('.floating-decor');

        const hasLoadedBefore = sessionStorage.getItem('dc_loaded');

        if (!hasLoadedBefore && loaderBar && pageLoader) {
            // First visit in this browser session — show the full loader
            sessionStorage.setItem('dc_loaded', '1');
            document.body.style.overflow = 'hidden';

            const initTl = gsap.timeline({
                defaults: { ease: "power4.out" },
                onComplete: () => {
                    document.body.style.overflow = '';
                }
            });

            // 1a. Loader Progress Bar
            initTl.to(loaderBar, { width: '100%', duration: 1, ease: "power2.inOut" })
                .to(pageLoader, {
                    yPercent: -100,
                    duration: 1,
                    ease: "power4.inOut"
                }, "+=0.2");

            // 1b. Reveal Hero Elements
            const heroElements = [heroTitle, heroSubtitle, heroCta].filter(Boolean);
            if (heroElements.length > 0) {
                initTl.to(heroElements, {
                    y: 0, opacity: 1, duration: 1.2, stagger: 0.15,
                }, "-=0.5");
            }
            if (dosaVector) {
                initTl.fromTo(dosaVector,
                    { y: 150, opacity: 0, scale: 0.8 },
                    { y: 0, opacity: 1, scale: 1, duration: 1.5, ease: "back.out(1.2)" },
                    "-=1.2"
                );
            }
            if (floaters.length > 0) {
                initTl.to(floaters, {
                    opacity: 1, y: -20, duration: 1, stagger: 0.2, ease: "power2.out"
                }, "-=1");
            }
        } else {
            // Subsequent visits — instantly hide loader and show hero
            if (pageLoader) pageLoader.style.display = 'none';
            document.body.style.overflow = '';

            const heroElements = [heroTitle, heroSubtitle, heroCta].filter(Boolean);
            gsap.set(heroElements, { y: 0, opacity: 1 });
            if (dosaVector) gsap.set(dosaVector, { y: 0, opacity: 1, scale: 1 });
            if (floaters.length > 0) gsap.set(floaters, { opacity: 1, y: -20 });
        }

        // 2. True Multi-Layer Scroll Parallax
        const parallaxElements = document.querySelectorAll('.gs-parallax');
        const heroSection = document.getElementById('hero');

        if (heroSection) {
            // Loop through each element and apply a vertical parallax based on its data-speed attribute
            parallaxElements.forEach((el) => {
                const speed = parseFloat(el.getAttribute('data-speed')) || 0.5;

                gsap.to(el, {
                    y: () => -1 * window.innerHeight * speed, // using viewport height for predictable scrub distance
                    ease: "none",
                    scrollTrigger: {
                        trigger: heroSection,
                        start: "top top",
                        end: "bottom top",
                        scrub: 1.5, // Super smooth scrubbing
                        invalidateOnRefresh: true
                    }
                });
            });

            // 3. Immersive Mouse Parallax (Tilt/Shift Effect) - Only for Main Dosa Image
            heroSection.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;
                const { innerWidth, innerHeight } = window;

                // Calculate position relative to center of screen (-1 to 1)
                const xPos = (clientX / innerWidth - 0.5) * 2;
                const yPos = (clientY / innerHeight - 0.5) * 2;

                const mainImage = document.querySelector('.dosa-vector');
                if (mainImage) {
                    const speed = 0.5;
                    // Apply subtle X/Y shift based on depth speed ONLY to the dosa vector
                    gsap.to(mainImage, {
                        x: xPos * 60 * speed,
                        y: yPos * 60 * speed,
                        duration: 1,
                        ease: "power2.out",
                        overwrite: "auto"
                    });
                }
            });

            // Reset mouse parallax on leave
            heroSection.addEventListener('mouseleave', () => {
                const mainImage = document.querySelector('.dosa-vector');
                if (mainImage) {
                    gsap.to(mainImage, {
                        x: 0,
                        y: 0,
                        duration: 1,
                        ease: "power2.out"
                    });
                }
            });

            // 4. Zoom and Fade out main dosa image on scroll
            const mainDosaVector = document.querySelector('.dosa-vector');
            if (mainDosaVector) {
                gsap.to(mainDosaVector, {
                    scale: 1.5,
                    opacity: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: heroSection,
                        start: "top top",
                        end: "bottom top",
                        scrub: true,
                        invalidateOnRefresh: true
                    }
                });
            }
        }

        // 2. Fade Up Elements on Scroll (Optimized for grids)
        
        // Handle standalone fade-up elements
        const standaloneElements = document.querySelectorAll('.fade-up:not(.features-grid .fade-up):not(.philosophy-grid .fade-up):not(.home-section-grid .fade-up):not(.plates-grid .fade-up)');
        standaloneElements.forEach((el) => {
            gsap.fromTo(el,
                {
                    y: 50,
                    opacity: 0
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // Handle grid containers (animate children in rows/staggered)
        const gridContainers = document.querySelectorAll('.features-grid, .philosophy-grid, .home-section-grid, .plates-grid');
        gridContainers.forEach(container => {
            const cards = container.querySelectorAll('.fade-up');
            if(cards.length === 0) return;
            
            gsap.fromTo(cards,
                {
                    y: 50,
                    opacity: 0
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.1, // Stagger effect for items in the same container
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: container,
                        start: "top 80%", // Trigger when the *container* enters the viewport
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // Refresh ScrollTrigger after setup
        ScrollTrigger.refresh();
    }

    /**
     * Handle header background on scroll
     */
    initScrollHeader() {
        const header = document.querySelector('.header');
        // If it's not the scrolled header natively 
        // (like on inner pages where we use header-scrolled by default)
        if (!header.classList.contains('header-scrolled')) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('header-scrolled');
                } else {
                    header.classList.remove('header-scrolled');
                }
            });
        }
    }

    /**
     * Initialize Mobile Navigation Burger Menu
     */
    initMobileNav() {
        const burger = document.getElementById('burger-menu');
        const nav = document.getElementById('nav-links');

        if (burger && nav) {
            burger.addEventListener('click', () => {
                nav.classList.toggle('nav-active');
                burger.classList.toggle('toggle');

                // Add staggered fade in for links if needed
                const navLinksItems = nav.querySelectorAll('a');
                navLinksItems.forEach((link, index) => {
                    if (link.style.animation) {
                        link.style.animation = '';
                    } else {
                        link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                    }
                });
            });

            // Close nav when clicking a link
            nav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('nav-active');
                    burger.classList.remove('toggle');
                });
            });
        }
    }

    /**
     * Initialize Menu Category Filter
     */
    initMenuFilter() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const menuCategories = document.querySelectorAll('.menu-category[data-category]');

        if (filterButtons.length === 0 || menuCategories.length === 0) return;

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const category = btn.getAttribute('data-category');

                menuCategories.forEach(cat => {
                    if (category === 'all' || cat.getAttribute('data-category') === category) {
                        cat.classList.remove('hidden');
                        cat.style.opacity = '0';
                        cat.style.transform = 'translateY(20px)';
                        // Animate in
                        setTimeout(() => {
                            cat.style.opacity = '1';
                            cat.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        cat.classList.add('hidden');
                    }
                });

                // Refresh ScrollTrigger after filter
                ScrollTrigger.refresh();
            });
        });
    }

}

// Add CSS keyframes for nav links dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes navLinkFade {
        from {
            opacity: 0;
            transform: translateX(50px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Global Modal Functions
window.openDirectionsPopup = function (e) {
    if (e) e.preventDefault();
    const popup = document.getElementById('directions-popup');
    if (popup) {
        popup.classList.add('active');
    }
};

window.closeDirectionsPopup = function (e) {
    const popup = document.getElementById('directions-popup');
    if (popup) {
        popup.classList.remove('active');
    }
};

// Close modal when clicking outside
document.addEventListener('click', function (event) {
    const popup = document.getElementById('directions-popup');
    if (popup && event.target === popup) {
        closeDirectionsPopup();
    }
});

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new SiteAnimations();
});
