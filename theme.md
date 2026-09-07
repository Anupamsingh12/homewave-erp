# Aarambh Estates — Design System Reference

This document specifies the visual design system used by this app so it can be
reproduced in another codebase. It covers tokens (color/type/space/radius/shadow),
the exact component conventions built on top of them, and a step-by-step porting
checklist. Everything below is transcribed directly from the working app — no
approximation.

## 1. Design philosophy

- **Premium, restrained, "enterprise SaaS"** — not a generic Bootstrap admin
  panel. Deep navy + a sparing warm-gold accent, generous whitespace, subtle
  borders instead of heavy drop shadows, and one consistent status-color
  vocabulary used everywhere (never ad-hoc colors per screen).
- **Dark sidebar, light canvas.** The navigation shell is a dark navy surface;
  the main content area is a near-white canvas. This contrast is the single
  biggest driver of the "premium" feel — get this right first.
- **Color means something.** Every status pill uses the same color for the
  same concept everywhere in the app (see §5). Color is never decorative.
- **Cards and tables are quiet.** 1px borders (`border-border`), a barely-there
  shadow (`shadow-card`), and generous internal padding. Elevation is used only
  on hover/popovers (`shadow-elevated`), never as a resting state.

## 2. Tech stack this system assumes

- **Tailwind CSS v4**, CSS-first configuration (`@theme inline` in the
  stylesheet — no `tailwind.config.js` color palette). Colors are OKLCH.
- **shadcn/ui**, `new-york` style, base color `slate`, no class prefix,
  `cssVariables: true`. All primitives (Button, Card, Dialog, Select, Table,
  Tabs, Dropdown, Sheet, Popover, Calendar, Progress, Skeleton, Sonner toasts,
  etc.) come from shadcn as-is — this system does not restyle shadcn's own
  component internals, it only supplies the CSS variables shadcn's components
  already consume.
- **Radix UI** primitives (via shadcn) for accessibility/behavior.
- **lucide-react** for icons (`size-4` / `size-4.5` inline SVGs, never a custom
  icon set).
- **Plus Jakarta Sans** from Google Fonts as the sole typeface.

If the target app uses Tailwind v3, adapt §3's tokens into
`tailwind.config.js`'s `theme.extend.colors` (each `--color-x: var(--x)` pair
becomes `x: "hsl(var(--x))"` or similar) — OKLCH requires Tailwind v4 or a
browser-supports-oklch fallback strategy; degrade to HSL equivalents if v3 is
mandatory (approximate hues are noted in §5.2).

## 3. Design tokens — copy verbatim

This is the entire token file. Load it once, globally.

