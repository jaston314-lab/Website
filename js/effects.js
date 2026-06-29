/* ============================================
   EFFECTS.JS — Interaction Engine
   Mouse trail · 3D tilt · energy burst · ripples
   ambient particles · speed lines · magnetic depth
   ============================================ */

window.ArcherEffects = (function () {
    'use strict';

    const rafIds = new Set();
    const listeners = [];
    let reduceMotion = false;

    function on(target, event, handler, options) {
        target.addEventListener(event, handler, options);
        listeners.push({ target, event, handler, options });
    }

    function destroyAll() {
        rafIds.forEach(id => cancelAnimationFrame(id));
        rafIds.clear();
        listeners.forEach(({ target, event, handler, options }) => {
            target.removeEventListener(event, handler, options);
        });
        listeners.length = 0;
    }

    window.addEventListener('pagehide', destroyAll);
    window.addEventListener('beforeunload', destroyAll);

    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // MOUSE TRAIL PARTICLES (Canvas-based)
    // ============================================
    function initMouseTrail() {
        if (reduceMotion) return;
        const canvas = document.getElementById('trail-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width, height;
        const particles = [];
        const maxParticles = 60;
        let mx = -100, my = -100;
        let lastEmit = 0;

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }
        resize();
        on(window, 'resize', resize);

        on(document, 'mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
            const now = performance.now();
            if (now - lastEmit > 16 && particles.length < maxParticles) {
                particles.push({
                    x: mx,
                    y: my,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1,
                    size: Math.random() * 2 + 1
                });
                lastEmit = now;
            }
        }, { passive: true });

        function draw() {
            ctx.clearRect(0, 0, width, height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                p.size *= 0.995;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 212, 255, ${p.life * 0.4})`;
                ctx.fill();
                ctx.shadowColor = 'rgba(0, 212, 255, 0.3)';
                ctx.shadowBlur = 6 * p.life;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            const rid = requestAnimationFrame(draw);
            rafIds.add(rid);
        }
        draw();
    }

    // ============================================
    // 3D TILT EFFECT
    // ============================================
    function initTiltEffect() {
        if (reduceMotion) return;
        const tiltEls = document.querySelectorAll('[data-tilt]');
        if (!tiltEls.length) return;

        tiltEls.forEach(el => {
            let bounds;
            let rafPending = false;
            let targetX = 0, targetY = 0;
            let currentX = 0, currentY = 0;

            function updateBounds() {
                bounds = el.getBoundingClientRect();
            }

            on(el, 'mouseenter', () => {
                updateBounds();
                el.style.transition = 'transform 0.1s ease-out, box-shadow 0.4s ease';
            });

            on(el, 'mousemove', (e) => {
                if (!bounds) return;
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const percentX = (e.clientX - centerX) / (bounds.width / 2);
                const percentY = (e.clientY - centerY) / (bounds.height / 2);
                targetX = percentY * -8;
                targetY = percentX * 8;

                if (!rafPending) {
                    rafPending = true;
                    const rid = requestAnimationFrame(() => {
                        currentX += (targetX - currentX) * 0.15;
                        currentY += (targetY - currentY) * 0.15;
                        el.style.transform = `perspective(1200px) rotateX(${currentX}deg) rotateY(${currentY}deg) translateY(-4px)`;
                        el.style.boxShadow = `${-currentY * 1.5}px ${-currentX * 1.5}px 48px rgba(0,0,0,0.5), 0 0 30px rgba(0,212,255,${0.06 + Math.abs(currentX) * 0.004 + Math.abs(currentY) * 0.004})`;
                        rafPending = false;
                    });
                    rafIds.add(rid);
                }
            });

            on(el, 'mouseleave', () => {
                el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease';
                el.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateY(0)';
                el.style.boxShadow = '';
                bounds = null;
                currentX = 0;
                currentY = 0;
                targetX = 0;
                targetY = 0;
            });
        });
    }

    // ============================================
    // CLICK ENERGY BURST
    // ============================================
    function initEnergyBurst() {
        if (reduceMotion) return;
        const container = document.getElementById('energy-burst-container');
        if (!container) return;

        on(document, 'click', (e) => {
            const count = 12;
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'energy-burst-particle';
                const angle = (Math.PI * 2 * i) / count;
                const distance = 30 + Math.random() * 50;
                const bx = Math.cos(angle) * distance;
                const by = Math.sin(angle) * distance;
                particle.style.cssText = `
                    left: ${e.clientX}px;
                    top: ${e.clientY}px;
                    --bx: ${bx}px;
                    --by: ${by}px;
                    animation-delay: ${Math.random() * 0.1}s;
                `;
                fragment.appendChild(particle);
            }

            container.appendChild(fragment);
            setTimeout(() => {
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }, 800);
        });
    }

    // ============================================
    // CLICK RIPPLE EFFECT
    // ============================================
    function initClickRipple() {
        if (reduceMotion) return;

        on(document, 'click', (e) => {
            if (e.target.closest('button, a, [data-hover]')) {
                const ripple = document.createElement('div');
                ripple.className = 'ripple';
                ripple.style.left = e.clientX + 'px';
                ripple.style.top = e.clientY + 'px';
                document.body.appendChild(ripple);
                setTimeout(() => ripple.remove(), 800);
            }
        });
    }

    // ============================================
    // AMBIENT FLOATING PARTICLES
    // ============================================
    function initAmbientParticles() {
        if (reduceMotion) return;
        const count = 8;
        const colors = ['rgba(0,212,255,0.04)', 'rgba(0,102,255,0.03)', 'rgba(0,212,255,0.05)'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'ambient-particle';
            particle.style.cssText = `
                width: ${100 + Math.random() * 300}px;
                height: ${100 + Math.random() * 300}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-delay: ${Math.random() * 8}s;
                animation-duration: ${8 + Math.random() * 12}s;
                filter: blur(${40 + Math.random() * 60}px);
            `;
            document.body.appendChild(particle);
        }
    }

    // ============================================
    // SPEED LINES (Hero Section)
    // ============================================
    function initSpeedLines() {
        if (reduceMotion) return;
        const hero = document.getElementById('hero');
        if (!hero) return;

        const container = document.createElement('div');
        container.className = 'hero__speed-lines';
        hero.appendChild(container);

        const lineCount = 6;
        for (let i = 0; i < lineCount; i++) {
            const line = document.createElement('div');
            line.className = 'hero__speed-line';
            line.style.cssText = `
                top: ${10 + Math.random() * 80}%;
                animation-delay: ${Math.random() * 3}s;
                animation-duration: ${2 + Math.random() * 3}s;
                width: ${150 + Math.random() * 350}px;
            `;
            container.appendChild(line);
        }
    }

    // ============================================
    // MAGNETIC DEPTH (elements pull toward cursor)
    // ============================================
    function initMagneticDepth() {
        if (reduceMotion) return;
        const els = document.querySelectorAll('.hero__image, .about__image, .gallery__item');

        on(document, 'mousemove', (e) => {
            els.forEach(el => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
                const maxDist = 300;
                if (dist < maxDist) {
                    const pull = (1 - dist / maxDist) * 0.5;
                    const ox = (e.clientX - cx) * pull * 0.05;
                    const oy = (e.clientY - cy) * pull * 0.05;
                    el.style.transform = `translate(${ox}px, ${oy}px)`;
                    el.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                } else {
                    el.style.transform = '';
                }
            });
        }, { passive: true });
    }

    // ============================================
    // SECTION ENERGY LINE REVEAL
    // ============================================
    function initSectionDividers() {
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            if (section.querySelector('.section-divider')) return;
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            divider.setAttribute('aria-hidden', 'true');
            section.insertAdjacentElement('afterend', divider);
        });
    }

    // ============================================
    // INIT ALL
    // ============================================
    function initAll() {
        if (reduceMotion) return;
        initMouseTrail();
        initTiltEffect();
        initEnergyBurst();
        initClickRipple();
        initAmbientParticles();
        initSpeedLines();
        initMagneticDepth();
        initSectionDividers();
    }

    return {
        initAll,
        initMouseTrail,
        initTiltEffect,
        initEnergyBurst,
        initClickRipple,
        initAmbientParticles,
        initSpeedLines,
        initMagneticDepth,
        initSectionDividers,
        destroyAll
    };
})();
