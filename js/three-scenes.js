/* ============================================
   THREE-SCENES.JS — Cinematic WebGL Experience
   Dark theme · cyan energy · racing particle trails
   Cybernetic shield · energy rings · data streams
   ============================================ */

window.ArcherScenes = (function () {
    'use strict';

    const ST = (typeof THREE === 'undefined') ? null : THREE;
    const SH = window.ArcherShaders || null;
    if (!ST) return { initHeroScene: function () { }, lazyInitTechScene: function () { } };

    function disposeObject(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            Array.isArray(obj.material) ? obj.material.forEach(m => m.dispose()) : obj.material.dispose();
        }
    }
    function disposeScene(scene, renderer) {
        if (!scene) return;
        scene.traverse(disposeObject);
        if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
    }

    // ============================================
    // HERO SCENE — Cybernetic Energy Field
    // ============================================
    class HeroScene {
        constructor() {
            this.canvas = document.getElementById('hero-canvas');
            if (!this.canvas) return;

            this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
            this.clickForce = 0;
            this.clock = new ST.Clock();
            this.running = true;
            this._rafId = null;
            this._onMouse = null;
            this._onClick = null;
            this._onResize = null;
            this._onScroll = null;
            this.rings = [];
            this.energyLines = [];

            this.scene = new ST.Scene();
            this.scene.background = new ST.Color(0x050510);
            this.scene.fog = new ST.FogExp2(0x050510, 0.00025);

            this.camera = new ST.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 3000);
            this.camera.position.set(0, 0, 500);

            this.renderer = new ST.WebGLRenderer({
                canvas: this.canvas, alpha: false, antialias: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x050510, 1);

            this.cameraPath = {
                start: { x: 0, y: 0, z: 500 },
                mid: { x: -100, y: 50, z: 350 },
                end: { x: 0, y: -80, z: 200 }
            };

            this.createShaderParticleField();
            this.createCyberneticMesh();
            this.createEnergyRings();
            this.bindEvents();
            this._loop();
        }

        createShaderParticleField() {
            if (!SH) { this._createFallbackParticles(); return; }
            try {
                const count = 2500;
                const geo = new ST.BufferGeometry();
                const pos = new Float32Array(count * 3);
                const col = new Float32Array(count * 3);
                const sizes = new Float32Array(count);

                for (let i = 0; i < count; i++) {
                    const i3 = i * 3;
                    const r = 80 + Math.random() * 800;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    pos[i3] = Math.sin(phi) * Math.cos(theta) * r;
                    pos[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
                    pos[i3 + 2] = Math.cos(phi) * r;
                    const hue = 0.52 + Math.random() * 0.08;
                    const color = new ST.Color().setHSL(hue, 0.95, 0.45 + Math.random() * 0.35);
                    col[i3] = color.r; col[i3 + 1] = color.g; col[i3 + 2] = color.b;
                    sizes[i] = 0.6 + Math.random() * 4;
                }

                geo.setAttribute('position', new ST.BufferAttribute(pos, 3));
                geo.setAttribute('customColor', new ST.BufferAttribute(col, 3));
                geo.setAttribute('size', new ST.BufferAttribute(sizes, 1));

                this.shaderUniforms = {
                    uTime: { value: 0 },
                    uMouse: { value: new ST.Vector2(0, 0) },
                    uClickForce: { value: 0 },
                    uScroll: { value: 0 }
                };

                this.particleMaterial = new ST.ShaderMaterial({
                    uniforms: this.shaderUniforms,
                    vertexShader: SH.particleVert,
                    fragmentShader: SH.particleFrag,
                    transparent: true,
                    depthWrite: false,
                    blending: ST.AdditiveBlending
                });

                this.particleField = new ST.Points(geo, this.particleMaterial);
                this.scene.add(this.particleField);
            } catch (e) {
                console.warn('[Archer3D] Shader compilation failed, using fallback:', e.message);
                this._createFallbackParticles();
            }
        }

        _createFallbackParticles() {
            const count = 2500;
            const geo = new ST.BufferGeometry();
            const positions = new Float32Array(count * 3);
            const col = new Float32Array(count * 3);
            const c1 = new ST.Color(0x00d4ff), c2 = new ST.Color(0x0066ff), c3 = new ST.Color(0x33ddff);
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const r = 80 + Math.random() * 800;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                positions[i3] = Math.sin(phi) * Math.cos(theta) * r;
                positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
                positions[i3 + 2] = Math.cos(phi) * r;
                const choice = Math.random();
                const c = choice < 0.4 ? c1 : choice < 0.7 ? c2 : c3;
                col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
            }
            geo.setAttribute('position', new ST.BufferAttribute(positions, 3));
            geo.setAttribute('customColor', new ST.BufferAttribute(col, 3));
            this._fallbackPositions = positions;
            this.particleField = new ST.Points(geo, new ST.PointsMaterial({
                size: 2.8, vertexColors: true, transparent: true, opacity: 0,
                blending: ST.AdditiveBlending, depthWrite: false
            }));
            this.scene.add(this.particleField);
            this.shaderUniforms = null;
        }

        createCyberneticMesh() {
            const group = new ST.Group();

            const shieldGeo = new ST.IcosahedronGeometry(100, 3);
            const shieldWire = new ST.Mesh(shieldGeo, new ST.MeshBasicMaterial({
                color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.05
            }));
            shieldWire.position.z = -40;
            group.add(shieldWire);

            const shieldSolid = new ST.Mesh(
                new ST.IcosahedronGeometry(95, 2),
                new ST.MeshBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.03 })
            );
            shieldSolid.position.z = -40;
            group.add(shieldSolid);

            for (let i = 0; i < 4; i++) {
                const ringGeo = new ST.TorusGeometry(130 + i * 40, 0.5, 8, 140);
                const ring = new ST.Mesh(ringGeo, new ST.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0x00d4ff : 0x0066ff,
                    transparent: true, opacity: 0.03 + i * 0.012
                }));
                ring.rotation.x = Math.PI / 3 + i * 0.5;
                ring.rotation.y = i * 0.4;
                group.add(ring);
                this.rings.push(ring);
            }

            if (SH) {
                const lineGeo = new ST.BufferGeometry();
                const lineCount = 300;
                const linePts = new Float32Array(lineCount * 3 * 2);
                for (let i = 0; i < lineCount; i++) {
                    const a = (Math.random() - 0.5) * 1400;
                    const b = (Math.random() - 0.5) * 1400;
                    const c = (Math.random() - 0.5) * 1000;
                    linePts[i * 6] = a; linePts[i * 6 + 1] = b; linePts[i * 6 + 2] = c;
                    linePts[i * 6 + 3] = a + (Math.random() - 0.5) * 250;
                    linePts[i * 6 + 4] = b + (Math.random() - 0.5) * 250;
                    linePts[i * 6 + 5] = c + (Math.random() - 0.5) * 250;
                }
                lineGeo.setAttribute('position', new ST.BufferAttribute(linePts, 3));

                this.lineUniforms = { uTime: { value: 0 } };
                this.lineMesh = new ST.LineSegments(lineGeo, new ST.ShaderMaterial({
                    uniforms: this.lineUniforms,
                    vertexShader: SH.lineVert,
                    fragmentShader: SH.lineFrag,
                    transparent: true,
                    depthWrite: false,
                    blending: ST.AdditiveBlending
                }));
                group.add(this.lineMesh);
            }

            this.cyberGroup = group;
            this.scene.add(group);
        }

        createEnergyRings() {
            const group = new ST.Group();
            for (let i = 0; i < 5; i++) {
                const ringGeo = new ST.TorusGeometry(90 + i * 50, 0.3, 4, 100);
                const ring = new ST.Mesh(ringGeo, new ST.MeshBasicMaterial({
                    color: 0x00d4ff,
                    transparent: true,
                    opacity: 0.04,
                    blending: ST.AdditiveBlending,
                    depthWrite: false
                }));
                ring.rotation.x = Math.random() * Math.PI;
                ring.rotation.y = Math.random() * Math.PI;
                group.add(ring);
                this.energyLines.push(ring);
            }
            this.scene.add(group);
            this.energyGroup = group;
        }

        bindEvents() {
            this._onMouse = (e) => {
                this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
                this.mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
            };
            window.addEventListener('mousemove', this._onMouse, { passive: true });

            this._onClick = () => { this.clickForce = 1.5; };
            window.addEventListener('click', this._onClick);

            this._onResize = ArcherApp.debounce(() => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }, 250);
            window.addEventListener('resize', this._onResize);

            this._onScroll = ArcherApp.throttle(() => {
                const p = Math.min(window.scrollY / window.innerHeight, 1);
                this.canvas.style.opacity = 1 - p * 0.8;

                const cp = this.cameraPath;
                const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
                const midP = Math.min(p / 0.5, 1);
                this.camera.position.x = cp.start.x + (cp.mid.x - cp.start.x) * midP + (cp.end.x - cp.mid.x) * (Math.max(0, p - 0.5) * 2);
                this.camera.position.y = cp.start.y + (cp.mid.y - cp.start.y) * midP + (cp.end.y - cp.mid.y) * (Math.max(0, p - 0.5) * 2);
                this.camera.position.z = cp.start.z + (cp.mid.z - cp.start.z) * midP + (cp.end.z - cp.mid.z) * (Math.max(0, p - 0.5) * 2);
                this.camera.lookAt(0, 0, 0);

                if (this.shaderUniforms) this.shaderUniforms.uScroll.value = p;
            }, 16);
            window.addEventListener('scroll', this._onScroll, { passive: true });
        }

        _loop() {
            if (!this.running) return;
            this._rafId = requestAnimationFrame(() => this._loop());

            const t = this.clock.getElapsedTime();

            this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.025;
            this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.025;

            this.clickForce *= 0.9;
            if (this.clickForce < 0.001) this.clickForce = 0;

            if (this.shaderUniforms) {
                this.shaderUniforms.uTime.value = t;
                this.shaderUniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
                this.shaderUniforms.uClickForce.value = this.clickForce;
            }
            if (this.lineUniforms) {
                this.lineUniforms.uTime.value = t;
            }

            if (!this.shaderUniforms && this.particleField && this._fallbackPositions) {
                const pMat = this.particleField.material;
                if (pMat.opacity < 0.4) {
                    pMat.opacity = Math.min(0.4, pMat.opacity + 0.005);
                }
                const posArr = this.particleField.geometry.attributes.position.array;
                const mx = this.mouse.x * 900;
                const my = this.mouse.y * 900;
                for (let i = 0; i < posArr.length; i += 3) {
                    const px = this._fallbackPositions[i];
                    const py = this._fallbackPositions[i + 1];
                    const dx = mx - px, dy = my - py;
                    const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
                    const force = Math.min(1, 250 / dist) * 0.9;
                    posArr[i] = px + dx * force;
                    posArr[i + 1] = py + dy * force;
                }
                this.particleField.geometry.attributes.position.needsUpdate = true;
            } else if (this.shaderUniforms && this.particleField && this.particleField.material.opacity < 1) {
                this.particleField.material.opacity = Math.min(1, this.particleField.material.opacity + 0.01);
            }

            if (this.cyberGroup) {
                this.cyberGroup.rotation.y = t * 0.05;
                this.cyberGroup.rotation.x = Math.sin(t * 0.025) * 0.08;
            }
            if (this.rings) {
                this.rings.forEach((r, i) => {
                    r.rotation.z = t * (0.1 + i * 0.03);
                    r.rotation.x = Math.PI / 3 + Math.sin(t * 0.35 + i) * 0.25;
                });
            }
            if (this.energyGroup) {
                this.energyGroup.rotation.y = t * 0.03;
                this.energyGroup.rotation.z = Math.sin(t * 0.15) * 0.2;
            }
            if (this.energyLines) {
                this.energyLines.forEach((line, i) => {
                    line.rotation.x += 0.002 * (i + 1);
                    line.rotation.z += 0.0015 * (i + 1);
                    line.material.opacity = 0.02 + Math.sin(t * 0.5 + i) * 0.02;
                });
            }

            this.renderer.render(this.scene, this.camera);
        }

        destroy() {
            this.running = false;
            if (this._rafId) cancelAnimationFrame(this._rafId);
            if (this._onMouse) window.removeEventListener('mousemove', this._onMouse);
            if (this._onClick) window.removeEventListener('click', this._onClick);
            if (this._onResize) window.removeEventListener('resize', this._onResize);
            if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
            disposeScene(this.scene, this.renderer);
        }
    }

    // ============================================
    // TECHNOLOGY SCENE — Interactive Core
    // ============================================
    class TechScene {
        constructor(canvas, container) {
            this.canvas = canvas;
            this.container = container;
            this.isVisible = false;
            this.running = true;
            this.mouse = { x: 0, y: 0 };
            this.clock = new ST.Clock();
            this._rafId = null;
            this._onMouse = null;
            this._observer = null;
            this._resizeObserver = null;

            this.scene = new ST.Scene();

            const rect = container.getBoundingClientRect();
            this.camera = new ST.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000);
            this.camera.position.set(0, 0, 300);

            this.renderer = new ST.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
            this.renderer.setSize(rect.width, rect.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            this.createObject();
            this.addLights();
            this.bindEvents();
            this.observeVisibility();
            this._loop();
        }

        createObject() {
            const group = new ST.Group();

            const core = new ST.Mesh(
                new ST.IcosahedronGeometry(60, 3),
                new ST.MeshPhongMaterial({
                    color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.35,
                    emissive: 0x00d4ff, emissiveIntensity: 0.2
                })
            );
            group.add(core);

            const inner = new ST.Mesh(
                new ST.IcosahedronGeometry(40, 2),
                new ST.MeshPhongMaterial({
                    color: 0x0066ff, transparent: true, opacity: 0.2,
                    emissive: 0x0066ff, emissiveIntensity: 0.25
                })
            );
            group.add(inner);

            const ringGeo = new ST.TorusGeometry(80, 1, 16, 120);
            [Math.PI / 3, -Math.PI / 4, Math.PI / 2].forEach((rot, i) => {
                const ring = new ST.Mesh(
                    ringGeo.clone(),
                    new ST.MeshBasicMaterial({
                        color: i === 0 ? 0x00d4ff : 0x0066ff,
                        transparent: true,
                        opacity: 0.25,
                        blending: ST.AdditiveBlending
                    })
                );
                ring.rotation.x = rot;
                if (i === 2) { ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI / 5; }
                group.add(ring);
                this['ring' + (i + 1)] = ring;
            });

            const oGeo = new ST.BufferGeometry();
            const oPos = new Float32Array(36 * 3);
            for (let i = 0; i < 36; i++) {
                const a = (i / 36) * Math.PI * 2;
                const r = 90 + Math.random() * 20;
                oPos[i * 3] = Math.cos(a) * r;
                oPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
                oPos[i * 3 + 2] = Math.sin(a) * r;
            }
            oGeo.setAttribute('position', new ST.BufferAttribute(oPos, 3));
            this.orbitParticles = new ST.Points(oGeo, new ST.PointsMaterial({
                color: 0x00d4ff, size: 3, transparent: true, opacity: 0.5,
                blending: ST.AdditiveBlending, depthWrite: false
            }));
            group.add(this.orbitParticles);

            this.objectGroup = group;
            this.scene.add(group);
        }

        addLights() {
            this.scene.add(new ST.AmbientLight(0xffffff, 0.7));
            const dir = new ST.DirectionalLight(0x00d4ff, 0.6);
            dir.position.set(100, 100, 100);
            this.scene.add(dir);
            const pt = new ST.PointLight(0x0066ff, 0.5, 400);
            pt.position.set(-100, -50, 100);
            this.scene.add(pt);
        }

        bindEvents() {
            this._onMouse = (e) => {
                const r = this.container.getBoundingClientRect();
                this.mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
                this.mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
            };
            this.container.addEventListener('mousemove', this._onMouse, { passive: true });

            this._resizeObserver = new ResizeObserver(ArcherApp.debounce(() => {
                const r = this.container.getBoundingClientRect();
                this.camera.aspect = r.width / r.height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(r.width, r.height);
            }, 250));
            this._resizeObserver.observe(this.container);
        }

        observeVisibility() {
            this._observer = new IntersectionObserver(
                (entries) => { entries.forEach(e => { this.isVisible = e.isIntersecting; }); },
                { threshold: 0.1 }
            );
            this._observer.observe(this.container);
        }

        _loop() {
            if (!this.running) return;
            this._rafId = requestAnimationFrame(() => this._loop());
            if (!this.isVisible) return;

            const t = this.clock.getElapsedTime();
            const core = this.objectGroup.children[0];
            const inner = this.objectGroup.children[1];
            if (core) { core.rotation.y = t * 0.25; core.rotation.x = Math.sin(t * 0.12) * 0.25; }
            if (inner) { inner.rotation.y = -t * 0.35; inner.rotation.z = t * 0.18; }
            if (this.ring1) this.ring1.rotation.z = t * 0.18;
            if (this.ring2) this.ring2.rotation.z = -t * 0.14;
            if (this.ring3) this.ring3.rotation.y = t * 0.12;
            if (this.orbitParticles) {
                this.orbitParticles.rotation.y = t * 0.1;
                this.orbitParticles.material.opacity = 0.35 + Math.sin(t * 0.5) * 0.15;
            }

            this.objectGroup.rotation.y += (this.mouse.x * 0.6 - this.objectGroup.rotation.y) * 0.04;
            this.objectGroup.rotation.x += (-this.mouse.y * 0.35 - this.objectGroup.rotation.x) * 0.04;

            this.renderer.render(this.scene, this.camera);
        }

        destroy() {
            this.running = false;
            if (this._rafId) cancelAnimationFrame(this._rafId);
            if (this._onMouse) this.container.removeEventListener('mousemove', this._onMouse);
            if (this._resizeObserver) this._resizeObserver.disconnect();
            if (this._observer) this._observer.disconnect();
            disposeScene(this.scene, this.renderer);
        }
    }

    // ============================================
    // PRELOADER SCENE
    // ============================================
    class PreloaderScene {
        constructor() {
            this.canvas = document.getElementById('preloader-canvas');
            if (!this.canvas) return;
            this.progress = 0;
            this.running = true;
            this.clock = new ST.Clock();
            this._rafId = null;

            this.scene = new ST.Scene();
            this.camera = new ST.PerspectiveCamera(50, 1, 0.1, 1000);
            this.camera.position.set(0, 0, 200);

            this.renderer = new ST.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
            this.renderer.setSize(400, 400);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            this.createShieldParticles();
            this._loop();
        }

        createShieldParticles() {
            const count = 500;
            const geo = new ST.BufferGeometry();
            const pos = new Float32Array(count * 3);
            const tar = new Float32Array(count * 3);
            const shieldGeo = new ST.IcosahedronGeometry(60, 3);
            const sp = shieldGeo.attributes.position.array;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                pos[i3] = (Math.random() - 0.5) * 500;
                pos[i3 + 1] = (Math.random() - 0.5) * 500;
                pos[i3 + 2] = (Math.random() - 0.5) * 500;
                const ti = (i % (sp.length / 3)) * 3;
                tar[i3] = sp[ti] || 0; tar[i3 + 1] = sp[ti + 1] || 0; tar[i3 + 2] = sp[ti + 2] || 0;
            }
            geo.setAttribute('position', new ST.BufferAttribute(pos, 3));
            this.targets = tar;
            this.startPositions = new Float32Array(pos);

            this.particles = new ST.Points(geo, new ST.PointsMaterial({
                color: 0x00d4ff, size: 2.5, transparent: true, opacity: 0.7,
                blending: ST.AdditiveBlending, depthWrite: false
            }));
            this.scene.add(this.particles);
        }

        setProgress(progress) {
            this.progress = progress;
            const pos = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < pos.length; i += 3) {
                const t = Math.min(progress * 1.5, 1);
                const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                pos[i] = this.startPositions[i] + (this.targets[i] - this.startPositions[i]) * ease;
                pos[i + 1] = this.startPositions[i + 1] + (this.targets[i + 1] - this.startPositions[i + 1]) * ease;
                pos[i + 2] = this.startPositions[i + 2] + (this.targets[i + 2] - this.startPositions[i + 2]) * ease;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        _loop() {
            if (!this.running) return;
            this._rafId = requestAnimationFrame(() => this._loop());
            const t = this.clock.getElapsedTime();
            this.particles.rotation.y = this.progress >= 1 ? t * 1 : t * 0.35;
            this.particles.rotation.x = Math.sin(t * 0.3) * (this.progress >= 1 ? 0.3 : 0.1);
            if (this.progress >= 1) {
                const s = 1 + Math.sin(t * 4) * 0.06;
                this.particles.scale.set(s, s, s);
                this.particles.material.opacity = 0.5 + Math.sin(t * 2) * 0.2;
            }
            this.renderer.render(this.scene, this.camera);
        }

        destroy() {
            this.running = false;
            if (this._rafId) cancelAnimationFrame(this._rafId);
            disposeScene(this.scene, this.renderer);
        }
    }

    // ============================================
    // EXPORT
    // ============================================
    let heroScene = null, techScene = null;

    function initHeroScene() {
        if (heroScene) return;
        heroScene = new HeroScene();
    }

    function lazyInitTechScene(selector) {
        if (techScene) return;
        const container = document.querySelector(selector);
        if (!container) return;
        const canvas = container.querySelector('canvas');
        if (!canvas) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    try {
                        techScene = new TechScene(canvas, container);
                    } catch (e) {
                        console.warn('[Archer3D] Tech scene creation failed:', e.message);
                    }
                    observer.disconnect();
                }
            });
        }, { threshold: 0 });
        observer.observe(container);
    }

    return { initHeroScene, lazyInitTechScene, __classes: { HeroScene, TechScene, PreloaderScene } };
})();
