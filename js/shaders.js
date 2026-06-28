/* ============================================
   SHADERS.JS - Custom GLSL Vertex & Fragment Shaders
   Particle glow, digital glitch, holographic scanlines.
   ============================================ */
window.ArcherShaders = {
    // Cybernetic particle vertex shader with cursor gravity & wave modulation
    particleVert: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform vec2 uMouse;       // Normalised cursor position (-1 to 1)
        uniform float uClickForce; // 0 -> 1 ripple on click
        uniform float uScroll;     // Scroll progress for camera path

        void main() {
            vec3 pos = position;

            // Cursor gravity: particles pull toward cursor
            float distToCursor = distance(pos.xy, uMouse * 800.0);
            float gravity = smoothstep(600.0, 0.0, distToCursor) * 0.15;
            vec2 cursorDir = normalize(uMouse * 800.0 - pos.xy);
            pos.xy += cursorDir * gravity * 200.0;

            // Wave modulation
            float wave = sin(pos.x * 0.01 + uTime) * cos(pos.y * 0.008 + uTime * 0.7) * 30.0;
            pos.z += wave;

            // Click ripple
            float ripple = exp(-distToCursor * 0.004) * uClickForce * 200.0;
            pos.z += ripple * (1.0 - abs(sin(distToCursor * 0.01 - uTime * 3.0)));

            // Shield convergence: particles drift toward icosahedron surface
            float shieldRadius = 140.0;
            float toShield = length(pos) - shieldRadius;
            float convergence = smoothstep(200.0, 0.0, abs(toShield)) * 0.02;
            vec3 shieldNormal = normalize(pos);
            pos -= shieldNormal * toShield * convergence;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;

            vColor = customColor;
            vAlpha = 1.0 - smoothstep(0.0, 600.0, distToCursor) * 0.3;
        }
    `,

    // Particle fragment shader with radial glow
    particleFrag: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float alpha = 1.0 - smoothstep(0.0, 1.0, d);
            alpha = pow(alpha, 1.5);

            // Outer glow ring
            float glow = exp(-d * 3.0) * 0.6;
            alpha += glow;

            // Sharp core
            float core = exp(-d * 8.0) * 0.8;
            alpha += core;

            alpha *= vAlpha * 0.75;

            if (alpha < 0.01) discard;

            // Cyan-blue tint shift based on distance from center
            vec3 color = mix(vColor, vec3(0.031, 0.239, 0.6), glow * 0.5);

            gl_FragColor = vec4(color, alpha);
        }
    `,

    // Data line vertex shader for cybernetic mesh connections
    lineVert: `
        varying float vAlpha;
        uniform float uTime;

        void main() {
            vec3 pos = position;
            float wave = sin(pos.x * 0.02 + uTime * 1.5) * cos(pos.y * 0.015 + uTime) * 15.0;
            pos.z += wave;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = 0.15 + sin(pos.x * 0.05 + uTime) * 0.05;
        }
    `,

    // Line fragment shader
    lineFrag: `
        varying float vAlpha;

        void main() {
            if (vAlpha < 0.01) discard;
            float pulse = 0.6 + sin(gl_FragCoord.x * 0.02) * 0.4;
            gl_FragColor = vec4(0.031, 0.239, 0.6, vAlpha * pulse);
        }
    `,

    // Digital glitch post-process fragment shader (applied to fullscreen quad)
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

            // Scanline displacement
            float glitchLine = step(0.92, random(vec2(floor(uv.y * 80.0), uTime * 0.2)));
            float glitchBlock = step(0.97, random(vec2(floor(uv.y * 15.0), floor(uTime * 0.3))));

            float displacement = (glitchLine * 0.03 + glitchBlock * 0.06) * uIntensity;
            vec2 glitchUV = uv + vec2(displacement * sin(uv.y * 200.0), 0.0);

            // RGB split on glitch blocks
            float r = texture2D(uTexture, glitchUV + vec2(displacement * 0.5, 0.0)).r;
            float g = texture2D(uTexture, glitchUV).g;
            float b = texture2D(uTexture, glitchUV - vec2(displacement * 0.5, 0.0)).b;

            vec4 glitched = mix(color, vec4(r, g, b, 1.0), glitchLine * 0.7 + glitchBlock * 1.0);

            // Subtle scanlines across entire frame
            float scanline = sin(uv.y * uResolution.y * 0.7) * 0.03 + 0.97;
            glitched.rgb *= scanline;

            // Vignette
            float vignette = 1.0 - length(uv - 0.5) * 0.4;
            glitched.rgb *= vignette;

            gl_FragColor = glitched;
        }
    `
};
