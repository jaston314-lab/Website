# Archer Security - Website Transformation Design Concept

## Current State Analysis

The current archersecurity.co.uk is a **Wix-hosted static corporate site** with:
- Traditional header/nav with dropdown menus
- Standard hero image carousel (vans, CCTV products, screens)
- Card-based service listings (Burglar Alarms, CCTV, Access Control, Panic Alarms, Remote Support, Meet the Team)
- Static image gallery with lightbox
- Partner logo row (Pyronix, Orisec, Hikvision, Takex, Optex, Paxton)
- Basic contact form with Google Maps
- Accreditation badges (SSAIB, IPAF, ICO, Hikvision VASP)
- Testimonial quote section
- Standard footer with business hours and social links

**Problem:** Feels like every other local trades website. No personality, no energy, no reason to remember the brand.

---

## Target Vision

A **cinematic, scroll-driven immersive experience** that positions Archer Security as a cutting-edge technology company. Inspired by the interactivity and energy of landonorris.com but adapted for the security industry.

**Core Principle:** Security is about protection through technology. The website itself should feel like a piece of advanced technology.

---

## Visual Identity

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Primary Background | Deep Space Black | `#0a0a0f` |
| Secondary Background | Midnight Navy | `#0d1117` |
| Accent Primary | Electric Cyan | `#00d4ff` |
| Accent Secondary | Pulse Blue | `#0066ff` |
| Accent Highlight | Alert Amber | `#ff6b00` |
| Text Primary | Pure White | `#ffffff` |
| Text Secondary | Steel Grey | `#8892a4` |
| Glass Surface | Frosted Glass | `rgba(255,255,255,0.03)` |

### Typography
- **Display:** `Clash Display` or `Space Grotesk` (bold, geometric, techy)
- **Body:** `Inter` or `General Sans` (clean, modern readability)
- **Mono Accent:** `JetBrains Mono` (for stats, numbers, technical data)

### Design Language
- Angular/geometric clip-paths and masks (security shield motifs)
- Glassmorphism cards with subtle border glow
- Particle systems and wireframe 3D backgrounds
- Oversized typography (200px+ display text)
- Horizontal scroll sections for service showcases
- Custom cursor with magnetic hover effects

---

## Animation Strategy - The User Journey

### Phase 1: PRELOADER (0-3 seconds)
**Goal:** Set the tone immediately. This is not a normal security company website.

- Three.js wireframe **security shield** assembles from particles
- Particles converge and lock into formation
- "ARCHER SECURITY" text glitches in with a digital decode effect
- Shield pulses once with cyan energy, then shatters outward
- Transition: Iris wipe from center outward reveals the hero

### Phase 2: HERO SECTION
**Goal:** Maximum impact. Communicate scale and capability in 3 seconds.

- Full-viewport Three.js scene: floating wireframe security devices (cameras, sensors, keypads) orbit slowly in 3D space
- Massive headline: **"WE PROTECT WHAT MATTERS"** - words stagger in from below with GSAP
- Subtext fades in with a typewriter/digital decode effect
- Mouse parallax: 3D scene responds to cursor position (tilt/rotate)
- Scroll indicator: animated chevron pulse at bottom
- Navigation: minimal, fixed, with glass blur background

### Phase 3: STATS COUNTER BAR
**Goal:** Establish credibility with hard numbers.

- Horizontal band with 4 key stats: Years Active, Installations, Response Time, Coverage Area
- Numbers count up rapidly from 0 using GSAP (scroll-triggered)
- Each stat separated by animated vertical lines that draw themselves
- Subtle particle trail follows the horizontal scroll

### Phase 4: SERVICES HORIZONTAL SCROLL
**Goal:** Showcase services in a memorable, non-traditional way.

- Pinned section: page scrolls vertically but content moves horizontally (GSAP ScrollTrigger)
- Each service is a full-viewport card with:
  - Large background image with parallax depth
  - Service name in oversized type that slides in from the side
  - Brief description with staggered word reveal
  - Icon/3D model that rotates on approach
  - CTA button with magnetic hover effect
