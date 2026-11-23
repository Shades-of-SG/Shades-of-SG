# Shades of SG — Open House Holobox 9:16 Design System & Anti-AI-Slop Contract

Target display: **Holobox Vertical Touchscreen Exhibition Kiosk**
- Native physical resolution: **2160 × 3840** (9:16 portrait aspect ratio)
- CSS viewport equivalents supported identically: **`1080 × 1920` @ 2× DPR** and **`2160 × 3840` @ 1× DPR**
- Viewing & interaction context: Standing visitors at ~1m viewing distance using bare-finger touch without mouse hover.

---

## 1. Core Identity & Color Palette

Faithful to *Shades of SG*'s nocturnal dark-slate and violet heritage theme, tuned so backgrounds blend seamlessly into dark Holobox bezels and controls remain crisp at standing distance.

| Token | Value | Role |
|---|---|---|
| `--surface-canvas` | `#0a0a1a` | Deep exhibition backdrop and root canvas |
| `--surface-base` (`--bg`) | `#0f172a` | Primary page and layout surface |
| `--surface-raised` (`--panel`) | `#162033` | Cards, panels, modals, bottom sheets, navigation dock |
| `--surface-interactive` (`--panel-soft`) | `#1e293b` | Input wells, interactive rows, secondary button fills |
| `--violet` | `#7c3aed` | **Primary action accent** (primary CTAs, active play buttons, scrubber fill) |
| `--violet-active` (`--Rose`) | `#8b5cf6` | Active navigation indicators, selected state borders, native `accent-color` |
| `--violet-soft` | `#c4b5fd` | Focus-visible rings, subtle active labels, secondary icon highlights |
| `--accent-heritage` | `#d4a359` | Restrained Peranakan brass highlight (archival years, S-rank crests, heritage markers) |
| `--text` | `#f8fafc` | Primary ink (≥ 14:1 contrast on `#0f172a`) |
| `--text-secondary` | `#cbd5e1` | Body & story copy (≥ 9:1 contrast on `#0f172a`) |
| `--muted` | `#94a3b8` | Supporting metadata & labels (≥ 4.5:1 contrast on `#0f172a`) |
| `--border-subtle` (`--line`) | `rgba(226, 232, 240, 0.12)` | Crisp 1px structural dividers |
| `--border-active` | `rgba(139, 92, 246, 0.48)` | Active/selected border rim |

### Semantic Status Colors
- Success: `--green: #22c55e`
- Warning: `--gold: #f59e0b`
- Error: `--error: #ef4444`

### Elevation Discipline
- Elevation is expressed through solid stepped dark surfaces (`#0a0a1a` → `#0f172a` → `#162033` → `#1e293b`) and crisp `1px` structural borders, never glowing neon border-halos or heavy blurred glass cards.

---

## 2. Exhibition Typography & Standing-Distance Scale

- **Display / Storytelling (`--font-display`)**: `'Fraunces', Georgia, 'Times New Roman', serif` — variable optical-size serif for Singaporean heritage headlines without fragile hairlines.
- **UI & Touch Controls (`--font-sans`)**: `'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif` — clean open counters for 1m legibility and `tabular-nums` on scores/counts.
- **Timecodes Only (`--font-mono`)**: `'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace` — strictly for playback timestamps and frame counters.
- **Keepsake Reflections**: `'Patrick Hand', cursive` reserved exclusively for handwritten reflection note cards.

### DPR-Invariant Portrait Root Scale & Fluid `clamp()` Rules
Active whenever `@media (orientation: portrait) and (max-aspect-ratio: 3 / 4)`:
```css
html {
  font-size: clamp(1rem, 0.25rem + 1.3vw, 2.125rem);
  scroll-padding-bottom: calc(var(--holobox-dock-h, 5.75rem) + env(safe-area-inset-bottom, 0px) + 1rem);
}
```
- Keeps `max <= 2.5 * min` so WCAG 1.4.4 200% zoom always functions cleanly.
- Produces ~18px base `rem` at `1080px` width (2× DPR) and ~32px base `rem` at `2160px` width (1× DPR), yielding consistent real-world physical sizing on the Holobox glass.
- Apply `text-wrap: balance` to `h1, h2, h3` and `text-wrap: pretty` to `p, li`.

