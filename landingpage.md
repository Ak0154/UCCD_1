# OmniResol — Landing Page Spec
### For: Hemant (React Frontend) + AI Agent prompt
### Product: OmniResol by UCCD team

---

## Vision
A dark, cinematic, scroll-driven landing page that tells the story of OmniResol — from a customer complaint being sent across social media, to AI agents processing it, to resolution. Premium feel. No generic layouts.

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#050508` |
| Surface | `#0D0D14` |
| Accent Primary | `#6C63FF` (electric violet) |
| Accent Secondary | `#00F5C4` (cyan-mint) |
| Text Primary | `#F0F0FF` |
| Text Muted | `#6B7280` |
| Font Display | `Clash Display` or `Syne` (Google Fonts) |
| Font Body | `DM Sans` |
| Border | `rgba(108, 99, 255, 0.15)` |

---

## Assets You Need to Create

### 1. Hero Logo / 3D Text — "OmniResol"
**Tool:** Spline (spline.design) — free, browser based  
**What to make:**
- 3D extruded text "OmniResol"
- Material: dark chrome / obsidian with violet edge glow
- Subtle floating/bobbing animation loop
- Export as: embedded Spline scene URL OR record as `.webm` video loop

**Prompt for Spline AI (if available):**
> "3D extruded text 'OmniResol', dark metallic chrome material, electric violet rim lighting, floating slowly on dark background, cinematic"

