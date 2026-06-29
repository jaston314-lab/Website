/* ============================================
   APP.JS - Application Core & State Manager
   Manages lifecycle, dependency loading, and
   global state. All modules are destroyed on
   page unload to prevent memory leaks.
   ============================================ */

const ArcherApp = (function () {
    'use strict';

    // Centralised application state
    const STATE = {
        isReady: false,
        isMobile: false,
        reduceMotion: false,
        breakpoint: 'desktop',
        activeModules: new Set(),
        rafIds: new Set(),
        resizeObservers: new Set(),
        intersectionObservers: new Set()
    };

    const BREAKPOINTS = { mobile: 480, tablet: 768, laptop: 1024 };

    function detectBreakpoint() {
        const w = window.innerWidth;
        if (w < BREAKPOINTS.mobile) return 'mobile';
        if (w < BREAKPOINTS.tablet) return 'tablet';
        if (w < BREAKPOINTS.laptop) return 'laptop';
        return 'desktop';
    }

    function updateState() {
        STATE.breakpoint = detectBreakpoint();
        STATE.isMobile = STATE.breakpoint === 'mobile' || STATE.breakpoint === 'tablet';
        STATE.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ============================================
    // THROTTLE / DEBOUNCE UTILITIES
    // ============================================
    function throttle(fn, limit) {
        let lastTime = 0;
        let pending = false;
        return function (...args) {
            if (pending) return;
            const now = performance.now();
            if (now - lastTime >= limit) {
                lastTime = now;
                fn.apply(this, args);
            } else {
                pending = true;
                const rafId = requestAnimationFrame(() => {
                    lastTime = performance.now();
                    fn.apply(this, args);
                    pending = false;
                    STATE.rafIds.delete(rafId);
                });
                STATE.rafIds.add(rafId);
            }
        };
    }

    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ============================================
    // MODULE REGISTRY (for lifecycle management)
    // ============================================
    function register(moduleName) {
        STATE.activeModules.add(moduleName);
    }

    function unregister(moduleName) {
        STATE.activeModules.delete(moduleName);
    }

    // ============================================
    // SCRIPT LOADER (polls every 50ms)
    // ============================================
    function waitForDeps(deps, timeout) {
        return new Promise((resolve, reject) => {
            const interval = 50;
            let elapsed = 0;
            const poll = () => {
                const allLoaded = deps.every(dep => {
                    return typeof window[dep] !== 'undefined';
                });
                if (allLoaded) {
                    resolve();
                    return;
                }
                elapsed += interval;
                if (elapsed >= timeout) {
                    reject(new Error(`Dependencies not loaded within ${timeout}ms: ${deps.join(', ')}`));
                    return;
                }
                setTimeout(poll, interval);
            };
            poll();
        });
    }

    // ============================================
    // RESOURCE CLEANUP
    // ============================================
    function destroyAll() {
        STATE.rafIds.forEach(id => cancelAnimationFrame(id));
        STATE.rafIds.clear();

        STATE.resizeObservers.forEach(ro => ro.disconnect());
        STATE.resizeObservers.clear();

        STATE.intersectionObservers.forEach(io => io.disconnect());
        STATE.intersectionObservers.clear();

        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.getAll().forEach(st => st.kill());
        }

        STATE.activeModules.clear();
    }

    // ============================================
    // BOOT SEQUENCE
    // ============================================
    async function boot() {
        updateState();

        // Always-initialize modules (no deps needed)
        if (window.ArcherEffects && !STATE.reduceMotion) {
            window.ArcherEffects.initAll();
        }

        if (window.ArcherUI) {
            window.ArcherUI.initPageTransition();
            window.ArcherUI.initCursor();
            window.ArcherUI.initNavigation();
            window.ArcherUI.initBackToTop();
            window.ArcherUI.initPreloader();
            window.ArcherUI.initTestimonialsSlider();
            window.ArcherUI.initContactForm();
        }

        setTimeout(function () {
            if (document.body.classList.contains('loading')) {
                document.body.classList.remove('loading');
            }
        }, 6000);

        // Wait for GSAP (critical)
        try {
            await waitForDeps(['gsap'], 3000);
            if (typeof ScrollTrigger === 'undefined') {
                throw new Error('ScrollTrigger plugin not available');
            }
            gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

            if (!STATE.reduceMotion) {
                if (window.ArcherAnimations) {
                    window.ArcherAnimations.initHeroAnimation();
                    window.ArcherAnimations.initStatsAnimation();

                    // Cinematic glitch on hero accent word after entrance
                    if (window.ArcherUI && window.ArcherUI.glitchText) {
                        window.ArcherUI.glitchText('.hero__title-word--accent', 1400);
                    }
                    window.ArcherAnimations.initServicesScroll();
                    window.ArcherAnimations.initTechnologyAnimations();
                    window.ArcherAnimations.initAboutAnimations();
                    window.ArcherAnimations.initTestimonialsAnimations();
                    window.ArcherAnimations.initPartnersAnimations();
                    window.ArcherAnimations.initGalleryAnimations();
                    window.ArcherAnimations.initContactAnimations();
                    window.ArcherAnimations.initFooterAnimations();
                    window.ArcherAnimations.initSectionReveals();
                    window.ArcherAnimations.initSectionDividers();
                    window.ArcherAnimations.initSmoothScroll();
                }
            } else {
                document.documentElement.classList.add('no-gsap');
                document.querySelectorAll('.stats__number').forEach(function (el) {
                    var target = el.dataset.target;
                    if (target) el.textContent = parseInt(target, 10).toLocaleString();
                });
            }
        } catch (e) {
            console.warn('[ArcherApp] GSAP unavailable — showing content without animations');
            document.documentElement.classList.add('no-gsap');
            document.querySelectorAll('.stats__number').forEach(function (el) {
                var target = el.dataset.target;
                if (target) el.textContent = parseInt(target, 10).toLocaleString();
            });
        }

        // Lazy-init Three.js (only on capable devices, after GSAP)
        try {
            await waitForDeps(['THREE'], 8000);
            if (!STATE.reduceMotion && !STATE.isMobile) {
                if (window.ArcherScenes) {
                    window.ArcherScenes.initHeroScene();
                    window.ArcherScenes.lazyInitTechScene('#technology .technology__visual');
                }
            }
        } catch (e) {
            console.warn('[ArcherApp] Three.js loading failed:', e.message);
        }

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }

        // Resize handler (debounced)
        window.addEventListener('resize', debounce(() => {
            const prev = STATE.breakpoint;
            updateState();
            if (prev !== STATE.breakpoint && typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        }, 250));

        // Cleanup on unload
        window.addEventListener('pagehide', () => destroyAll());
        window.addEventListener('beforeunload', () => destroyAll());

        STATE.isReady = true;
        document.documentElement.classList.add('app-ready');
    }

    return {
        STATE,
        throttle,
        debounce,
        register,
        unregister,
        boot,
        destroyAll
    };
})();

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ArcherApp.boot());
} else {
    ArcherApp.boot();
}