---

## 3. Hard Anti-AI-Slop Rejection Rules

1. **No gradient-slop**: Do not plaster purple-blue/cyan-orange gradients over buttons, backgrounds, or clipped headline text. Primary buttons use solid `#7c3aed` with `1px solid #8b5cf6` and solid `#6d28d9` press state.
2. **No single-word colored/italic headline gimmicks**: Avoid wrapping one trailing word in a gradient or accent `<span>`.
3. **No tracked ALL-CAPS eyebrow clutter**: Avoid stacking uppercase micro-eyebrows above every heading or section; keep semantic titles direct and clear.
4. **No rainbow pastel or cookie-cutter glowing card walls**: Keep journey, discovery, and learning cards grounded in cohesive dark slate surfaces with restrained accent placement.
5. **No emojis as UI icons**: All structural, navigation, media, and action icons must use crisp **Lucide React** SVGs (`20px–24px`).
6. **No staggered scroll-reveal gating**: Exhibition kiosk pages must be immediately readable on arrival without hidden opacity/translate delays; reserve motion for crisp press/drawer feedback (`prefers-reduced-motion` honored).

---

## 4. 9:16 Holobox Ergonomics & Placement Architecture

### Vertical Ergonomic Zones
```text
+--------------------------------------------------+  0%
|  COMPACT TOP MASTHEAD (non-critical utilities)   |
+--------------------------------------------------+  ~5%
|  ZONE 1: EYE-LEVEL SHOWCASE (5% – 36%)           |
|  - Hero storytelling / 16:9 Video Stage          |
|  - Fraunces Display Title & Cultural Context     |
|  - Live Rhythm Score HUD                         |
+--------------------------------------------------+ ~36%
|  ZONE 2: HAND & THUMB REACH ZONE (36% – 89%)     |
|  - Video transport controls & finger scrubber    |
|  - Search, filter chips, CTAs                    |
|  - Trivia answers, Rhythm touch lanes, Cards     |
|  - Dark-slate bottom sheets for modals/drawers   |
+--------------------------------------------------+ ~89%
|  ZONE 3: FIXED BOTTOM NAVIGATION DOCK (89–100%)  |
|  Home  |  Songs  |  Learn  |  Rhythm  |  Wall    |
+--------------------------------------------------+ 100%
```

### Mandatory Touchscreen & Accessibility Standards
- **Touch Target Floor**: Every interactive control (`button`, `nav a`, `input`, `select`, `summary`, `[role="button"]`, pagination, filter chip, close icon) has `min-block-size: max(56px, 3.5rem)` and `min-inline-size: max(56px, 3.5rem)` in portrait, with at least `12px–16px` spacing between adjacent targets.
- **Zero Hover-Only Flows**: Tooltips, card action menus, and fullscreen player bars must never rely exclusively on `:hover` or `onMouseMove`; reveal actions under `@media (hover: none)` and wake fullscreen overlays via `onPointerDown`.
- **Native Touch Scrolling & Containment**:
  - Horizontal carousels and chip rails use native `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;`.
  - Modals and bottom sheets contain scroll chaining via `overscroll-behavior: contain` on the sheet/dialog and `overflow: hidden; overscroll-behavior: contain;` on backdrops—never mutating `html`/`body` overflow to lock page scroll.
  - Zero horizontal page overflow (`document.documentElement.scrollWidth <= window.innerWidth`) achieved by fixing grid/flex/media sizing at the root (`min-inline-size: 0`, `max-inline-size: 100%`, `flex-wrap: wrap`) rather than hiding overflow on `body`.
- **Focus & Form Controls**: Declare `color-scheme: dark; accent-color: #8b5cf6;` with `@supports not` fallbacks and high-contrast `:focus-visible` outlines (`3px solid #c4b5fd; outline-offset: 3px;`). Scrollbars use standard `scrollbar-color` / `scrollbar-width` tokens with `@supports not (scrollbar-color: auto)` legacy WebKit fallback.