**Alternative:** Use [Rive.app](https://rive.app) to animate flat SVG text with glow effect

---

### 2. Phone Hand Illustrations — 4 channels
**Tool:** Midjourney / Adobe Firefly / DALL-E  
**What to make:** 4 separate images:
- Hand holding phone showing Instagram DM
- Hand holding phone showing Facebook Messenger
- Hand holding phone showing Telegram
- Hand holding phone showing WhatsApp

**Prompt template (use for each):**
> "Photorealistic hand holding a smartphone showing [Instagram DM / Facebook Messenger / Telegram / WhatsApp] chat interface, dark background, cinematic lighting, purple rim light, top-down slight angle, isolated subject"

**Format:** PNG with transparent background, ~800x1200px each

**Alternative if no image gen:** Use open-source SVG phone mockups from [Mobbin](https://mobbin.com) or [Facebook Design](https://design.facebook.com/toolsandresources/devices/)

---

### 3. Zigzag Arrow Animation
**Tool:** Pure CSS / Lottie  
**What to make:** Animated SVG arrow that travels in zigzag path downward  
**No asset needed** — Hemant builds this in CSS/SVG directly

---

### 4. AI Agent Boxes — 6 boxes
**Tool:** Hemant builds in React  
**What to make:** Glassmorphism cards with:
- Agent name
- Animated "processing" state (pulsing border)
- Output bubble that appears on scroll

| Agent Box | Output to show |
|---|---|
| NLP Classifier | `fraud 🔴` |
| Emotion Agent | `😡 → 😐 → 🙂` |
| Severity Scorer | `HIGH ⚠️` |
| Breach Predictor | `72% risk` |
| Root Cause | `Cluster: UPI_FAIL` |
| DNA/Embedding | `Vectorized ✓` |

---

### 5. Department Routing Animation
**Tool:** Hemant builds in React/CSS  
**What to make:** A complaint "card" that flies/slides to one of 3 department boxes:
- 🏦 Loans
- 💳 Cards  
- 🔒 Fraud

No external asset needed — pure CSS animation

---

### 6. Happy Customer Illustration
**Tool:** [unDraw.co](https://undraw.co) (free, open source SVGs)  
**Search for:** "feeling happy" or "confirmation" illustration  
**Customize:** Set primary color to `#6C63FF` on the site before downloading  
**Format:** SVG

---

## Scroll Sections — Full Story

```
┌─────────────────────────────────┐
│  SECTION 1 — HERO               │
│  3D "OmniResol" floating        │
│  Tagline: "Every complaint.     │
│  Resolved. Intelligently."      │
│  CTA: "See how it works ↓"      │
└─────────────────────────────────┘
           ↓ scroll
┌─────────────────────────────────┐
│  SECTION 2 — MULTI CHANNEL      │
│  4 phones fan out as you scroll │
│  Each phone shows a channel     │
│  Text: "Complaints from         │
│  everywhere. One pipeline."     │
│  On scroll: all 4 tap send      │
│  simultaneously                 │
└─────────────────────────────────┘
           ↓ scroll
┌─────────────────────────────────┐
│  SECTION 3 — ZIGZAG ARROW       │
│  Animated path travels down     │
│  SVG stroke-dashoffset trick    │
│  Connects channels → AI engine  │
└─────────────────────────────────┘
           ↓ scroll
┌─────────────────────────────────┐
│  SECTION 4 — AI AGENTS          │
│  6 glassmorphism boxes          │
│  Appear one by one on scroll    │
│  Each pulses then shows output  │
│  Text: "6 AI agents.            │
│  Running in parallel.           │
│  Under 800ms."                  │
└─────────────────────────────────┘
           ↓ scroll
┌─────────────────────────────────┐
│  SECTION 5 — ROUTING            │
│  Complaint card animates to     │
│  correct department             │
│  Text: "Routed to the right     │
│  team. Automatically."          │
└─────────────────────────────────┘
           ↓ scroll
┌─────────────────────────────────┐
│  SECTION 6 — RESOLUTION         │
│  Happy customer illustration    │
│  Resolution stats:              │
│  "< 800ms processing"           │
│  "6 AI agents"                  │
│  "5 channels supported"         │
│  CTA: "Request Demo"            │
└─────────────────────────────────┘
```

---

## Tech Stack for Hemant

```
React + TypeScript          ← already his stack
Framer Motion               ← scroll animations (npm install framer-motion)
@splinetool/react-spline    ← 3D hero embed (npm install @splinetool/react-spline)
Intersection Observer API   ← trigger animations on scroll (built-in browser API)
Tailwind CSS                ← utility styling
```

---

## Animation Techniques

### Phones fan-out on scroll
```css
/* Framer Motion — stagger children */
transition={{ delay: index * 0.15 }}
```

### Zigzag arrow draw
```css
/* SVG stroke animation */
stroke-dasharray: 1000;
stroke-dashoffset: 1000;
animation: draw 2s ease forwards;

@keyframes draw {
  to { stroke-dashoffset: 0; }
}
```

### Agent boxes appear
```js
// Intersection Observer
useInView(ref, { once: true, threshold: 0.3 })
```

### Agent output bubble
```
Pulse border (processing) → 
wait 0.8s → 
output text types in (typewriter effect)
```

---

## Abhineet's handoff to Hemant

Tell Hemant:
1. API base URL: `http://localhost:8888/api/v1`
2. WebSocket URL: `ws://localhost:8888/api/v1/ws/supervisor`
3. POST `/complaints` — payload shape (share `ComplaintCreate` schema)
4. GET `/complaints/{id}` — for polling agent results
5. CORS is already configured for `http://localhost:5173`

---

## Priority Order for Hemant

```
Week 1 (now):
  1. Create Spline 3D hero asset
  2. Generate phone images (Midjourney/Firefly)
  3. Download unDraw happy customer SVG
  4. Scaffold React page with sections

Week 2:
  5. Build scroll animations with Framer Motion
  6. Wire up API calls
  7. Connect WebSocket for real-time demo
```

---

## What YOU (Abhineet) Need to Do

- [ ] Share this doc with Hemant
- [ ] Share `ComplaintCreate` schema with Hemant
- [ ] Confirm CORS origin matches Hemant's dev URL (`localhost:5173`)
- [ ] Create Spline account and make the 3D hero (takes ~30 mins, no coding)
- [ ] Generate 4 phone images using Midjourney or Adobe Firefly
- [ ] Download happy customer SVG from unDraw.co with color `#6C63FF`