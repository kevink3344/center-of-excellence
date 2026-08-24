# Master CSS Style Guide & Recreation Plan

**Purpose:** A single source of truth for how styles should be implemented in this app, plus a step-by-step plan for **recreating** them cleanly if a rewrite, port, or audit is ever needed.

> **Audience:** Any future contributor who needs to rebuild, refactor, or extend the app's visual layer. The doc documents exactly **what exists**, then provides a **how-to-rebuild** playbook.

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Styling Architecture (How It Works Today)](#2-styling-architecture)
3. [Design Tokens & Theme System](#3-design-tokens--theme-system)
4. [Entry Points & Shared CSS](#4-entry-points--shared-css)
5. [Component Class Reference](#5-component-class-reference)
6. [Tailwind Usage Patterns](#6-tailwind-usage-patterns)
7. [Responsive & Mobile Scaling](#7-responsive--mobile-scaling)
8. [Third-Party Overrides](#8-third-party-overrides)
9. [Fonts & Typography](#9-fonts--typography)
10. [Known Dead / Legacy CSS](#10-known-dead--legacy-css)
11. [Recreation Plan (Step-by-Step)](#11-recreation-plan)
12. [Verification Checklist](#12-verification-checklist)

---

## 1. Stack Overview

| Concern | Technology |
| --- | --- |
| Styling framework | **Tailwind CSS v4** (`tailwindcss@^4.2.2`) via `@tailwindcss/vite` |
| Utility usage | Inline utility classes in JSX + **arbitrary value syntax** referencing CSS vars (e.g. `bg-[color:var(--accent)]`) |
| Custom CSS | `src/index.css` — Tailwind import + design-token utility classes + component classes |
| Design tokens | CSS custom properties (`--app-bg`, `--accent`, ...) applied at **runtime** by React |
| Theme | Light / Dark palettes defined in `src/theme.ts`, selected by `ThemeMode` |
| Fonts | `@fontsource/work-sans` (sans) + `@fontsource/jetbrains-mono` (mono) |
| Animation | `motion` (Framer Motion successor) — `AnimatePresence`, `motion.*` components |
| Dashboard grid | `react-grid-layout` + `react-resizable` (their own CSS imported) |
| Rich text editor | TipTap (`@tiptap/react`) — content styled in `index.css` |

**Build-time setup** (`package.json`):

- `dev:client` → `vite`
- `build` → `tsc -b && vite build && tsc -p tsconfig.server.json`
- No separate Tailwind config file — **Tailwind v4 is configured in CSS** via `@theme inline` / `@import "tailwindcss"`.

---

## 2. Styling Architecture

The app uses a **hybrid** approach:

```
src/index.css
├── @import "tailwindcss";                 ← Tailwind v4 engine (CSS-first config)
├── @theme inline { --font-sans; --font-mono }   ← maps Tailwind font utilities
├── :root { ... }                          ← base element defaults
├── design-token consumer classes          ← .app-shell, .surface, .surface-muted, ...
├── component classes                      ← .primary-button, .badge, .field, .input-control, ...
└── feature-specific classes               ← .dashboard-grid, .rich-text-editor-content, ...
```

**Key architectural fact:** The CSS variables do **not** live in CSS. They are injected **at runtime** through a React `style` object (`paletteStyle` in `src/App.tsx`), computed from the active theme palette. This means:

- The **same** `index.css` works for light and dark mode.
- Changing the theme just swaps the custom-property values on the app shell.
- CSS `color-mix(in srgb, var(--accent) X%, ...)` is heavily used to derive hover/focus/muted variants from the base tokens.

### The runtime variable flow

```
src/theme.ts
  └── defaultThemeConfig: { light: ThemePalette, dark: ThemePalette }

src/App.tsx
  ├── activePalette = themeConfig[themeMode]  (or defaultThemeConfig[themeMode])
  ├── paletteStyle = { '--app-bg': ..., '--accent': ..., ... } as CSSProperties
  └── <div className="app-shell ..." style={paletteStyle}>  ← tokens go live here
```

### The 12 CSS custom properties

| Variable | Purpose | Light (`defaultThemeConfig.light`) | Dark (`defaultThemeConfig.dark`) |
| --- | --- | --- | --- |
| `--app-bg` | Main application background | `#f4f7fb` | `#0b1621` |
| `--header-bg` | Top header bar | `#0d2f4f` | `#081422` |
| `--menu-bg` | Sidebar / navigation menu | `#123555` | `#0d1d2e` |
| `--card-bg` | Cards, surfaces, tables | `#ffffff` | `#101d2b` |
| `--panel-bg` | Detail/panel backgrounds | `#fbfdff` | `#0f1a27` |
| `--input-bg` | Form input backgrounds | `#ffffff` | `#102030` |
| `--button-bg` | Primary buttons | `#0078d4` | `#2d8cff` |
| `--accent` | Accent / brand color | `#0078d4` | `#5fa8ff` |
| `--text` | Primary text | `#10243b` | `#f2f7fb` |
| `--text-muted` | Secondary/muted text | `#5f7389` | `#91a7bd` |
| `--border` | Borders & separators | `#e5e7eb` | `#213447` |
| `--button-text` | Text on primary buttons | `#ffffff` | `#081422` |

> `--detail-panel-width` is also set inline (in `vw`) but that's a **layout** variable, not a color token.

---

## 3. Design Tokens & Theme System

### Theme types (`src/types.ts`)

```ts
export type ThemeMode = 'light' | 'dark'

export interface ThemePalette {
  appBg: string
  headerBg: string
  menuBg: string
  cardBg: string
  panelBg: string
  inputBg: string
  buttonBg: string
  accent: string
  text: string
  textMuted: string
  border: string
  buttonText: string
}

export interface ThemeConfig {
  light: ThemePalette
  dark: ThemePalette
}
```

### Default palette (`src/theme.ts`)

See the table in [§2](#the-12-css-custom-properties). `src/theme.ts` exports `defaultThemeConfig: ThemeConfig`.

### How a custom theme is loaded

In `src/App.tsx`:

```ts
const activePalette = isThemeConfig(themeConfig)
  ? themeConfig[themeMode]
  : defaultThemeConfig[themeMode]
```

`themeConfig` may be overridden by admin (stored per-org). `themeMode` is persisted in `localStorage` under `STORAGE_KEYS.mode`.

### Runtime injection

```ts
const paletteStyle = {
  '--app-bg': activePalette.appBg,
  '--header-bg': activePalette.headerBg,
  '--menu-bg': activePalette.menuBg,
  '--card-bg': activePalette.cardBg,
  '--panel-bg': activePalette.panelBg,
  '--input-bg': activePalette.inputBg,
  '--button-bg': activePalette.buttonBg,
  '--accent': activePalette.accent,
  '--text': activePalette.text,
  '--text-muted': activePalette.textMuted,
  '--border': activePalette.border,
  '--button-text': activePalette.buttonText,
  '--detail-panel-width': `${detailWidth}vw`,
} as CSSProperties
```

### Theme editing (admin settings)

`updateThemeColor(mode, field, value)` in `src/App.tsx` updates `themeConfig` for the chosen `ThemeMode`. The settings UI (Appearance section) exposes a color picker per palette field and toggles between Light/Dark editing with a `<ThemeMode>` switch.

---

## 4. Entry Points & Shared CSS

All three entry points import **`src/index.css`** directly (the single global stylesheet):

| Entry | File | Imports |
| --- | --- | --- |
| Main app | `src/main.tsx` | fonts (400/500/600) + `./index.css` |
| Anonymous ticket | `src/anon/main.tsx` | fonts + `../index.css` |
| Feedback | `src/feedback/main.tsx` | fonts (400/500/600) + `../index.css` |

Fonts are loaded via `@fontsource`:

```ts
import '@fontsource/work-sans/400.css'
import '@fontsource/work-sans/500.css'
import '@fontsource/work-sans/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
```

**Important:** Because the palette variables are injected only by `App.tsx` (main app), the **anon** and **feedback** pages rely on fallback `:root` values and hardcoded defaults (they set a small inline palette of their own). They do **not** have the full 12-token theme system.

### `src/index.css` — the single source of custom styles

The stylesheet structure (line ranges approximate, current at time of writing):

| Section | Approx lines |
| --- | --- |
| Tailwind import + `@theme inline` (fonts) | 1–5 |
| `:root` base element defaults (colon, bg, font-synthesis) | 7–19 |
| Global resets (`*`, `html/body/#root`, `button`/`input`, `::selection`) | 21–41 |
| `.app-shell` + surface classes (`.surface`, `.surface-muted`, `.surface-dark`) | 43–69 |
| Login / auth (`.login-shell`, `.login-card`, `.google-login-button`, `.google-login-icon`) | 71–104 |
| Form controls (`.field`, `.field-label`, `.input-control`, `.form-input`) | 106–145 |
| Shared button base + buttons (`.primary-button`, `.secondary-button`, `.icon-button`, `.view-toggle`, `.sidebar-link`, `.tab-link`) | 147–229 |
| Badges (`.badge`, `.badge-button`, `.badge-blue/amber/orange/green/red/slate`, `.notification-unread-button`) | 231–312 |
| Tabs & nav (`.tab-link`, `[data-active]`) | 314–344 |
| Detail panel + resize handle (`.detail-panel`, `-shell`, `-resize-handle`) | 346–380 |
| Settings accordion + drag handle | 382–443 |
| Dashboard grid + widgets + charts | 445–520 |
| TipTap rich-text editor content (`.ProseMirror` etc.) | 522–612 |
| About-page rendered content | 614–666 |
| Responsive breakpoints (`max-width: 1023px`, `768px`, `640px`) | 668–800 |

---

## 5. Component Class Reference

These are the **custom component classes** defined in `src/index.css`. They are the reusable "building blocks" used alongside Tailwind utilities.

### Surfaces & layout

| Class | Purpose |
| --- | --- |
| `.app-shell` | Main shell; uses `--app-bg` and `--text` |
| `.surface` | Standard card — `1px var(--border)`, `2px` radius, `var(--card-bg)` |
| `.surface-muted` | Card at 88% card-bg blend |
| `.surface-dark` | Translucent white surface for dark headers/nav |
| `.login-shell` | Full-height auth page with radial/linear gradient |
| `.login-card` | Centered login card with drop shadow |
| `.detail-panel` | Resizable detail drawer; width `var(--detail-panel-width)` |

### Buttons

| Class | Purpose |
| --- | --- |
| `.primary-button` | Filled — `--button-bg` bg, uppercase, letter-spacing |
| `.secondary-button` | Outlined — `--border`, `--app-bg`, uppercase |
| `.icon-button` | Icon-only, `36px` square, transparent |
| `.view-toggle` | Tab-like toggle (`[data-active='true']` highlights with accent) |
| `.badge-button` | Small inline action pill (e.g. notification "Mark as read") |
| `.google-login-button` | Google SSO button (white, shadowed) |
| `.dashboard-reset-button` | Text-only reset link |

### Form controls

| Class | Purpose |
| --- | --- |
| `.field` | Grid label + input wrapper (gap 8px) |
| `.field-label` | Uppercase, letter-spaced, `--text-muted` |
| `.input-control` | Themed text input |
| `.form-input` | Input variant with hardcoded fallback colors |
| `.google-login-icon` | Google "G" badge (gradient) |

### Badges & status pills

Each `.badge-*` color pairs a `border`, `background`, and `text` in a consistent 2px-radius pill:

| Class | Border | Background | Text |
| --- | --- | --- | --- |
| `.badge-blue` | `#a9c9ff` | `#eaf3ff` | `#315dc6` |
| `.badge-amber` | `#f8d36d` | `#fff5d6` | `#a56c00` |
| `.badge-orange` | `#ffc28c` | `#fff0e2` | `#b35d19` |
| `.badge-green` | `#96e0b0` | `#e6fff0` | `#1e8c52` |
| `.badge-red` | `#ffb1b8` | `#ffe8ea` | `#ba3040` |
| `.badge-slate` | `#d5dce4` | `#f5f7fa` | `#546274` |
| `.notification-unread-button` | `#d92d20`-based | — | `#d92d20` |

### Nav & tabs

| Class | Purpose |
| --- | --- |
| `.sidebar-link` | Nav item (`[data-active='true']` → accent 42% bg) |
| `.tab-link` | Tab with accent underline (`[data-active='true']`) |
| `.settings-tab-button` | Settings tab (drag-over variant) |
| `.settings-accordion-header/icon/content` | Settings accordion structure |

### Dashboard

| Class | Purpose |
| --- | --- |
| `.dashboard-grid` | Grid container (`.react-grid-item` overrides) |
| `.dashboard-widget-shell/panel` | Widget layout |
| `.dashboard-chart-body` | Chart area (min-height 18rem) |
| `.dashboard-widget-handle` | Drag handle |

### Editor / content

| Class | Purpose |
| --- | --- |
| `.rich-text-editor-content .ProseMirror` | TipTap editor (headings, lists, links) |
| `.anon-ticket-shell / layout / header / sidebar / success-banner` | Anonymous ticket form |
| `.about-page-content` | Rendered About-page HTML |

### Notifications (recent addition)

| Class | Purpose |
| --- | --- |
| `.notification-badge` | Bell count badge (box-shadow ring on header bg) |
| `.notification-preview` | Dropdown with backdrop blur |
| `.notification-preview-item` | Hover lift + accent border |
| `.notification-unread-dot` | Red unread indicator |

---

## 6. Tailwind Usage Patterns

Tailwind is used **inline in JSX**. The most common pattern is **arbitrary value syntax to reference a CSS custom property** (so the classes stay theme-aware):

```tsx
// Backgrounds
className="bg-[color:var(--card-bg)]"
className="bg-[color:var(--panel-bg)]"

// Text color
className="text-[color:var(--accent)]"
className="text-[color:var(--text-muted)]"

// Borders
className="border-[color:var(--border)]"
className="border-t border-[color:var(--border)]"

// Active state (conditional)
className={isSelected ? 'bg-[color:var(--card-bg)]' : 'border-t border-[color:var(--border)]'}

// Rounded corners (the app uses a distinct 2px radius, NOT Tailwind's default rounded)
className="rounded-[2px]"

// Letter spacing for uppercase headers
className="tracking-[0.12em] ... uppercase"
```

**Conventions:**

- Radius is always `rounded-[2px]` (deliberately not Tailwind's `rounded`, `rounded-md`, etc.).
- Tables use `thead` with `bg-[color:var(--card-bg)] text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]`.
- Status/priority colors are sometimes handled with Tailwind utility classes (e.g. `bg-red-50 text-red-700`) instead of the `.badge-*` classes, when they're not theme-aware.
- Monospace accents use `font-mono` (mapped to JetBrains Mono).

### The `@theme inline` block

```css
@import "tailwindcss";

@theme inline {
  --font-sans: 'Work Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

This is Tailwind v4's CSS-first config. `--font-sans` / `--font-mono` become the Tokens that power Tailwind's `font-sans` / `font-mono` utilities.

> **Note:** There is **no** `tailwind.config.js/ts` in this project. All Tailwind config happens in CSS. If you must add theme colors/breakpoints, add them to `@theme` in `src/index.css`.

---

## 7. Responsive & Mobile Scaling

The app uses **two** mechanisms for responsiveness:

### a) Standard Tailwind breakpoints + custom media queries

Custom CSS uses `@media` blocks for complex layout changes at:

- `max-width: 1023px` — anon ticket sidebar goes static
- `max-width: 768px` — mobile scale, buttons full-width, detail panel full screen
- `max-width: 640px` — primary/secondary buttons full width & centered

### b) Mobile UI scale variables

At the `max-width: 768px` breakpoint, `:root` sets scaling variables:

```css
@media (max-width: 768px) {
  :root {
    --mobile-ui-scale: 1;
    --mobile-button-scale: 1;
  }
  html {
    font-size: calc(100% * var(--mobile-ui-scale));
  }
}
```

Individual components then multiply their sizing by the scale:

```css
.field-label, .input-control, .view-toggle, .sidebar-link, .tab-link, .badge, .dashboard-reset-button {
  font-size: calc(1em * var(--mobile-ui-scale));
}

.primary-button, .secondary-button, .google-login-button {
  padding: calc(10px * var(--mobile-button-scale)) calc(14px * var(--mobile-button-scale));
  min-height: calc(44px * var(--mobile-button-scale));
}
```

This provides a single knob to scale the entire UI on mobile.

---

## 8. Third-Party Overrides

Scrollable/table/chart libraries have their own CSS imported at the JSX/MSA level and are then **overridden** in `index.css`.

### react-grid-layout + react-resizable

Imported in `src/App.tsx` (and `src/dashboard/layouts.ts`):

```ts
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
```

Overridden in `index.css` for:

- Placeholder style (dashed accent border)
- Dragging z-index + handle cursor
- Custom resize handle (accent corner brackets, hidden on mobile)

### TipTap (ProseMirror)

`.rich-text-editor-content .ProseMirror` sets min-height, removes outline, and styles headings, lists, links, hr, strong/em/s. Placeholder handled via `.is-editor-empty:first-child::before`.

### Recharts

The chart containers use `.dashboard-chart-body`. The recurring console warning `width(-1) and height(-1) of chart should be greater than 0` indicates charts need a parent with a definite min size (`min-w-0`/`min-h-0` or explicit minHeight) at certain breakpoints.

---

## 9. Fonts & Typography

| Role | Font | Weights loaded |
| --- | --- | --- |
| Sans (primary) | `Work Sans` (`@fontsource/work-sans`) | 400, 500, 600 |
| Mono (accent/code) | `JetBrains Mono` (`@fontsource/jetbrains-mono`) | 400, 600 |

Set in `@theme inline`:

```css
@theme inline {
  --font-sans: 'Work Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

Also set on `:root`:

```css
:root {
  font-family: 'Work Sans', sans-serif;
  color: #10243b;
  background: #f4f7fb;
}
```

Typography conventions used across the UI:

- **Uppercase labels/buttons** with `letter-spacing: 0.08em` (buttons) or `tracking-[0.12em]` (table headers).
- **Card titles** often use `font-mono font-semibold` (JetBrains Mono) for a technical accent.
- Headings in editor content: `h2` → `1.25rem/600`, `h3` → `1.05rem/600`.

---

## 10. Known Dead / Legacy CSS

**`src/App.css`** exists but is **not imported anywhere** (grep confirms only `index.css` is imported; `App.css` is leftover Vite scaffold with `.counter`, `.hero`, `#center`, `#next-steps`, etc.). It still references `--accent`, `--border`, `--accent-bg`, `--accent-border` which are **not** defined in the theme.

**Action on recreate:** Delete `src/App.css` (and its reference if any) — it is dead code. Do not rebuild it.

---

## 11. Recreation Plan

This is a **step-by-step plan to rebuild the visual layer from scratch** while preserving look, feel, and behavior.

### Phase A — Foundation (build the token system first)

1. **Create the theme palette module** (`src/theme.ts`) with the `ThemePalette` and `ThemeConfig` types and `defaultThemeConfig` for light/dark — copy the two palettes exactly from [§2](#the-12-css-custom-properties).
2. **Define the types** (`ThemeMode`, `ThemePalette`, `ThemeConfig`) in `src/types.ts`.
3. **Set up `src/index.css`**:
   - `@import "tailwindcss";`
   - `@theme inline { --font-sans; --font-mono }`
4. **Set `:root` base defaults** (`color`, `background`, `font-family`, anti-aliasing) — use the light palette values as the fallback (annex/feedback pages depend on these hardcoded defaults).
5. **Add the runtime palette injection** in `App.tsx`: compute `activePalette` from `themeConfig[themeMode]` and build the `paletteStyle` object of all 12 `--*` vars (plus `--detail-panel-width`).

### Phase B — Core primitives

Build these in order, each consuming only the `--*` tokens (never hardcode colors in light/dark component code):

6. **Base resets** — `* { box-sizing }`, `html/body/#root { min-height }`, `body { margin: 0 }`, form control `font: inherit`, `button { cursor: pointer }`, `::selection`.
7. **Surfaces** — `.app-shell`, `.surface`, `.surface-muted`, `.surface-dark`.
8. **Typography helpers** — `.field`, `.field-label`, and the uppercase/letter-spacing convention.
9. **Form controls** — `.input-control`, `.form-input`, focus states, disabled opacity.

### Phase C — Components

10. **Buttons** — build a shared base rule including the `transition`, then `.primary-button`, `.secondary-button`, `.icon-button`, `.view-toggle`, `.badge-button`, `.google-login-button`, `.dashboard-reset-button`. Add hover/focus/disabled states.
11. **Badges** — `.badge` base + `.badge-{blue,amber,orange,green,red,slate}` + `.notification-unread-button`. Use the exact hex values from [§5](#badges--status-pills) so status pills keep their semantic colors in both themes.
12. **Navigation** — `.sidebar-link`, `.tab-link` (both with `[data-active='true']`), `.notification-badge`.
13. **Settings UI** — `.settings-tab-button`, `.settings-accordion-*`, `.settings-drag-handle`, `.settings-panel`.
14. **Detail panel** — `.detail-panel`, `.detail-panel-shell`, `.detail-resize-handle` (+ `::after` and hover).
15. **Login** — `.login-shell`, `.login-card`, `.google-login-button/icon`.

### Phase D — Feature-specific styles

16. **Dashboard** — `.dashboard-grid`, widget shell/panel/chart-body, handle, and the `react-grid-item` / `.react-resizable-handle` overrides.
17. **TipTap editor** — `.rich-text-editor-content .ProseMirror` + heading/list/link/hr/strong/em rules + placeholder.
18. **Anonymous ticket page** — `.anon-ticket-shell`, `.anon-ticket-layout/header/sidebar/actions`, `.anon-success-banner`, and its `max-width: 1023px / 767px` media blocks.
19. **About page content** — `.about-page-content` (mirrors the editor content rules).
20. **Notifications** — `.notification-preview`, `.notification-preview-item`, `.notification-unread-dot`, `.notification-unread-button`.

### Phase E — Responsive & polish

21. **Add the mobile breakpoint blocks** (`1023px`, `768px`, `640px`) and the `--mobile-ui-scale` / `--mobile-button-scale` variable system ([§7](#7-responsive--mobile-scaling)).
22. **Remove dead CSS** — delete `src/App.css`.
23. **Wire up fonts** in `main.tsx`, `anon/main.tsx`, `feedback/main.tsx` (Work Sans + JetBrains Mono via `@fontsource`).

### Phase F — Verify against the original

24. Rebuild & type-check: `npm run build`.
25. Start dev servers: `npm run dev`.
26. Compare visually (light + dark) against the current deployed version for: login screen, dashboard, tickets list/detail, new-ticket form, team tickets, settings (all tabs), notifications (bell + view-all), anonymous ticket page, feedback page.
27. Confirm the theme editor (Appearance settings) still updates all tokens live and persists.

---

## 12. Verification Checklist

- [ ] `src/index.css` is the only global stylesheet; `@import "tailwindcss"` present.
- [ ] All 12 color tokens + `--detail-panel-width` injected at runtime via `paletteStyle`.
- [ ] Light and dark palettes in `theme.ts` match `[§2](#the-12-css-custom-properties)` exactly.
- [ ] No hardcoded colors in light/dark component code — everything derives from `var(--*)` or `color-mix()`.
- [ ] Radius consistently `2px` (`rounded-[2px]` / `border-radius: 2px`).
- [ ] Buttons uppercase + `letter-spacing: 0.08em`; table headers `tracking-[0.12em]`.
- [ ] Status badges keep their semantic colors in both themes.
- [ ] Mobile scaling knobs (`--mobile-ui-scale`, `--mobile-button-scale`) present and functional.
- [ ] All three entry points (main, anon, feedback) load fonts + `index.css`.
- [ ] `src/App.css` removed (dead code).
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] Visual parity confirmed across all screens in **both** light and dark mode.

---

> **Last updated:** 2026-08-23
> **Audited against:** commit `00bbd65` on `main` (notification-rules feature + read-state change).
