/* ============================================
   UI.JS — Premium Micro-Interactions Engine
   Magnetic cursor · kinetic hover · click burst
   spring physics · image distortion · glitch text
   ============================================ */

window.ArcherUI = (function () {
    'use strict';

    const listeners = [];

    function on(target, event, handler, options) {
        target.addEventListener(event, handler, options);
        listeners.push({ target, event, handler, options });
    }

    function destroyAll() {
        listeners.forEach(({ target, event, handler, options }) => {
            target.removeEventListener(event, handler, options);
        });
    }

    window.addEventListener('pagehide', destroyAll);
    window.addEventListener('beforeunload', destroyAll);

    // ============================================
    // MAGNETIC CURSOR with Spring Physics
    // ============================================
    function initCursor() {
        const cursorEl = document.getElementById('cursor');
        if (!cursorEl || window.matchMedia('(pointer: coarse)').matches) return;

        const dot = cursorEl.querySelector('.cursor__dot');
        const ring = cursorEl.querySelector('.cursor__ring');
        if (!dot || !ring) return;

        // Spring physics state
        let mx = 0, my = 0;
        let rx = 0, ry = 0;
        let rvx = 0, rvy = 0;
        const stiffness = 0.08;
        const damping = 0.75;
        let magTarget = null; // Element being magnetically attracted
        let rafId = null;
        let hoveredElement = null;

        on(document, 'mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
            dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
        }, { passive: true });

        // Magnetic detection — find nearest [data-magnetic] element
        on(document, 'mousemove', (e) => {
            const els = document.querySelectorAll('[data-magnetic], .btn, .nav__link, .accreditation, .partner-logo');
            let closest = null;
            let closestDist = 100; // Magnetic radius in px

            els.forEach(el => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = el;
                }
            });

            if (closest !== magTarget) {
                if (magTarget) magTarget.style.transform = '';
                magTarget = closest;
            }

            if (magTarget) {
                const rect = magTarget.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
                const pull = Math.max(0, 1 - dist / 100);
                const offsetX = (e.clientX - cx) * pull * 0.3;
                const offsetY = (e.clientY - cy) * pull * 0.3;
                magTarget.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                magTarget.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            }
        }, { passive: true });

        // Spring-based ring follow
        function springLoop() {
            const dx = mx - rx;
            const dy = my - ry;
            rvx += dx * stiffness;
            rvy += dy * stiffness;
            rvx *= damping;
            rvy *= damping;
            rx += rvx;
            ry += rvy;
            ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
            rafId = requestAnimationFrame(springLoop);
        }
        rafId = requestAnimationFrame(springLoop);
        window.addEventListener('pagehide', () => { if (rafId) cancelAnimationFrame(rafId); });

        // Hover class toggle
        document.querySelectorAll('[data-hover], a, button').forEach(el => {
            on(el, 'mouseenter', () => {
                cursorEl.classList.add('cursor--hover');
                hoveredElement = el;

                // Kinetic text effect on buttons
                if (el.classList.contains('btn')) {
                    el.style.transform = 'scale(1.03)';
                    el.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
                }

                // Image distortion on service cards
                const cardImg = el.closest('.service-card')?.querySelector('.service-card__img');
                if (cardImg) {
                    cardImg.style.transform = 'scale(1.06)';
                    cardImg.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                }
            });
            on(el, 'mouseleave', () => {
                cursorEl.classList.remove('cursor--hover');
                if (hoveredElement === el) hoveredElement = null;

                if (el.classList.contains('btn')) {
                    el.style.transform = '';
                }

                const cardImg = el.closest('.service-card')?.querySelector('.service-card__img');
                if (cardImg) {
                    cardImg.style.transform = '';
                }
            });
        });

        // Click burst (ring expansion)
        on(document, 'click', () => {
            ring.style.transition = 'none';
            ring.style.width = '24px';
            ring.style.height = '24px';
            ring.style.opacity = '1';
            ring.style.borderColor = '#ffffff';

            requestAnimationFrame(() => {
                ring.style.transition = 'width 0.6s cubic-bezier(0, 0.5, 0.3, 1), height 0.6s cubic-bezier(0, 0.5, 0.3, 1), opacity 0.6s, border-color 0.6s';
                ring.style.width = '40px';
                ring.style.height = '40px';
                ring.style.opacity = '0.4';
                ring.style.borderColor = 'var(--color-accent)';
            });
        });
    }

    // ============================================
    // PRELOADER
    // ============================================
    function initPreloader() {
        if (window.__archer_transition_active) return;

        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        document.body.classList.add('loading');

        let preloaderScene = null;
        if (window.ArcherScenes && window.ArcherScenes.__classes && window.ArcherScenes.__classes.PreloaderScene) {
            try {
                preloaderScene = new window.ArcherScenes.__classes.PreloaderScene();
            } catch (e) {
                console.warn('[ArcherUI] Preloader 3D scene creation failed:', e.message);
            }
        }

        const bar = preloader.querySelector('.preloader__bar');
        const percent = preloader.querySelector('.preloader__percent');
        const wordEls = preloader.querySelectorAll('.preloader__word');
        let progress = 0;
        let timer;

        function step() {
            progress += Math.random() * 18 + 5;
            if (progress >= 100) {
                progress = 100;
                if (bar) bar.style.width = '100%';
                if (percent) percent.textContent = '100%';
                if (preloaderScene) preloaderScene.setProgress(1);
                clearTimeout(timer);
                completePreloader();
                return;
            }
            if (bar) bar.style.width = `${progress}%`;
            if (percent) percent.textContent = `${Math.round(progress)}%`;
            if (preloaderScene) preloaderScene.setProgress(progress / 100);
            timer = setTimeout(step, 100);
        }

        function completePreloader() {
            wordEls.forEach((word, i) => {
                setTimeout(() => {
                    word.style.opacity = '1';
                    word.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                    word.style.transform = 'translateY(0)';
                }, i * 200);
            });
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.classList.remove('loading');
                if (preloaderScene) setTimeout(() => preloaderScene.destroy(), 1000);
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
            }, 1200);
        }

        step();
    }

    // ============================================
    // NAVIGATION
    // ============================================
    function initNavigation() {
        const nav = document.getElementById('nav');
        const burger = document.getElementById('nav-burger');
        const links = document.getElementById('nav-links');

        if (nav) {
            on(window, 'scroll', ArcherApp.throttle(() => {
                nav.classList[window.scrollY > 50 ? 'add' : 'remove']('scrolled');
            }, 32), { passive: true });
        }

        if (burger && links) {
            on(burger, 'click', () => {
                burger.classList.toggle('active');
                links.classList.toggle('open');
            });
        }
    }

    // ============================================
    // TESTIMONIALS SLIDER
    // ============================================
    function initTestimonialsSlider() {
        const slider = document.getElementById('testimonials-slider');
        if (!slider) return;

        const slides = slider.querySelectorAll('.testimonial');
        const dots = document.querySelectorAll('.testimonials__dot');
        const prevBtn = document.querySelector('.testimonials__prev');
        const nextBtn = document.querySelector('.testimonials__next');
        if (!slides.length) return;

        let current = 0;
        let autoTimer;

        function showSlide(index) {
            slides.forEach((t, i) => t.classList.toggle('active', i === index));
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
            current = index;
        }

        function nextSlide() { showSlide((current + 1) % slides.length); }
        function prevSlide() { showSlide((current - 1 + slides.length) % slides.length); }
        function startAuto() { autoTimer = setInterval(nextSlide, 5000); }
        function resetAuto() { clearInterval(autoTimer); startAuto(); }

        showSlide(0);
        startAuto();

        if (nextBtn) on(nextBtn, 'click', () => { nextSlide(); resetAuto(); });
        if (prevBtn) on(prevBtn, 'click', () => { prevSlide(); resetAuto(); });
        dots.forEach((dot, i) => on(dot, 'click', () => { showSlide(i); resetAuto(); }));

        window.addEventListener('pagehide', () => clearInterval(autoTimer));
    }

    // ============================================
    // BACK TO TOP
    // ============================================
    function initBackToTop() {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        on(window, 'scroll', ArcherApp.throttle(() => {
            btn.classList[window.scrollY > window.innerHeight ? 'add' : 'remove']('visible');
        }, 32), { passive: true });

        on(btn, 'click', () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(window, { scrollTo: 0, duration: 1.2, ease: 'power3.inOut' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ============================================
    // CONTACT FORM
    // ============================================
    function initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        on(form, 'submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('.btn');
            if (!btn) return;
            const span = btn.querySelector('span');
            if (!span) return;
            const originalText = span.textContent;
            span.textContent = 'Sending...';
            btn.disabled = true;

            setTimeout(() => {
                span.textContent = 'Enquiry Sent!';
                btn.style.background = '#00cc88';
                setTimeout(() => {
                    span.textContent = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                    form.reset();
                }, 2500);
            }, 1500);
        });
    }

    // ============================================
    // GLITCH TEXT (on page load for hero)
    // ============================================
    function glitchText(selector, delay) {
        const el = document.querySelector(selector);
        if (!el) return;
        setTimeout(() => {
            el.classList.add('glitch');
            setTimeout(() => el.classList.remove('glitch'), 200);
        }, delay);
    }

    // ============================================
    // PAGE TRANSITION SYSTEM
    // First visit → full preloader. Navigation → body fade-in.
    // ============================================
    function initPageTransition() {
        var visited = sessionStorage.getItem('archer_visited');

        if (!visited) {
            sessionStorage.setItem('archer_visited', '1');
            return;
        }

        window.__archer_transition_active = true;

        var preloader = document.getElementById('preloader');
        if (preloader) preloader.style.display = 'none';
        document.body.classList.remove('loading');
        document.body.classList.add('page-enter');
    }

    return {
        initCursor, initNavigation, initPreloader,
        initTestimonialsSlider, initBackToTop, initContactForm,
        initPageTransition,
        glitchText, destroyAll
    };
})();