- Progress bar at top shows horizontal scroll position
- Services: Burglar Alarms, CCTV, Access Control, Fire Alarms, Electronic Gates, Network Installation, Panic Alarms, Commercial Security

### Phase 5: 3D INTERACTIVE SHOWCASE
**Goal:** Demonstrate technical capability through interaction.

- Three.js scene: 3D model of a security camera or alarm panel
- Scroll controls rotation and zoom of the model
- Hotspot annotations appear at specific scroll positions
- Wireframe-to-solid material transition as user scrolls
- Ambient particles flow around the model
- "Explore Our Technology" CTA with pulsing glow

### Phase 6: ABOUT / MISSION
**Goal:** Human connection and trust building.

- Split layout: left side has parallax-stacked team/installation photos
- Right side: mission text with word-by-word GSAP reveal
- Key phrases highlighted in cyan as they enter viewport
- Floating accreditation badges (SSAIB, IPAF, ICO) drift with subtle parallax
- Background: subtle grid pattern that draws itself on scroll

### Phase 7: TESTIMONIALS
**Goal:** Social proof with dramatic presentation.

- Full-viewport quotes that transition on scroll (GSAP ScrollTrigger pin)
- Massive quotation marks as decorative elements
- Quote text reveals word-by-word
- Client name and context fade in after quote completes
- Background shifts color subtly between testimonials
- Star ratings animate in with stagger

### Phase 8: PARTNERS MARQUEE
**Goal:** Show industry relationships and credibility.

- Infinite horizontal scrolling logo marquee (two rows, opposite directions)
- Logos rendered in monochrome, colorize on hover with glow effect
- Section header with "TRUSTED TECHNOLOGY PARTNERS" in mono font
- Subtle scan-line effect over the marquee

### Phase 9: CONTACT / CTA
**Goal:** Convert. Make the action feel important.

- Dramatic "LET'S SECURE YOUR WORLD" headline with text scramble effect
- Contact form with glassmorphism styling
- Form fields animate in with stagger on scroll
- Submit button has particle burst effect on click
- Left side: animated map or 3D location pin
- Phone number in large display type with hover glow

### Phase 10: FOOTER
**Goal:** Clean exit with brand reinforcement.

- Minimal layout with animated SVG line drawing of Archer logo
- Social icons with magnetic hover and color shift
- Gradient line that draws itself across the top
- Copyright and legal in small mono text
- "Back to top" with smooth scroll and arrow animation

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Markup | HTML5 Semantic | Structure and accessibility |
| Styling | CSS3 (Custom Properties, Grid, Flexbox) | Layout, theming, responsive |
| Animation | GSAP 3 + ScrollTrigger, ScrollToPlugin | Scroll-driven animations |
| 3D Graphics | Three.js | WebGL scenes, particles, models |
| Build | Vite (optional) | Dev server, bundling |
| Fonts | Google Fonts / Custom | Typography |

---

## Responsive Strategy

- **Desktop (1440px+):** Full experience with all 3D, animations, horizontal scroll
- **Laptop (1024px-1439px):** Scaled 3D, all animations, adjusted layouts
- **Tablet (768px-1023px):** Simplified 3D (2D fallback), vertical scroll replaces horizontal, reduced particles
- **Mobile (< 768px):** No Three.js (CSS gradient/pattern fallback), simplified GSAP, stacked layout, touch-optimized

---

## Performance Considerations

- Lazy-load Three.js scenes (Intersection Observer)
- Use `will-change` and `transform` for GPU-accelerated animations
- Reduce particle count on mobile/low-power devices
- Use `prefers-reduced-motion` media query to disable animations
- Compress all textures and 3D models
- Use `requestAnimationFrame` for all JS animations
- Preload critical fonts and hero assets
