# The Ecclesia Design System

**Sprint 12 — Product Experience Sprint I, Objective 1.**

This is the single, implementation-facing reference for Ecclesia's visual
language: what exists, where it lives, and how to use it correctly. It is
the "as-built" companion to `Ecclesia_Design_System_UX_Foundation_v1.0.md`
(the product/UX spec that came first) — that document says what the
product should feel like; this one says exactly which token, component,
and file delivers that feeling today, in `apps/web-admin`.

Nothing in this document is aspirational. Every token value, every
component, every accessibility rule cited here is real code that already
ships, most of it built across the UI Foundation, Nav/Data/Layout, and
Dashboard Redesign sprints that preceded this one. This sprint's job
(per its own brief) was to *establish a reusable design language* and
*reuse existing components where possible* — so this document is
deliberately a synthesis and a small number of closed gaps, not a
rewrite of a working system.

## 0. How to use this document

If you are building a new screen or component in `apps/web-admin`:

1. Start at §4 (Layout patterns) to place the screen inside the shell.
2. Reach for a component in §3 before writing a new `<div>` from scratch.
3. Read a value from `useTheme()` (§1) for every color, space, radius,
   shadow, duration, and breakpoint — never a literal hex code, pixel
   value, or `setTimeout(fn, 200)`.
4. Check §6 (Accessibility rules) before shipping anything interactive.
5. If you think you need a new component, read §7 first — the bar for
   "yes, add it" is that it closes a real, named consistency gap, not
   that it's marginally more convenient than composing existing pieces.

## 1. Foundation: design tokens (`@ecclesia/ui-tokens`)

`libs/ui/tokens/` is pure, framework-free TypeScript — one file per
category, consumed identically by `apps/web-admin` (via `@ecclesia/ui-web`)
and `apps/mobile` (via `@ecclesia/ui-native`). A color, a spacing value,
or "which icon means warning" is decided once and is correct on both
platforms by construction.

### 1.1 Typography