```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ring-offset-background: var(--background);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-info: var(--info);
  --color-info-soft: var(--info-soft);
  --color-accent-soft: var(--accent-soft);
  --color-accent-strong: var(--accent-strong);
  --color-purple: var(--purple);
  --color-purple-soft: var(--purple-soft);
  --color-cyan: var(--cyan);
  --color-cyan-soft: var(--cyan-soft);
  --color-orange: var(--orange);
  --color-orange-soft: var(--orange-soft);
  --shadow-card: 0 1px 2px 0 oklch(0.21 0.05 264 / 0.06), 0 1px 3px 0 oklch(0.21 0.05 264 / 0.05);
  --shadow-elevated: 0 10px 30px -12px oklch(0.21 0.05 264 / 0.24);
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}

:root {
  --radius: 0.625rem;
  --background: oklch(0.985 0.004 250);
  --foreground: oklch(0.21 0.04 262);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.21 0.04 262);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.21 0.04 262);
  --primary: oklch(0.31 0.075 264);
  --primary-foreground: oklch(0.985 0.005 250);
  --secondary: oklch(0.958 0.008 250);
  --secondary-foreground: oklch(0.31 0.075 264);
  --muted: oklch(0.962 0.007 250);
  --muted-foreground: oklch(0.535 0.033 257);
  --accent: oklch(0.955 0.03 92);
  --accent-foreground: oklch(0.36 0.07 78);
  --accent-soft: oklch(0.955 0.045 92);
  --accent-strong: oklch(0.6 0.115 79);
  --destructive: oklch(0.55 0.21 27);
  --destructive-foreground: oklch(0.985 0.005 250);
  --success: oklch(0.53 0.13 156);
  --success-soft: oklch(0.95 0.045 156);
  --warning: oklch(0.6 0.13 70);
  --warning-soft: oklch(0.96 0.05 80);
  --info: oklch(0.53 0.14 250);
  --info-soft: oklch(0.955 0.03 250);
  --purple: oklch(0.5 0.18 300);
  --purple-soft: oklch(0.955 0.035 300);
  --cyan: oklch(0.5 0.11 200);
  --cyan-soft: oklch(0.95 0.035 200);
  --orange: oklch(0.58 0.17 50);
  --orange-soft: oklch(0.96 0.05 50);
  --border: oklch(0.918 0.012 255);
  --input: oklch(0.918 0.012 255);
  --ring: oklch(0.6 0.115 79);
  --chart-1: oklch(0.4 0.09 264);
  --chart-2: oklch(0.66 0.13 79);
  --chart-3: oklch(0.55 0.12 200);
  --chart-4: oklch(0.58 0.12 156);
  --chart-5: oklch(0.6 0.17 25);
  --sidebar: oklch(0.24 0.055 264);
  --sidebar-foreground: oklch(0.88 0.015 255);
  --sidebar-primary: oklch(0.66 0.13 79);
  --sidebar-primary-foreground: oklch(0.19 0.04 264);
  --sidebar-accent: oklch(0.3 0.06 264);
  --sidebar-accent-foreground: oklch(0.97 0.01 250);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.66 0.13 79);
}

.dark {
  --background: oklch(0.17 0.035 264);
  --foreground: oklch(0.96 0.006 250);
  --card: oklch(0.22 0.042 264);
  --card-foreground: oklch(0.96 0.006 250);
  --popover: oklch(0.22 0.042 264);
  --popover-foreground: oklch(0.96 0.006 250);
  --primary: oklch(0.72 0.13 79);
  --primary-foreground: oklch(0.19 0.04 264);
  --secondary: oklch(0.28 0.04 260);
  --secondary-foreground: oklch(0.96 0.006 250);
  --muted: oklch(0.28 0.04 260);
  --muted-foreground: oklch(0.72 0.03 257);
  --accent: oklch(0.3 0.05 90);
  --accent-foreground: oklch(0.93 0.06 90);
  --accent-soft: oklch(0.32 0.055 90);
  --accent-strong: oklch(0.82 0.11 85);
  --destructive: oklch(0.68 0.18 22);
  --destructive-foreground: oklch(0.98 0.003 248);
  --success: oklch(0.75 0.14 158);
  --success-soft: oklch(0.3 0.06 158);
  --warning: oklch(0.8 0.13 75);
  --warning-soft: oklch(0.32 0.06 75);
  --info: oklch(0.75 0.11 250);
  --info-soft: oklch(0.3 0.06 250);
  --purple: oklch(0.75 0.14 300);
  --purple-soft: oklch(0.32 0.07 300);
  --cyan: oklch(0.75 0.1 200);
  --cyan-soft: oklch(0.3 0.06 200);
  --orange: oklch(0.78 0.14 50);
  --orange-soft: oklch(0.32 0.07 50);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.72 0.13 79);
  --chart-1: oklch(0.72 0.13 79);
  --chart-2: oklch(0.7 0.12 200);
  --chart-3: oklch(0.72 0.13 158);
  --chart-4: oklch(0.68 0.15 300);
  --chart-5: oklch(0.68 0.17 25);
  --sidebar: oklch(0.2 0.04 264);
  --sidebar-foreground: oklch(0.9 0.012 255);
  --sidebar-primary: oklch(0.72 0.13 79);
  --sidebar-primary-foreground: oklch(0.19 0.04 264);
  --sidebar-accent: oklch(0.27 0.05 264);
  --sidebar-accent-foreground: oklch(0.97 0.01 250);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.72 0.13 79);
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

### 3.1 What each token means (so you can retune it, not just copy it)

| Token | Role | Notes |
|---|---|---|
| `--background` / `--foreground` | Page canvas / body text | Near-white (`oklch(0.985 0.004 250)`) in light mode, deep navy (`oklch(0.17 0.035 264)`) in dark. |
| `--card` / `--card-foreground` | Any panel, table, dialog surface | Pure white in light mode; a slightly lighter navy than `--background` in dark mode, so cards read as "raised" against the page. |
| `--primary` / `--primary-foreground` | **Deep Navy/Slate** brand color in light mode | `oklch(0.31 0.075 264)` — a near-black navy, hue 264 (blue-violet). In dark mode this **swaps role** to the gold tone (`oklch(0.72 0.13 79)`) — deliberate: on a dark canvas, navy has no contrast to be "primary" against, so gold becomes the primary action color instead. If you don't want this swap, keep `--primary` navy in both modes and use `--accent-strong` for the dark-mode CTA color instead. |
| `--secondary` | Low-emphasis fills (secondary buttons, subtle panels) | Near-white/near-navy neutral, not a brand hue. |
| `--muted` / `--muted-foreground` | Table header backgrounds, disabled/secondary text, skeleton loaders | |
| `--accent` / `--accent-foreground` / `--accent-soft` / `--accent-strong` | **Warm Gold** — the premium/secondary brand color | Hue ~79–92 (amber-gold). `--accent` is a very pale gold wash (used as e.g. `SelectItem` hover), `--accent-soft` a slightly stronger wash (status-pill backgrounds), `--accent-strong` the actual saturated gold (icon accents, the sidebar logo mark, the focus `--ring`). **Use gold sparingly** — it is not a general-purpose color, only for the sidebar mark, active states, and a couple of "premium" status pills (e.g. Lead `SITE_VISIT`→ in earlier revisions; in the current build gold is reserved for Agreement `SENT`/Commission `APPROVED`, not for common statuses). |
| `--destructive` / `--destructive-foreground` | Danger — delete buttons, error text, `OVERDUE`/`LOST`/`CANCELLED` pills | Hue ~22–27 (red). |
| `--success` / `--success-soft` | Green — positive states | Hue ~156–158. `-soft` is the pill background, the bare token is the pill text/icon color. |
| `--warning` / `--warning-soft` | Amber — needs-attention states | Hue ~70–80. |
| `--info` / `--info-soft` | Blue — neutral/in-progress states | Hue ~250 (same family as primary, but lighter/more saturated so it reads as a distinct "blue" rather than "navy"). |
| `--purple` / `--purple-soft` | Purple — a second categorical status color (e.g. `SOLD`, `CONTACTED`) | Hue 300. |
| `--cyan` / `--cyan-soft` | Cyan — third categorical status color (e.g. `QUALIFIED`) | Hue 200. |
| `--orange` / `--orange-soft` | Orange — fourth categorical status color (e.g. `NEGOTIATION`) | Hue 50. Distinct from both `--destructive` (27) and `--warning` (70) so a status table can use red/orange/amber as three genuinely different colors. |
| `--border` / `--input` | Hairline borders everywhere | Nearly invisible in light mode (`oklch(0.918 0.012 255)`), a translucent white overlay in dark mode (`oklch(1 0 0 / 12%)`) — this overlay approach (rather than a flat dark-gray) is what makes dark-mode borders feel "correct" against varying card colors. |
| `--ring` | Focus ring + form-control focus outline | Set to the gold `--accent-strong` value in **both** modes — focus states are always gold, not blue, regardless of theme. |
| `--chart-1`…`--chart-5` | Recharts series colors, in a **fixed order** | 1=navy/primary, 2=gold, 3=cyan-ish, 4=green-ish, 5=red-ish. Never reassign per-chart — always the same series gets the same chart color. |
| `--sidebar*` | The dark navigation rail's own palette, independent of the page's light/dark mode | The sidebar is **always** the dark palette (`--sidebar: oklch(0.24 0.055 264)` in "light" mode, marginally darker `oklch(0.2 0.04 264)` in dark mode) — i.e. the sidebar does not flip white in light mode. This is what gives the two-tone "dark rail, light canvas" look regardless of the user's theme choice. |
| `--radius` | Base corner radius, `0.625rem` (10px) | Every other radius (`sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`4xl`) is derived from this one value by fixed offsets — change only `--radius` to rescale the whole app's roundedness proportionally. |
| `--shadow-card` | Resting elevation for every card/table/dialog | Extremely subtle two-layer shadow, tinted navy (not black) — `oklch(0.21 0.05 264 / 0.06)` and `/0.05`. |
| `--shadow-elevated` | Hover/popover elevation | A single soft shadow, same navy tint, larger blur/spread, used e.g. on `KpiCard` hover. |

