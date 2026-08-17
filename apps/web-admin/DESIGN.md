---
name: Ecclesia — Branch Pastor portal
description: Editorial decision-briefing system for the Branch Pastor's Dashboard, People, Gatherings, Finance, Insights, Pastoral Care, and Login surfaces.
colors:
  brand: "#1F6F5B"
  brand-hover: "#185947"
  brand-active: "#12432F"
  brand-subtle: "#EAF4F0"
  surface-default: "#F9F8F5"
  surface-raised: "#FFFFFF"
  text-primary: "#172026"
  text-secondary: "#5B6472"
  text-disabled: "#98A2AF"
  border-default: "#C4CAD1"
  border-subtle: "#EDEEF1"
  accent: "#8A6318"
  accent-subtle: "#EDE6DA"
  status-success: "#157A52"
  status-warning: "#8A5A00"
  status-danger: "#C24141"
  status-info: "#3B6EA5"
typography:
  display:
    fontFamily: "Fraunces, Georgia, 'Iowan Old Style', serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: "48px"
    letterSpacing: "-0.5px"
  heading1:
    fontFamily: "Fraunces, Georgia, 'Iowan Old Style', serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "36px"
  heading3:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
  bodySmall:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  health-statement:
    typography: "{typography.display}"
    textColor: "{colors.text-primary}"
  card-elevated:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "24px"
  nav-pill:
    rounded: "{rounded.full}"
    padding: "8px 16px"
  nav-pill-active:
    backgroundColor: "{colors.brand-subtle}"
    textColor: "{colors.brand}"
---

## Overview

The Branch Pastor portal (Dashboard, People, Gatherings, Finance, Insights, Pastoral Care, Login) was rebuilt from a KPI-strip-and-cards administrative layout into an editorial decision-briefing system: every screen opens with one real, plainly-stated fact — not a row of equal-weight tiles — then supports it with detail. The goal is a Branch Pastor reading "how is my branch doing" in seconds, in a voice that is calm, human, and specific rather than generic-dashboard.

This document describes the system as actually built this pass, not an aspirational target. It extends the incumbent design system (`libs/ui/tokens`, `libs/ui/web`) — brand green, Inter/Fraunces pairing, 8pt spacing, tight radii — which predates this redesign and was treated as evidence, not replaced. Five new shared components were added; everything else reuses the existing `libs/ui/web` library (`Card`, `Table`, `BarChart`, `Sparkline`, `Badge`, `EmptyState`, `ErrorState`, `Skeleton`).

Scope: page content and composition — the Dashboard/People/Gatherings/Finance/Insights/Pastoral Care/Login redesign — is Branch Pastor (`ASSISTANT_PASTOR`) only. Screens shared across every role (`PeopleListPage`, `PersonDetailPage`, `FollowUpTaskQueuePage`, `LoginPage`) received the same visual vocabulary applied conservatively — header and section treatment, never a compositional rebuild — so every other role's page experience is unaffected in structure and RBAC-sensitive forms were never duplicated or forked.

**One deliberate exception, by explicit later instruction: primary navigation is global, not Branch Pastor-scoped, and now horizontal.** The former persistent left sidebar (`Sidebar`, plus the old `TopBar` it sat beside) is retired entirely, replaced by `TopNav` — a horizontal top bar (wordmark, primary destination pills, trailing user/context controls) used identically by every role/portal (Resident Pastor, Council Administrator, Council Treasurer, Branch Pastor, Branch Administrator, Branch Treasurer, Bacenta Leader, Basonta Leader, System Administrator). There has only ever been one call site (`AppShell.tsx`), so this stays a presentation change to shared chrome, not a parallel nav system. Navigation *content* (which destinations, in what order, for which role) is untouched — it still comes from `nav-items.ts`'s existing `navItemsForRole`/RBAC-driven filtering, unmodified. Retiring the sidebar also returned its 240px column to every page's content width.

## Colors

Unchanged from the incumbent system. `brand` (`#1F6F5B`, a muted deep green, chosen originally to avoid "generic SaaS teal" and denominational overtones) is the one true accent — used for the primary CTA, the current nav item, and `HealthStatement`'s positive tone. A second, small `accent` family (warm ochre, `#8A6318`) exists for decorative-only use and is not part of this redesign. `surface.default` is a whisper-warm off-white, `surface.raised` pure white — cards read crisp against a barely-warmer canvas. Status colors (`success`/`warning`/`danger`/`info`) are a closed, meaning-locked palette; `HealthStatement`'s `attention` tone maps to `status.warning.strong`, never to `danger` — a missing record or a declining trend is a prompt to look, not an error.