One typeface (Inter, falling back to each platform's system font stack),
nine roles, each bundling size/line-height/weight/letter-spacing/tabular-
numbers as one unit so a component never has to remember to combine four
separate tokens correctly:

| Role | Size / Line-height | Weight | Use |
|---|---|---|---|
| `display` | 40 / 48 | 700 | The one hero number on a page (a KPI, Church Pulse's score) |
| `heading1` | 28 / 36 | 700 | Page title |
| `heading2` | 22 / 28 | 600 | Section title |
| `heading3` | 18 / 24 | 600 | Card title |
| `body` | 15 / 22 | 400 | Default reading copy |
| `bodySmall` | 13 / 18 | 400 | Secondary/supporting copy |
| `caption` | 12 / 16 | 400 | Timestamps, fine print |
| `label` | 12 / 16 | 600 | All-caps field/section labels |
| `numericTabular` | 15 / 22 | 500 | Any number in a table/list that must align vertically |

Rendered via `<Text variant="...">` / `<Heading level={1\|2\|3\|'display'}>`
— never a raw `<span style={{fontSize: ...}}>`.

### 1.2 Spacing

An 8pt rhythm: `spacing[0..16]` = 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
Every gap, padding, and margin in this codebase reads `theme.spacing[n]`,
never a literal pixel number. Card padding is conventionally `spacing[5]`
or `spacing[6]`; gaps between stacked sections are `spacing[4]` or
`spacing[5]`.

### 1.3 Color

Semantic, mode-aware tokens — `theme.colors.<category>.<role>` — never a
raw hex. Five families:

- **`surface`** — `default`/`raised`/`overlay`. Cards sit on `raised`.
- **`text`** — `primary`/`secondary`/`disabled`/`inverse`.
- **`border`** — `default`/`subtle`/`focus`.
- **`brand`** — a deep, warm teal-green (`#1B7A6E` light mode), chosen
  deliberately to avoid both "generic SaaS blue" and any one
  denomination's liturgical color associations. `default`/`hover`/
  `active`/`subtle`/`disabled`.
- **`status`** — five meaning-locked colors (`success`/`warning`/
  `danger`/`info`/`neutral`), each with a `strong` (solid fills, ≥4.5:1
  against white — contrast-verified by `tokens.spec.ts`, not by eye) and
  a mode-dependent `background`/`foreground`/`border` tint triad for
  subtle badges and alert cards.
- **`churchPulse`** — a sixth, dedicated palette (thriving/healthy/
  attention/atRisk) so a Church Pulse score reads as its own recognizable
  gradient, never confused with the generic status palette.

**Rule: status/color is never the sole carrier of meaning.** Every
`Badge`, alert, and trend indicator pairs its color with text or an icon.
This is enforced by convention on every component in §3, not left to
each screen to remember.

### 1.4 Radius, elevation, motion, sizing

- **Radius**: `none` / `sm` / `md` / `lg` / `full`. Cards use `md`;
  pills/badges use `full`.
- **Elevation**: 3 levels (0/1/2), each an `{offsetX, offsetY, blur,
  opacity}` object both platforms consume without a CSS-string
  round-trip. `Card`'s `interactive` mode lifts to the next elevation
  level on hover — see §4.2.
- **Motion**: `motion.duration.fast/standard/slow` and
  `motion.easing.standard/emphasized` (cubic-bezier tuples). Every
  transition and animation in the product reads these, and every
  decorative animation (dashboard fade-ins, `Skeleton` pulse) respects
  `prefers-reduced-motion` via `useReducedMotion()`. `Spinner` is the one
  deliberate exception — see §6.
- **Sizing**: `touchTarget.minWeb` (44px) is the floor for every
  clickable element; `iconSize`/`avatarSize` scales (`sm`/`md`/`lg`).

### 1.5 Breakpoints (Web Admin)

`breakpoints.sm/md/lg/xl`. In practice, two thresholds matter most on
`apps/web-admin` today: **`md`** (1024px) is where `AppShell`'s sidebar
collapses to a toggleable overlay, and where every dashboard's KPI grid
drops from 4 columns to 2 (`isCompact`); **`sm`** (640px) is where every
grid drops to a single column (`isNarrow`). See §4.4 for the exact hook.

### 1.6 Dark mode

`lightPalette` and `darkPalette` (`color.ts`) share identical semantic
key names — a component reads `theme.colors.text.primary`, never
branches on `theme.mode`. This means dark mode is **already correct for
every component in §3** without a retrofit; the only remaining gap is
that no screen has yet exposed a UI toggle to switch `ThemeProvider`'s
`colorScheme` prop away from the default `light`/`system` behavior. That
toggle is one `Switch` in `ConfigurationPage` — an Objective-2-scale, not
Objective-1-scale, follow-up (see §8).

## 2. Theme access

Every component reads tokens through `useTheme()` (React context, set up
once by `<ThemeProvider>` at the app root), never by importing
`@ecclesia/ui-tokens` directly into a screen. This is what makes dark
mode, and any future re-theming, a provider-level change instead of a
find-and-replace across every screen file.

```tsx
const theme = useTheme();
<div style={{ padding: theme.spacing[5], borderRadius: theme.radius.md }}>
```

`useBreakpoint()` / `useResponsiveValue<T>()` and `useReducedMotion()` are
the other two hooks every screen should reach for before hand-rolling a
`matchMedia` listener or an unconditional CSS animation.

## 3. Component library (`@ecclesia/ui-web`)

Every component below ships on both `ui-web` and `ui-native` with
matching props (adjusted for platform event names). This document only
lists the web surface, since this sprint's scope is `apps/web-admin`.

### 3.1 Primitives

`Text`, `Heading`, `Button` (4 variants × 3 sizes, loading/icon slots),
`Card` (optional `interactive` — a real `role="button"`, not a
`<div onClick>`), `Badge` (5 status colors), `Avatar`, `Divider`,
`Spinner`, `Icon` (lucide-backed, see §3.7).

### 3.2 Forms

`Input`, `TextArea`, `Checkbox`, `Radio`/`RadioGroup`, `Switch`, `Select`
— every one ships with label/error/helper-text wiring and the correct
ARIA role out of the box (see §6). There is no screen in this codebase
that should hand-write a labeled text field.

### 3.3 Feedback & designed states

- **`Skeleton`** — loading placeholder, `aria-hidden`, pulse disabled
  under reduced motion.
- **`EmptyState`** — the "no content" designed state. `tone: 'neutral' |
  'positive'` — an empty priority queue is *good news*, and the tone
  prop lets a screen say so instead of defaulting every empty list to a
  gray, apologetic box. See §5 for the copy pattern.
- **`ErrorState`** — the recoverable-error designed state, `role="alert"`,
  optional `onRetry` renders a secondary `Button`.
- **`Toast`** / `useToast()` — transient status messaging from
  anywhere in the tree via `ToastProvider` (mounted once at the app
  root). Portals to `document.body`, `role="status"`
  (`aria-live="assertive"` for `danger`).
- **`Tooltip`** — supplementary hover/focus label, never the *only*
  place information lives.

### 3.4 Overlays

`Modal` (`variant: 'modal' | 'dialog'`, dependency-free focus trap,
`dismissible={false}` for destructive confirmations), `Drawer`
(edge-anchored, reuses `Modal`'s portal/focus-trap logic), `CommandPalette`
(§4.5 — **newly wired into the app shell this sprint**, see below).

### 3.5 Navigation & data (Design System §7 Parts 6–8)

`Sidebar`, `TopBar`, `Breadcrumbs`, `NotificationBell`, `UserMenu` (the
app-shell nav layer, §4.1), `Tabs`, `Accordion`, `Table` (real `<table>`,
sortable `aria-sort` headers, `EmptyState`/`Skeleton` reused for its own
empty/loading rows), `Search` (debounced), `Pagination`, `FilterBar`,
`RecordPicker` (async-searchable single-select for "assign a Person/
Group" flows), `BarChart`/`LineChart` (no charting-library dependency —
every bar's value is real visible text, never encoded only in height).

### 3.6 Page-level composition patterns

These are **not** new components — they're the repeatable *arrangement*
of §3.1–3.5 primitives every screen in this codebase already follows.
Documented here explicitly (closing a real Objective-1 gap: this
pattern existed in practice, in five-plus screens, but had never been
written down once):

- **Page header**: `AppShell`'s `Breadcrumbs` + an `<h1>`-equivalent
  `Heading level={1}`, or, on dashboards, the page's own
  `DashboardHeader`-style greeting block. Every page has exactly one.
- **Section header**: `Heading level={3}` + optional `Text
  variant="bodySmall" color={theme.colors.text.secondary}` subtitle,
  directly inside the section's `Card`, exactly as `ChurchPulseCard`,
  `StaffingTargetsPanel`, and every dashboard sub-card already do.
- **Action bar**: a `flex` row of `Button`s at `spacing[2]` gap, either
  inside a `Card`'s header row (page-level actions) or as its own strip
  above a `Table`/list (bulk/filter actions) — `FilterBar`'s `children`
  slot is the existing primitive for this, not a new component.
- **Quick actions**: `Card interactive` tiles or `QuickActionsRow`'s
  tinted-card-stack pattern (`DashboardPage/QuickActionsRow.tsx`) — a
  named next action, never a bare icon button, per the Design System's
  "no card without an implied next action" rule (Part 4).
- **Forms**: labeled `Input`/`Select`/etc. stacked at `spacing[3]` gap
  inside a `Card` or `Modal`, submit/cancel `Button` row at the bottom —
  `StaffingTargetsPanel`'s "Set target" form and `ReceiptUploadPanel`
  are both this exact pattern, reused, not reinvented.

No new components were introduced for any of the above — composing
existing primitives already produces a consistent result everywhere it's
been applied. Adding a literal `<PageHeader>`/`<SectionHeader>`/
`<ActionBar>` wrapper component was considered and deliberately not
done: every current usage already varies in exactly the ways a rigid
wrapper would fight (dashboard headers carry a greeting + alert count;
list-page headers carry breadcrumbs + a primary action; card headers
carry a badge). Codifying the pattern in prose here, so the next screen
copies it correctly, is the right amount of structure for what's
actually a two-line JSX convention, not a missing abstraction.

### 3.7 Icons

**lucide-react** via one wrapper, `Icon`. `ICON_REGISTRY` (`ui-core`) is
the single source of truth for every semantic icon name Ecclesia uses
(`check`, `alertTriangle`, `coins`, `church`, …) — no screen imports
lucide directly. Adding an icon means adding one line to
`ICON_REGISTRY`, never a scattered import.

## 4. Layout patterns

### 4.1 The application shell (`AppShell.tsx`)

Every authenticated page renders inside `<AppShell breadcrumbs=...
notifications=...>`: persistent `Sidebar` + `TopBar` (breadcrumbs left,
notification bell + user menu right), collapsing to a toggle below `md`.

**`[Correction, Product Experience Sprint II, Phase 1 audit]`** This
section previously documented a second `navVariant="pill"` layout
(`/dashboard` only, a top `PillNav` segmented control instead of the
sidebar) as a "deliberate, disclosed, page-scoped exception." That
variant, and the `navVariant` prop itself, were removed from `AppShell.tsx`
in a later pass than this document ("Final UX Design Specification §12
decision 1... the `navVariant` prop this component used to branch on is
gone entirely, not merely defaulted" - `AppShell.tsx`'s own doc comment).
Every route, Dashboard included, has rendered the one persistent-sidebar
grammar for some time; this document was simply never updated to match.
Corrected here rather than left to mislead the next reader.

A skip-link (`Skip to main content`) precedes everything, and page
content sits inside a `<main id="main-content">` landmark — every page
gets this for free from `AppShell`, never re-implemented per screen.

### 4.2 Cards, hover, and micro-interactions

`Card interactive` is the one hover/press pattern every clickable card
in the product uses: elevation lifts one level and the cursor becomes a
pointer on hover, a visible focus ring on keyboard focus, and
Enter/Space activates it exactly like a click — this is a real
`role="button"` with `tabIndex`, not a styled `<div>`. `KpiCard`,
dashboard KPI tiles across all five personas, and `QuickActionsRow`'s
tinted stack all reuse this one mechanism rather than five different
hover implementations.

**Hero vs. standard resting elevation** (`[Dashboard Visual Redesign]`,
Release 1) — `Card`'s own default (`elevation={0}`, border only) stays
correct for the common case: an ordinary KPI tile, list card, or form
card sitting flat on the page. Exactly one zone per screen may
deliberately opt into `elevation={1}` at rest instead of on hover: the
page's own single hero metric (today, only `ChurchPulseInsightsPanel`
on the Resident Pastor dashboard — the same "exactly one hero metric"
rule already documented for that panel). This is a resting-state
exception granted to a specific, named zone, not a general "raise
elevation for visual interest" license — a second card claiming
`elevation={1}` without being that screen's one hero would just be the
flat-hierarchy problem restated one level up.

### 4.3 Empty & loading states

Every async section in the product follows the same three-state
contract (`useAsyncData`'s `'loading' | 'error' | 'success'`, or the
same shape hand-rolled for demo data):

1. **Loading** → `Skeleton` shapes matching the eventual content's rough
   geometry (never a spinner-in-a-box for list/card content — a spinner
   is reserved for button-level in-flight actions).
2. **Error** → `ErrorState` with a specific title (`"Couldn't load
   Church Pulse"`, never a bare "Error") and an `onRetry` that re-runs
   the same fetch, not a full page reload.
3. **Success, empty** → `EmptyState` with `tone="positive"` when an
   empty result is good news (no open alerts, no overdue follow-ups) and
   `tone="neutral"` when it's simply "nothing here yet" (no Ministries,
   no Gatherings) — see §5 for the audit of where this is and isn't
   applied consistently today.

### 4.4 Responsive breakpoints in practice

Two hooks exist for the same `matchMedia`-driven `isCompact`/`isNarrow`
pattern: `AppShell`'s own inline effect (sidebar collapse) and
`DashboardPage/useDashboardBreakpoint.ts` (grid column counts). Every
dashboard now uses the latter consistently (§ Dashboard polish, below) —
KPI/growth grids run 4 columns above `md`, 2 columns between `sm` and
`md`, 1 column below `sm`. `libs/ui/web`'s own `useBreakpoint()` is the
general-purpose version either of these could be rebuilt on top of in a
future consolidation pass — not done this sprint, to keep this sprint's
blast radius to `apps/web-admin` (per its own "do not introduce
unnecessary abstractions" instruction).

### 4.5 Command palette — newly wired this sprint

`CommandPalette` (`ui-web`) has existed since the Nav/Data/Layout tier of
the UI Foundation sprint but was never actually mounted anywhere in
`apps/web-admin` — a real, closeable gap, not a design decision. This
sprint wires it into `AppShell`: **Cmd/Ctrl+K** from anywhere in the app
(ignored while focus is already inside a text input, so it doesn't hijack
typing) opens a searchable list of every nav destination the current
role can see (`navItemsForRole`, the same data `Sidebar`/`PillNav` already
render — no new data source). This is the sprint's concrete answer to
Objective 4's "the application should require fewer clicks": reaching
any page is now two keystrokes plus a few characters, from anywhere,
without touching the mouse.

## 5. Empty & loading state audit (Objective 5)

Audited every major list/detail page's async states against §4.3's
contract. Findings:

- **Consistent already**: `PeopleListPage`, `GatheringsListPage`,
  `FollowUpTaskQueuePage`, `StewardshipPage`, `StaffingTargetsPanel`,
  every persona dashboard's alert/activity zones — all three states
  present, `EmptyState`/`ErrorState` used correctly, no bare "Loading…"
  text or unstyled error strings found anywhere in this pass.
- **Real gap, fixed this sprint**: none of the five persona dashboards
  had a **loading skeleton for the Church Pulse zone's newly-elevated
  form** until this sprint's `ChurchPulseInsightsPanel` (§ below) — the
  plain `ChurchPulseCard` it replaces already had one; the new, richer
  panel needed its own to match (done — see the component itself).
- **Disclosed, not fixed this sprint**: `InsightsPage`'s cluster
  drill-down (`ClusterInsightsView`) and `BranchPastorDashboard`'s Church
  Pulse zone still render the original, smaller `ChurchPulseCard` rather
  than the new flagship panel — a deliberate scope boundary (§ Church
  Pulse below explains why), not an inconsistency to chase down this
  sprint.

No page in `apps/web-admin` was found using a raw `null` render, a bare
`<p>Loading</p>`, or a native `window.alert` for an error — the
three-state contract was already the norm before this sprint; this pass
is a confirmation, not a rescue.

## 6. Accessibility rules (applies to every component in §3)

- Every interactive element meets the 44px web touch-target floor.
- Every text-on-background color pairing is contrast-verified ≥4.5:1 by
  `ui-tokens/tokens.spec.ts` (a real, from-scratch WCAG 2.1 calculation,
  not a comment asserting it).
- Status/urgency is never color-only — always paired with text or an
  icon (`Badge`, alert cards, trend arrows).
- Every component that manages interaction state exposes it to
  assistive tech (`aria-busy`, `aria-describedby`+`role="alert"` on
  `Input` errors, `aria-expanded` on `Accordion` headers) rather than
  only a visual change.
- Reduced motion is respected for decorative animation (`Skeleton`
  pulse, the dashboard's staggered fade-in-up entrance) and deliberately
  **not** suppressed for informational animation (`Spinner` — WCAG's
  essential-motion exception; hiding it would misleadingly suggest the
  app had stopped working).
- `CommandPalette` (new wiring, §4.5) follows the WAI-ARIA "editable
  combobox with list autocomplete" pattern — `role="combobox"`,
  `aria-expanded`, `aria-controls`, `aria-activedescendant` — and its
  global Cmd/Ctrl+K listener is suppressed while any text field already
  has focus, so it never fights a screen reader user's own typing.

## 7. When to add a new component

The bar (this sprint's own brief, restated): *only introduce a new
component if it improves consistency* — meaning it replaces two or more
existing, slightly-different hand-rolled implementations of the same
idea, or closes a documented gap where no primitive exists at all. This
sprint's one addition, `ChurchPulseInsightsPanel` (below), passes that
bar: it doesn't duplicate `ChurchPulseCard` (which stays exactly as-is
for its other five call sites — the compact Insights/cluster-drilldown
context is a genuinely different job) — it's an intentionally separate,
larger composition for exactly one flagship placement.

## 8. Remaining recommendations (feeds Objective 8 / Sprint II)

- Promote `useDashboardBreakpoint`/`AppShell`'s inline breakpoint effect
  into one shared `ui-web` hook once a third consumer needs it — two
  near-identical implementations is an acceptable, disclosed amount of
  duplication for now (§4.4).
- A visible dark-mode toggle in `ConfigurationPage` — the token/theme
  work is already done (§1.6); only the UI control is missing.
- `PageHeader`/`SectionHeader` as literal components, if a third
  meaningfully-different page layout ever needs the same header shape
  the current five already share by convention (§3.6) — not yet
  justified.
- Storybook for this component library — recommended since the UI
  Foundation sprint, still not built, still recommended as its own
  isolated, separately-verified piece of work given this repo's history
  of build-tooling breakage.