### 3.2 Typography

- Single typeface: **Plus Jakarta Sans**, loaded via Google Fonts:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
  />
  ```
- Registered as `--font-sans` in the theme block above, and applied as the
  default body font (no extra CSS needed beyond that variable existing —
  Tailwind v4's preflight uses `--font-sans` automatically once declared).
- Weights actually used: 400 (body), 500 (labels, table headers, nav items),
  600 (headings, KPI values, active nav), 700 (rare — large numerals only).
- Scale in practice (Tailwind classes, not custom sizes):
  - Page title: `text-2xl font-semibold tracking-tight`
  - Panel/section title: `text-sm font-semibold`
  - Body/table text: `text-sm`
  - Table header / eyebrow labels: `text-xs font-semibold tracking-wide uppercase text-muted-foreground`
  - KPI value: `text-2xl font-semibold tracking-tight`
  - Muted/secondary text: `text-sm text-muted-foreground` or `text-xs text-muted-foreground`

### 3.3 Spacing & layout rhythm

- Base spacing unit is Tailwind's default 4px scale, but the app consistently
  reaches for an **8px rhythm** in practice: `gap-2` (8px), `gap-3` (12px),
  `gap-4` (16px), `p-4`/`p-5`/`p-6` for card/page padding, `py-6` for main
  content vertical padding.
- Sidebar width: `w-64` (256px) desktop, `w-72` (288px) mobile drawer.
- Header height: `h-14` (56px), sticky, `backdrop-blur` + `bg-background/85`.
- Main content padding: `px-4 py-6 sm:px-6 lg:px-8` (scales up with viewport).
- Page sections stack with `space-y-6` between major blocks, `space-y-4` for
  tighter groups, `gap-4`/`gap-6` for grids.

### 3.4 Radius & shadow scale (derived, not hand-set)

```
--radius:     0.625rem  (10px)   base
--radius-sm:  radius - 4px        (6px)  — small controls (checkboxes)
--radius-md:  radius - 2px        (8px)  — inputs, buttons
--radius-lg:  radius              (10px) — cards, dialogs
--radius-xl:  radius + 4px        (14px) — larger panels
--radius-2xl: radius + 8px        (18px)
--radius-3xl: radius + 12px       (22px)
--radius-4xl: radius + 16px       (26px)
```
Buttons/inputs use `rounded-md`; cards/panels/tables use `rounded-xl`
(`--radius-xl` = 14px, matches the visible "Panel" and "DataTable" wrapper
radius in this app); pills/badges use `rounded-full`.

## 4. Layout structure

**Two-column shell:** a fixed dark sidebar (desktop) + a light main column
with a sticky translucent header.

```
┌───────────┬──────────────────────────────────────────────┐
│  (dark)   │  (light, sticky, blurred) Header: hamburger   │
│  Sidebar  │  (mobile only) · search/⌘K trigger · theme    │
│  w-64     │  toggle · notification bell · user badge      │
│           ├──────────────────────────────────────────────┤
│  Logo +   │                                                │
│  wordmark │              Main content                      │
│           │              px-4 py-6 sm:px-6 lg:px-8         │
│  Nav      │                                                │
│  sections │                                                │
│  (grouped,│                                                │
│  uppercase│                                                │
│  labels)  │                                                │
│           │                                                │
│  Footer   │                                                │
│  note     │                                                │
└───────────┴──────────────────────────────────────────────┘
```

- **Sidebar** (`bg-sidebar`, always dark regardless of light/dark mode):
  - Logo mark: a `size-9` rounded-lg square, `bg-sidebar-primary` (gold),
    containing a single lucide icon, `text-sidebar-primary-foreground`.
  - Wordmark: two-line — bold app name (`text-sm font-semibold`) + a muted
    tagline (`text-[11px] text-sidebar-foreground/60`).
  - Nav grouped into labeled sections (`text-[10px] font-semibold
    tracking-widest uppercase text-sidebar-foreground/45`), each with a list
    of `<Link>` items: icon (`size-4`) + label, `rounded-lg px-2.5 py-2 text-sm`.
  - Active link: `bg-sidebar-accent font-medium text-sidebar-accent-foreground`.
  - Inactive link: `text-sidebar-foreground/75`, hover
    `bg-sidebar-accent/60 hover:text-sidebar-accent-foreground`.
  - Mobile: the same nav renders inside a shadcn `Sheet` (slide-over drawer)
    triggered by a hamburger button in the header; desktop shows it as a
    `sticky top-0 h-screen` fixed column, hidden below the `lg` breakpoint.
  - Footer note pinned to the bottom (`mt-auto`): a small muted card-on-dark
    strip, e.g. "Demo workspace — data resets on reload."

- **Header** (`h-14 sticky top-0 z-30 border-b bg-background/85 backdrop-blur`):
  - Left: hamburger (mobile only, `lg:hidden`).
  - Center-left: a fake/real search trigger styled as an input
    (`h-9 rounded-lg border bg-card px-3 text-sm text-muted-foreground`) with
    a trailing `⌘K` `<kbd>` hint, opening a command palette (`cmdk`-based
    `CommandDialog`) for fast navigation/search.
  - Right: icon buttons (theme toggle sun/moon, notification bell), then a
    user badge — an avatar circle (`size-7 rounded-full bg-primary
    text-primary-foreground text-xs font-semibold`, showing initials) next to
    a two-line name/role label, wrapped in a pill (`rounded-full border
    py-1 pr-3 pl-1`).

## 5. Status color system — the single most important pattern

**Rule: the same status string always renders in the same color, everywhere
in the app.** This is implemented as one lookup table, not per-screen styling.

### 5.1 The `StatusBadge` component pattern

A single component owns a `value → tone` map and a `tone → className` map.
Every list/table/detail page renders statuses through this component — never
an ad-hoc colored `<span>`.

```tsx
type Tone = "neutral" | "info" | "success" | "warn" | "danger" | "accent" | "purple" | "cyan" | "orange";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info:    "bg-info-soft text-info ring-info/25",
  success: "bg-success-soft text-success ring-success/25",
  warn:    "bg-warning-soft text-warning ring-warning/25",
  danger:  "bg-destructive/10 text-destructive ring-destructive/25",
  accent:  "bg-accent-soft text-accent-strong ring-accent-strong/25",
  purple:  "bg-purple-soft text-purple ring-purple/25",
  cyan:    "bg-cyan-soft text-cyan ring-cyan/25",
  orange:  "bg-orange-soft text-orange ring-orange/25",
};

