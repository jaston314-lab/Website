/* ============================================
   SHADERS.JS - Custom GLSL Vertex & Fragment Shaders
   Energy beams · speed trails · cyber particles
   Neon cyan · pulse blue · digital distortion
   ============================================ */
window.ArcherShaders = {
    particleVert: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uClickForce;
        uniform float uScroll;

        void main() {
            vec3 pos = position;

            float distToCursor = distance(pos.xy, uMouse * 800.0);
            float gravity = smoothstep(600.0, 0.0, distToCursor) * 0.2;
            vec2 cursorDir = normalize(uMouse * 800.0 - pos.xy);
            pos.xy += cursorDir * gravity * 250.0;

            float wave = sin(pos.x * 0.01 + uTime * 0.8) * cos(pos.y * 0.008 + uTime * 0.6) * 35.0;
            float wave2 = cos(pos.z * 0.005 + uTime * 0.4) * sin(pos.x * 0.012 + uTime) * 20.0;
            pos.z += wave + wave2;

            float ripple = exp(-distToCursor * 0.003) * uClickForce * 250.0;
            pos.z += ripple * (1.0 - abs(sin(distToCursor * 0.008 - uTime * 4.0)));

            float shieldRadius = 160.0;
            float toShield = length(pos) - shieldRadius;
            float convergence = smoothstep(250.0, 0.0, abs(toShield)) * 0.025;
            vec3 shieldNormal = normalize(pos);
            pos -= shieldNormal * toShield * convergence;

            float energyPulse = sin(uTime * 0.5) * 15.0;
            pos += shieldNormal * energyPulse * smoothstep(50.0, 0.0, abs(toShield));

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;

            vColor = customColor;
            vAlpha = 1.0 - smoothstep(0.0, 600.0, distToCursor) * 0.25;
        }
    `,

    particleFrag: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float alpha = 1.0 - smoothstep(0.0, 1.0, d);
            alpha = pow(alpha, 1.5);

            float glow = exp(-d * 2.5) * 0.7;
            alpha += glow;

            float core = exp(-d * 10.0) * 0.9;
            alpha += core;

            alpha *= vAlpha * 0.8;

            if (alpha < 0.01) discard;

            vec3 cyanTint = vec3(0.0, 0.831, 1.0);
            vec3 blueTint = vec3(0.0, 0.4, 1.0);
            vec3 color = mix(vColor, cyanTint, glow * 0.6);
            color = mix(color, blueTint, core * 0.3);

            gl_FragColor = vec4(color, alpha);
        }
    `,

    lineVert: `
        varying float vAlpha;
        varying float vPulse;
        uniform float uTime;

        void main() {
            vec3 pos = position;
            float wave = sin(pos.x * 0.02 + uTime * 2.0) * cos(pos.y * 0.015 + uTime * 1.2) * 20.0;
            float wave2 = cos(pos.z * 0.01 + uTime * 0.7) * 12.0;
            pos.z += wave + wave2;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = 0.12 + sin(pos.x * 0.05 + uTime * 1.5) * 0.06;
            vPulse = 0.5 + sin(pos.y * 0.03 + uTime * 2.5) * 0.5;
        }
    `,

    lineFrag: `
        varying float vAlpha;
        varying float vPulse;

        void main() {
            if (vAlpha < 0.01) discard;
            float pulse = 0.5 + sin(gl_FragCoord.x * 0.015 + vPulse * 6.0) * 0.5;
            vec3 cyan = vec3(0.0, 0.831, 1.0);
            vec3 blue = vec3(0.0, 0.4, 1.0);
            vec3 color = mix(blue, cyan, vPulse);
            gl_FragColor = vec4(color, vAlpha * (0.4 + pulse * 0.6));
        }
    `,

    energyBeamVert: `
        varying float vAlpha;
        varying float vProgress;
        uniform float uTime;
        uniform float uProgress;

        void main() {
            vec3 pos = position;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = 0.15 + sin(pos.x * 0.03 + uTime * 3.0) * 0.1;
            vProgress = uProgress;
        }
    `,

    energyBeamFrag: `
        varying float vAlpha;
        varying float vProgress;

        void main() {
            float beam = exp(-abs(gl_PointCoord.y - 0.5) * 8.0);
            float pulse = 0.7 + sin(gl_PointCoord.y * 20.0 + vProgress * 10.0) * 0.3;
            float alpha = beam * vAlpha * pulse;
            if (alpha < 0.01) discard;
            vec3 color = vec3(0.0, 0.831, 1.0);
            gl_FragColor = vec4(color, alpha);
        }
    `,

    glitchFrag: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uIntensity;
        uniform vec2 uResolution;

        float random(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution;
            vec4 color = texture2D(uTexture, uv);

            float glitchLine = step(0.92, random(vec2(floor(uv.y * 80.0), uTime * 0.2)));
            float glitchBlock = step(0.97, random(vec2(floor(uv.y * 15.0), floor(uTime * 0.3))));

            float displacement = (glitchLine * 0.03 + glitchBlock * 0.06) * uIntensity;
            vec2 glitchUV = uv + vec2(displacement * sin(uv.y * 200.0), 0.0);

            float r = texture2D(uTexture, glitchUV + vec2(displacement * 0.5, 0.0)).r;
            float g = texture2D(uTexture, glitchUV).g;
            float b = texture2D(uTexture, glitchUV - vec2(displacement * 0.5, 0.0)).b;

            vec4 glitched = mix(color, vec4(r, g, b, 1.0), glitchLine * 0.7 + glitchBlock * 1.0);

            float scanline = sin(uv.y * uResolution.y * 0.7) * 0.03 + 0.97;
            glitched.rgb *= scanline;

            float vignette = 1.0 - length(uv - 0.5) * 0.4;
            glitched.rgb *= vignette;

            gl_FragColor = glitched;
        }
    `
};
