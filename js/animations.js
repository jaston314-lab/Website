/* ============================================
   ANIMATIONS.JS - Production GSAP Engine
   Cinematic scroll · energy pulses · dramatic reveals
   ============================================ */

window.ArcherAnimations = (function () {
    'use strict';

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return {
            initHeroAnimation: noop, initStatsAnimation: noop,
            initServicesScroll: noop, initTechnologyAnimations: noop,
            initAboutAnimations: noop, initTestimonialsAnimations: noop,
            initPartnersAnimations: noop, initGalleryAnimations: noop,
            initContactAnimations: noop, initFooterAnimations: noop,
            initSectionReveals: noop, initSmoothScroll: noop,
            initSectionDividers: noop,
            killAllTriggers: noop
        };
    }

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const triggers = new Set();
    function register(st) { triggers.add(st); return st; }
    function killAllTriggers() {
        triggers.forEach(st => { if (st && st.kill) st.kill(); });
        triggers.clear();
    }
    window.addEventListener('pagehide', killAllTriggers);
    window.addEventListener('beforeunload', killAllTriggers);

    function noop() { }

    // ============================================
    // HERO
    // ============================================
    function initHeroAnimation() {
        const tl = gsap.timeline({ delay: 0.2 });
        tl.to('.hero__eyebrow-line', { scaleX: 1, duration: 0.8, ease: 'expo.out' })
            .to('.hero__eyebrow-text', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.4')
            .to('.hero__title-word', { y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, '-=0.3')
            .to('.hero__subtitle', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
            .to('.hero__actions', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
            .to('.hero__image', { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }, '-=0.9')
            .to('.hero__scroll-indicator', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3');
    }

    // ============================================
    // STATS COUNTER
    // ============================================
    function initStatsAnimation() {
        const el = document.getElementById('stats');
        if (!el) return;

        register(ScrollTrigger.create({
            trigger: el,
            start: 'top 80%',
            once: true,
            onEnter: () => {
                gsap.to('.stats__divider', { scaleY: 1, duration: 0.8, ease: 'expo.out', stagger: 0.1 });

                document.querySelectorAll('.stats__number').forEach((numEl) => {
                    const target = parseInt(numEl.dataset.target, 10) || 0;
                    const obj = { val: 0 };
                    gsap.to(obj, {
                        val: target,
                        duration: 2.2,
                        ease: 'power2.out',
                        onUpdate: () => { numEl.textContent = Math.round(obj.val).toLocaleString(); }
                    });
                });

                gsap.from('.stats__label', { opacity: 0, y: 10, duration: 0.6, ease: 'power2.out', stagger: 0.1, delay: 0.5 });
            }
        }));
    }

    // ============================================
    // SERVICES HORIZONTAL SCROLL
    // ============================================
    function initServicesScroll() {
        if (window.innerWidth <= 768) return;

        const wrapper = document.querySelector('.services__wrapper');
        const scrollArea = document.getElementById('services-scroll');
        const progressBar = document.getElementById('services-progress');
        const section = document.getElementById('services');
        if (!wrapper || !scrollArea) return;

        const cards = wrapper.querySelectorAll('.service-card');
        let scrollDistance = 0;

        function recalcDistance() {
            let total = 0;
            const gap = 24;
            cards.forEach((card, i) => {
                total += card.offsetWidth;
                if (i < cards.length - 1) total += gap;
            });
            scrollDistance = Math.max(total - scrollArea.offsetWidth, 0);
            return scrollDistance;
        }

        recalcDistance();
        if (scrollDistance <= 0) return;

        gsap.to(wrapper, {
            x: () => -scrollDistance,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'center center',
                end: () => `+=${scrollDistance}`,
                pin: true,
                scrub: 1,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    if (progressBar) progressBar.style.width = `${self.progress * 100}%`;
                }
            }
        });

        gsap.from('.service-card', {
            opacity: 0, y: 80, duration: 0.9, ease: 'power3.out', stagger: 0.06,
            scrollTrigger: { trigger: section, start: 'top 80%', once: true }
        });

        gsap.from('.services__header .section-tag', {
            opacity: 0, x: -30, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: '.services__header', start: 'top 85%', once: true }
        });

        gsap.from('.services__header .section-title', {
            opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: '.services__header', start: 'top 85%', once: true }
        });
    }

    // ============================================
    // SECTION DIVIDER REVEAL
    // ============================================
    function initSectionDividers() {
        document.querySelectorAll('.section-divider').forEach(divider => {
            gsap.from(divider, {
                opacity: 0, scaleX: 0, duration: 1.2, ease: 'power3.out',
                scrollTrigger: register(ScrollTrigger.create({
                    trigger: divider,
                    start: 'top 85%',
                    once: true
                }))
            });
        });
    }

    // ============================================
    // GENERIC SECTION REVEAL
    // ============================================
    function revealSection(sectionId, extraEffects) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const conf = { trigger: section, start: 'top 80%', once: true };
        gsap.from(section.querySelectorAll('.section-tag, .section-title'), {
            opacity: 0, y: 50, duration: 0.8, ease: 'power3.out', stagger: 0.15,
            scrollTrigger: conf
        });

        if (extraEffects) extraEffects(section, conf);
    }

    // ============================================
    // TECHNOLOGY SECTION
    // ============================================
    function initTechnologyAnimations() {
        revealSection('technology', () => {
            gsap.from('.technology__desc', {
                opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: '.technology__desc', start: 'top 85%', once: true }
            });
            gsap.from('.technology__feature', {
                opacity: 0, x: -50, duration: 0.7, ease: 'power3.out', stagger: 0.15,
                scrollTrigger: { trigger: '.technology__features', start: 'top 80%', once: true }
            });
            gsap.from('.technology__visual', {
                opacity: 0, scale: 0.85, duration: 1.2, ease: 'power3.out',
                scrollTrigger: { trigger: '.technology__visual', start: 'top 80%', once: true }
            });
            gsap.from('.hotspot', {
                opacity: 0, scale: 0, duration: 0.5, ease: 'back.out(2.5)', stagger: 0.2,
                scrollTrigger: { trigger: '.technology__visual', start: 'top 50%', once: true }
            });
        });
    }

    // ============================================
    // ABOUT SECTION
    // ============================================
    function initAboutAnimations() {
        revealSection('about', () => {
            gsap.from('.about__paragraph', {
                opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.2,
                scrollTrigger: { trigger: '.about__text', start: 'top 80%', once: true }
            });
            gsap.from('.about__image', {
                opacity: 0, y: 80, scale: 0.9, duration: 1.2, ease: 'power3.out', stagger: 0.2,
                scrollTrigger: { trigger: '.about__visual', start: 'top 80%', once: true }
            });

            document.querySelectorAll('[data-parallax]').forEach((el) => {
                const speed = parseFloat(el.dataset.parallax) || 0;
                gsap.to(el, {
                    y: () => -80 * speed,
                    ease: 'none',
                    scrollTrigger: register(ScrollTrigger.create({
                        trigger: '.about__visual',
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true
                    }))
                });
            });

            gsap.from('.accreditation', {
                opacity: 0, y: 20, scale: 0.9, duration: 0.6, ease: 'back.out(2)', stagger: 0.1,
                scrollTrigger: { trigger: '.about__accreditations', start: 'top 85%', once: true }
            });
        });
    }

    // ============================================
    // TESTIMONIALS / PARTNERS / GALLERY / CONTACT
    // ============================================
    function initTestimonialsAnimations() { revealSection('testimonials'); }
    function initPartnersAnimations() { revealSection('partners'); }

    function initGalleryAnimations() {
        revealSection('gallery', () => {
            gsap.from('.gallery__item', {
                opacity: 0, y: 60, scale: 0.92, duration: 0.8, ease: 'power3.out', stagger: 0.1,
                scrollTrigger: { trigger: '.gallery__grid', start: 'top 80%', once: true }
            });
        });
    }

    function initContactAnimations() {
        revealSection('contact', () => {
            gsap.from('.contact__desc', {
                opacity: 0, y: 20, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: '.contact__desc', start: 'top 85%', once: true }
            });
            gsap.from('.contact__detail', {
                opacity: 0, x: -30, duration: 0.6, ease: 'power3.out', stagger: 0.12,
                scrollTrigger: { trigger: '.contact__details', start: 'top 80%', once: true }
            });
            gsap.from('.contact__form-wrapper', {
                opacity: 0, y: 50, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: '.contact__form-wrapper', start: 'top 80%', once: true }
            });
            gsap.from('.form-group', {
                opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', stagger: 0.1,
                scrollTrigger: { trigger: '.contact__form', start: 'top 75%', once: true }
            });
        });
    }

    // ============================================
    // FOOTER
    // ============================================
    function initFooterAnimations() {
        register(ScrollTrigger.create({
            trigger: '.footer',
            start: 'top 90%',
            once: true,
            onEnter: () => {
                gsap.to('.footer__line', { scaleX: 1, duration: 1.4, ease: 'power3.inOut' });
            }
        }));
    }

    // ============================================
    // SECTION TITLE REVEALS
    // ============================================
    function initSectionReveals() {
        document.querySelectorAll('.text-highlight').forEach((el) => {
            gsap.from(el, {
                color: 'rgba(136, 146, 164, 1)',
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: register(ScrollTrigger.create({
                    trigger: el, start: 'top 85%', once: true
                }))
            });
        });
    }

    // ============================================
    // SMOOTH SCROLL
    // ============================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (!target) return;

                e.preventDefault();
                gsap.to(window, {
                    scrollTo: { y: target, offsetY: 80 },
                    duration: 1.2,
                    ease: 'power3.inOut'
                });

                const navLinks = document.getElementById('nav-links');
                if (navLinks && navLinks.classList.contains('open')) {
                    navLinks.classList.remove('open');
                    document.getElementById('nav-burger').classList.remove('active');
                }
            });
        });
    }

    return {
        initHeroAnimation,
        initStatsAnimation,
        initServicesScroll,
        initTechnologyAnimations,
        initAboutAnimations,
        initTestimonialsAnimations,
        initPartnersAnimations,
        initGalleryAnimations,
        initContactAnimations,
        initFooterAnimations,
        initSectionReveals,
        initSmoothScroll,
        initSectionDividers,
        killAllTriggers
    };
})();