// pill shape, used for every badge:
// "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap"
// plus a small leading dot: <span className="size-1.5 rounded-full bg-current" />
```

An optional `tone` prop lets a caller **override** the looked-up tone for a
specific instance — needed when the same literal string (e.g. `"PENDING"`)
means different things in different entities (a pending *booking* is amber,
a pending *payment* is blue). Default behavior is table lookup by value;
passing `tone="info"` forces blue regardless of what the table says.

### 5.2 The exact value → tone table used in this app

| Status value | Tone | Rendered color |
|---|---|---|
| `NEW` | info | blue |
| `CONTACTED` | purple | purple |
| `SITE_VISIT` | warn | amber |
| `QUALIFIED` | cyan | cyan |
| `NEGOTIATION` | orange | orange |
| `CONVERTED` | success | green |
| `LOST` | danger | red |
| `AVAILABLE` | success | green |
| `HOLD` | warn | amber |
| `BOOKED` | info | blue |
| `SOLD` | purple | purple |
| `BLOCKED` | danger | red |
| `PENDING` (booking context) | warn | amber |
| `CONFIRMED` | info | blue |
| `CANCELLED` | danger | red |
| `COMPLETED` | success | green |
| `DRAFT` | neutral | gray |
| `ISSUED` | info | blue |
| `PARTIALLY_PAID` | warn | amber |
| `PAID` | success | green |
| `OVERDUE` | danger | red |
| `GENERATED` | info | blue |
| `SENT` | accent | gold |
| `SIGNED` | success | green |
| `PLANNING` | neutral | gray |
| `ACTIVE` | info | blue |
| `ON_TRACK` | success | green |
| `DELAYED` | warn | amber |
| `NOT_STARTED` | neutral | gray |
| `IN_PROGRESS` | info | blue |
| `SCHEDULED` | info | blue |
| `NO_SHOW` | danger | red |
| `OPEN` | warn | amber |
| `ELIGIBLE` | info | blue |
| `APPROVED` | accent | gold |
| `SUCCESS` | success | green |
| `FAILED` | danger | red |
| `VERIFIED` | success | green |
| `REJECTED` | danger | red |
| `HIGH` (priority) | danger | red |
| `MEDIUM` (priority) | warn | amber |
| `LOW` (priority) | neutral | gray |
| `ACTIVE`/`INACTIVE` (boolean flags) | info / neutral | blue / gray |

If porting to a non-real-estate app, keep the **mechanism** (one map, fixed
tones, override escape hatch) and swap only the left column.

### 5.3 Chart colors follow the same discipline

Charts pull from `--chart-1..5` in a **fixed series order** (never re-cycled
per chart), and where a chart visualizes literal statuses (e.g. an inventory
breakdown by unit status), it reuses the exact `StatusBadge` tone colors
(`bg-success`, `bg-warning`, `bg-info`, `bg-purple`, `bg-destructive`) instead
of the generic chart palette — so a "Sold" bar in a chart is the same purple
as a "Sold" badge in a table, everywhere.

## 6. Component conventions

These are the reusable primitives this app is built from. Reproduce the
*shapes* below; the exact prop names don't matter as much as the visual
contract.

- **PageHeader** — every page opens with: `text-2xl font-semibold
  tracking-tight` title, optional `text-sm text-muted-foreground` description
  below it, a `border-b border-border pb-5` divider, and right-aligned action
  buttons (primary CTA + secondary buttons), `flex-col md:flex-row
  md:items-end md:justify-between`.
- **Panel** (generic card) — `rounded-xl border border-border bg-card
  shadow-card`; optional header row (`border-b px-5 py-3.5`) with a
  `text-sm font-semibold` title + optional right-aligned actions; body
  `p-5`.
- **KpiCard** — `rounded-xl border bg-card p-4 shadow-card
  hover:shadow-elevated transition-shadow`; label as `text-xs font-medium
  tracking-wide uppercase text-muted-foreground`; value as `text-2xl
  font-semibold tracking-tight`; optional trend arrow (`ArrowUpRight`/
  `ArrowDownRight`, green if positive else red) + optional muted hint text;
  optional icon in a `size-9 rounded-lg` tinted square on the right
  (tint = 10–15% tone background, e.g. `bg-primary/10 text-primary`).
- **DataTable** — the workhorse for every list screen. Toolbar row: a search
  input with a leading icon, one `<Select>` per filter (each defaulting to an
  "All X" option), an optional CSV-export button on the right. Table:
  `rounded-xl border bg-card`, `bg-muted/50` header row with `text-xs
  font-semibold uppercase tracking-wide text-muted-foreground` column
  headers (each sortable header is a button with a small `ArrowUpDown`
  icon), `border-t border-border` row dividers, `hover:bg-muted/40` on
  clickable rows. Loading = 6 skeleton rows. Empty = the `EmptyState`
  component inline. Footer: "`x`–`y` of `n`" count + Previous/Next pager.
- **EmptyState** — centered, dashed border (`border border-dashed
  border-border rounded-lg px-6 py-14 text-center`), a muted circular icon
  badge (`size-11 rounded-full bg-muted`), a bold one-line title, an optional
  muted description line, an optional action button/link.
- **StatusBadge** — see §5.
- **ConfirmDialog** — every destructive action goes through this: an
  `AlertDialog` with a title ("Delete X?"), a description ("This action
  cannot be undone."), Cancel + a destructively-styled confirm button
  (`bg-destructive text-destructive-foreground hover:bg-destructive/90`).
  Never use a native `confirm()`/`prompt()`.
- **Form dialogs** — a shadcn `Dialog` (`max-w-md`/`lg`/`2xl` depending on
  field count) containing a React Hook Form + Zod form: `FormField` →
  `FormItem` (`space-y-2`) → `FormLabel` + `FormControl` + `FormMessage`
  (red, `text-xs font-medium`). Multi-field forms use `grid gap-4
  sm:grid-cols-2`. Footer: Cancel (outline) + primary submit button showing a
  pending label ("Saving…") while in flight.
- **ActivityTimeline** — a vertical line (`absolute w-px bg-border`) with
  dot markers (`size-3.5 rounded-full bg-primary border-2 border-card`),
  each entry showing a bold title, a muted description, and a muted relative
  timestamp ("3h ago").
- **Tabs** — shadcn Tabs, pill-style list (`bg-muted rounded-lg p-1`),
  active tab gets `bg-background text-foreground shadow`.
- **Sheet (side drawer)** — used for a quick "detail view" without a full page
  navigation (e.g. clicking a row to preview it): slides from the right,
  `sm:max-w-md`, same `FieldList`/section conventions as a full detail page.
- **FieldList** — label/value definition-list grid (`grid gap-x-6 gap-y-4
  sm:grid-cols-2`); label is `text-xs font-medium tracking-wide uppercase
  text-muted-foreground`, value is `text-sm text-foreground` (falls back to
  an em-dash `—` when empty — **never render a blank cell**).
- **Toasts** — `sonner`, top-right, `richColors` — every mutation shows a
  success toast ("Lead created") on success and an error toast (the thrown
  error's message) on failure. No silent failures, no silent successes.
- **Skeletons** — shadcn `Skeleton` (a pulsing muted block) for any
  loading state; never show a blank screen or a spinner-only screen for
  content that will have a layout once loaded.
- **Currency formatting** — Indian Rupee, `en-IN` grouping, with a compact
  crore/lakh/thousand suffix for space-constrained contexts:
  `₹1,25,00,000` (full) or `1.25 Cr` (compact). Always the ₹ symbol, never
  "INR" or "Rs.".
- **Date formatting** — `dd MMM yyyy` (e.g. "31 Aug 2026"), `dd MMM yyyy,
  hh:mm a` when time matters, relative ("3h ago") for activity feeds.

## 7. Porting checklist

1. Install Tailwind v4 + shadcn/ui (`new-york` style, `slate` base, no
   prefix, CSS variables enabled) in the target app.
2. Copy the entire CSS block from §3 into the target's global stylesheet
   (wherever `@import "tailwindcss"` lives), replacing its existing
   `@theme`/`:root`/`.dark` blocks.
3. Add the Plus Jakarta Sans `<link>` tags (§3.2) to the document head.
4. Re-generate/re-theme every shadcn component you use with `npx shadcn add
   <component>` — they'll automatically pick up the new CSS variables, no
   manual restyling needed.
5. Build the two-column shell (§4): dark `bg-sidebar` column + light main
   column with the sticky blurred header. This one structural decision does
   most of the "premium SaaS" visual work.
6. Build a single `StatusBadge`-equivalent component with a `value → tone`
   map (§5) before building any list screen — retrofitting consistent status
   colors after screens exist is much more error-prone than starting with it.
7. Build the shared primitives in §6 (PageHeader, Panel, DataTable,
   EmptyState, ConfirmDialog, KpiCard, FieldList, ActivityTimeline) once, and
   compose every feature screen from them — don't let individual pages
   invent their own card/table/empty-state markup.
8. Reuse `--chart-1..5` in fixed order for any charting library's series
   colors; reuse the exact status tone colors when a chart visualizes a
   status breakdown.