## Typography

Two families, used exactly as the incumbent system already scoped them: Inter (`base`) for everything at heading3 and below; Fraunces (`display`) reserved for `display`/`heading1`/`heading2`. This redesign's one real typographic decision was to *actually use* `display` (40px/48px-line-height/700, previously documented as "at most once per screen" but rarely used) as the load-bearing element of the new editorial pattern: a real number or a real short fact, set once per screen, with the supporting sentence directly beneath it in `body`/`bodySmall`. No new type role, no new family — using the existing scale with more intention.

## Layout

Every redesigned screen keeps a single-column flow of stacked sections (`PageHeader` → hero statement → supporting detail), not a fixed dashboard grid. The Dashboard's hero row keeps its pre-existing asymmetric `minmax(0, 68fr) minmax(0, 32fr)` split (Bacenta Performance table dominant, an operational rail beside it) — this ratio already avoided the "six cards in a row" formula and was left in place rather than replaced for its own sake. `TrendPanel`-wrapped charts sit in an even two-column grid where the two series (attendance/giving) are genuinely comparable; nothing was forced into asymmetry where a fair side-by-side comparison was the more honest structure. Responsive collapse (compact/narrow breakpoints, `useDashboardBreakpoint`) is unchanged from the incumbent system.

**`PageContainer` (global, every portal) — the centered content canvas.** Every route-level page in the app now wraps its content in this one shared component instead of an ad hoc `maxWidth` div with no centering — which is what left every screen anchored to the left edge with dead space on the right, on every portal, not just Branch Pastor's. `PageContainer` owns two things: centering (`margin: 0 auto` against the page's own `maxWidth`) and responsive horizontal padding (its own internal `md`/`sm` breakpoint detection, narrower gutters on small screens). It does not force one uniform width — a simple settings form and a dense dashboard keep their own considered `maxWidth` (defaulting to 1120 when a page doesn't specify one), but nothing in the app passes above 1440, so "wide" never reads as "ridiculous" on an ultra-wide monitor. The People workspace's Person profile is the one deliberate exception to "every page uses PageContainer directly" — it renders inside a `Drawer` instead (see Components), which owns its own width.

## Elevation & Depth

Unchanged scale (3 levels, level-0 border-only default). Elevation 1 is now used consistently to mark the one hero card per screen (`branch-health-card`, `insights-trend-hero-card`, `branch-finance-total-card`) — a deliberate signal that this specific card is the page's thesis, distinct from the flat, border-only cards holding supporting tables and lists.

## Shapes

Unchanged: 4/6/8px radius scale, deliberately tighter than a "modern SaaS" default. No new radius values introduced.

## Components

**`PageHeader`** (new) — title (`h1`), an optional real context line (never a decorative tagline — omitted entirely when there's nothing factual to say, e.g. `PeopleListPage`), and an action slot. Replaces five near-identical hand-rolled header blocks across Dashboard, Gatherings, Finance, Insights, and Pastoral Care.

**`SectionHeader`** (new) — the `h3` equivalent, used for every sub-section within a page (Bacenta Health, Giving by Bacenta, Follow-up tasks, Silent-Drift flags, etc.). No eyebrow/kicker text above it, ever (craft-floor rule).

**`HealthStatement`** (new) — the editorial thesis: a `display`-level headline (a real number, or an em dash when a record is genuinely missing — matching the codebase's own existing "missing record" glyph convention), a supporting sentence, an optional real trend (`Sparkline`, only rendered with ≥2 real data points — never fabricated for the sake of having a chart), and a trailing slot for a secondary real stat. Used for: Dashboard (Sunday attendance + attention count), Insights (attendance trend, which genuinely has a multi-month series to draw from), and Finance (Total Giving + trend).

**`AttentionList`** (new) — a row list (label/description/optional action), with a built-in positive-tone `EmptyState` when there is nothing to show. Replaces the Dashboard's hand-rolled "Needs Your Attention" item mapping.

**`TrendPanel`** (new) — owns the loading/error/success switch for a chart (skeleton, retryable `ErrorState`, or real children), without owning a `Card`. Used everywhere a `BarChart` appears (Dashboard's two comparison charts, Insights' two trend charts, Finance's Giving Trend) — as a real byproduct, this also fixed a latent bug where a genuine fetch error had previously been silently rendered as an empty state.

**Existing, more fully leveraged this pass**: `Sparkline` (previously nearly unused; now the trend primitive for every `HealthStatement`), `Heading level="display"` (previously rare; now the load-bearing hero element), `Avatar size="lg"` (Person profile identity block, up from `md`).

**`TopNav` (global top navigation)** — Ecclesia's one navigation visual language: a horizontal bar (wordmark, primary destination pills, trailing user/context controls), used identically by every role. Replaces the former `Sidebar`+`TopBar` pair entirely (both deleted, zero other consumers). Each destination is a pill (`radius.full`): a restrained `brand.subtle`-tinted background and `brand.default` icon/label mark the active item, `surface.default` on hover, the standard on-brand focus outline on keyboard focus, `transparent` otherwise — no border-left accent (Impeccable's own detector flags a side-tab border as the single most recognizable AI-generated-UI tell), no gradient, no glow. A `group` boundary (e.g. the "Administration" cluster) renders as a plain 1px vertical divider in the row, not a text heading — there's no clean way to stack a label above a subset of inline items. Content and RBAC filtering are untouched - the pill row is purely how an already-correct, per-role destination list is drawn.

Three self-contained responsive tiers, each a genuine reconsideration rather than a shrunk desktop bar: **desktop/laptop** (>= 1024px) - the full labeled row, with `overflow-x: auto` as an unconditional safety net so the heaviest real role (`ADMIN`, 9 destinations across two groups) can never break the header regardless of viewport; **tablet** (640-1024px) - the same row, icon-only (each still carrying its label as an accessible name); **mobile** (< 640px) - the row disappears in favor of a single menu trigger, and the full labeled list moves into a `Drawer` (this design system's own existing overlay - real focus trap, Escape-to-close, portal-to-body) sliding in from the left, closed automatically by `AppShell` on every route change.

**`Drawer` as a record detail panel (Branch Pastor's People workspace).** `Drawer` gained an optional `width` prop (default 400, unchanged for every existing consumer) so a content-heavier panel — here, a full tabbed Person record with real Tables inside — can ask for more room (560) without a new component. `PersonDetailPage` renders completely unmodified inside it; the drawer is a presentation change over an already-correct page, not a fork of its data-fetching or RBAC. The underlying route (`/people/:id`) is real and shareable — the drawer's open/closed state is derived from the matched route's own params, not client-only UI state, so browser back/forward opens and closes it for free.

**Gatherings' Bacenta Leaderboard.** A rank badge, a real Bacenta name, a real Church Pulse score (the same cluster-scoped call Insights' own "Bacenta Health" ranking already used, sorted highest-first — no new scoring system). Only rank #1 gets a `brand.subtle`-tinted badge; every other rank is a plain outlined circle with its number — real emphasis on the top result without a gold/silver/bronze medal treatment.

## Do's and Don'ts

- **Do** lead each screen with one real, stated fact before any supporting detail. **Don't** open with a row of equal-weight KPI tiles.
- **Do** leave a `HealthStatement`'s trend empty when no real multi-point series exists. **Don't** fabricate a sparkline, a chart, or a number to make a screen look more finished.
- **Do** use `'attention'` tone for a genuinely missing record or a real negative trend. **Don't** use `'attention'`/`danger` styling for a state that is merely unusual, and don't invent a fourth tone.
- **Do** apply `PageHeader`/`SectionHeader` to a screen shared across every role as a low-risk visual-quality upgrade. **Don't** fork a shared, RBAC-sensitive screen (`PersonDetailPage`, `FollowUpTaskQueuePage`) into a role-specific composition just to go further — the risk of duplicating and drifting on grant/revoke/assign logic outweighs the visual gain.
- **Do** reuse `TrendPanel`/`Card` for every chart's loading/error/success states. **Don't** hand-roll a fourth version of that same three-state switch.
- **Do** keep navigation presentation in the one shared `TopNav` component, used identically by every role. **Don't** build a second, role-specific nav component — navigation *content* differences belong entirely in `nav-items.ts`'s data/RBAC filtering, never in a parallel visual implementation.
- **Do** let the nav row scroll horizontally as the unconditional overflow safety net. **Don't** assume any fixed item count fits every viewport, and don't design only for the lightest role's destination list.
- **Do** wrap every page's content in the shared `PageContainer`. **Don't** hand-roll a per-page `margin`/width fix — that's exactly the ad hoc pattern that caused the dead-space-on-the-right bug this component fixes everywhere at once.
- **Do** reuse an existing page component unmodified inside a new presentation shell (`PersonDetailPage` inside a `Drawer`) when the underlying data/RBAC is already correct. **Don't** duplicate a page's business logic just to change how/where it's displayed.
