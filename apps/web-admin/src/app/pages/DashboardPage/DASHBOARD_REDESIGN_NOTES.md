# Dashboard Redesign — design notes

**Brief:** "Ecclesia Sprint 1 — Dashboard Redesign" — a premium, demo-ready
dashboard (Linear/Notion/Stripe-level polish, warm for churches), UI/UX
only, no backend logic or routing changes.

## Reference image iteration

After the first pass, the user shared a screenshot of a language-learning
app's dashboard (pastel pink/lavender gradients, a top pill-shaped nav bar,
a big "Performance Chart" hero card, a "Student Progress"/"Friends Score"
row, a vertical stack of colorful "Select a course" cards) and asked for
"something like this." Two explicit decisions, asked via clarifying
questions before touching anything (a palette swap and a nav-pattern swap
both have a blast radius well beyond this one page):

1. **Keep Ecclesia's teal-green brand color, borrow the layout.** The
   reference's pink/lavender palette is not adopted anywhere — every new
   component below still reads exclusively from `@ecclesia/ui-tokens`
   (`theme.colors.brand.*`/`status.*.background`/`churchPulse.*`), never a
   literal hex value. Adopting the reference's actual palette would have
   meant changing shared color tokens used by every other page in the app
   (buttons, badges, every existing chart), which is a different, much
   larger piece of work than "redesign the dashboard."
2. **Top pill nav for the dashboard specifically, not sitewide.** Every
   other page keeps the persistent sidebar. `AppShell.tsx` gained an
   optional `navVariant?: 'sidebar' | 'pill'` prop (default `'sidebar'` —
   every existing page's behavior is byte-for-byte unchanged), forwarded
   through `ProtectedRoute`. Only `app.tsx`'s `/dashboard` route passes
   `navVariant="pill"`. `PillNav.tsx` (new, `app/shell/`) renders the same
   `navItemsForRole()` data the `Sidebar` already used, as a rounded
   segmented control, plus the same real `NotificationBell`/`UserMenu`
   `AppShell` already rendered — nothing about *what* can be clicked
   changed, only where it's positioned. The dashboard now looks
   deliberately different from every other page's chrome — an accepted
   trade-off, not an oversight.

New/changed components built for this iteration:

- **`PerformanceChartCard.tsx`** — the reference's hero chart card. A
  legend of three swatches (Attendance/Membership/Giving) doubles as a
  metric switcher (local `useState`, no new data source) with a floating
  "+X%" trend bubble. `BarChart`/`LineChart` (`ui-web`) render one series
  each and are unmodified — this doesn't attempt the reference's true
  overlaid-multi-line look (extending those shared components to support
  multiple series is a `ui-web` change, out of scope here, and would
  visually collide anyway: attendance in the hundreds and giving in the
  tens of thousands can't share one y-axis meaningfully).
- **`BacentaLeaderboardCard.tsx`** — maps to the reference's "Friends
  Score" card, repurposed as a per-Bacenta engagement ranking. Demo data
  (`DEMO_BACENTA_LEADERBOARD` in `dashboardDemoData.ts`) — no endpoint
  returns a ranked multi-Bacenta comparison today (`GET
  /insights/branch-dashboard` gives one Branch-wide score; per-Bacenta
  detail is a single-Bacenta drill-down, per `INSIGHTS_DESIGN_NOTES.md`,
  not a ranked list).
- **`QuickActionsRow.tsx`** — restyled a second time, from a horizontal
  tile grid into a vertical stack of tinted cards, mirroring the
  reference's "Select a course" column. Tints rotate through
  `brand.subtle`/`status.info.background`/`status.success.background` —
  existing tokens, not new colors. Same three real routes as before.
- **`ChurchPulseCard`** (existing, unmodified) is still rendered, directly
  under the header, ahead of everything reference-inspired below it — the
  Design System's own Part 4.2 rule ("exactly one hero metric") doesn't
  bend just because the reference's own hero happens to be a chart, and
  this is real, live data, not something to bury under new demo sections.

Final zone order: Header → Church Pulse (primary metric, real data) → KPI
strip → [Performance Chart + (Needs Attention | Bacenta Leaderboard)] next
to [Quick Actions + Prayer Focus] → (Upcoming Events | Recent Activity).

## Scope decision: Resident Pastor's dashboard only

`DashboardPage.tsx`'s role router already only fully builds the Resident
Pastor's dashboard (`RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR`) — every
other role sees an honest `EmptyState` stub. This sprint redesigns that
one real dashboard rather than inventing five more (Ministry Leader,
Finance Officer, Branch/Assistant Pastor, Council Administrator all have
full specs in `Ecclesia_Design_System_UX_Foundation_v1.0.md` Part 4.3, but
no implementation) — building five new dashboards from scratch was not
what "redesign the dashboard" asked for, and would have been a much
larger, differently-scoped piece of work. This is the dashboard a demo
would actually show a prospective client logged in as the Resident
Pastor/Admin persona.

## What changed vs. what didn't

**Unchanged, by design:**

- `ChurchPulseCard.tsx`, `AlertPriorityCard.tsx`, `RecentActivityCard.tsx`
  — zero edits. All three are also rendered by `InsightsPage.tsx` and
  `ClusterInsightsView.tsx` (confirmed via `grep` before touching
  anything). Restyling them in place would have changed those screens too,
  outside this sprint's scope — and their existing implementation already
  uses `Card`/`Badge`/proper spacing tokens, so they already meet "rounded
  cards, soft shadows, professional typography" without modification.
  `ResidentPastorDashboard.tsx` still renders `ChurchPulseCard` (primary
  metric zone) and `AlertPriorityCard` (Needs Attention) directly,
  unmodified.
- `apps/api`, `libs/domain/*`, `libs/rbac`, `db/` — nothing touched.
- `app.tsx`'s route table — no route added, removed, or renamed. Every
  Quick Action / KPI card link target (`/people`, `/stewardship`,
  `/gatherings`, `/insights`, `/ministry`) is a route that already existed.

**New files** (all under `DashboardPage/`, flat — matching this folder's
existing convention, no new subfolder nesting):

| File | Purpose |
|---|---|
| `dashboardDemoData.ts` | Realistic static data: KPIs, upcoming events, 6-month growth series, prayer focus entries, demo church name |
| `useDashboardDemoMetrics.ts` | `useAsyncData`-shaped hook wrapping the demo data (see below) |
| `useDashboardBreakpoint.ts` | Local `isCompact`/`isNarrow` matchMedia hook (mirrors `AppShell`'s own inline one) |
| `DashboardHeader.tsx` | Greeting, date, church name, avatar, notification glance |
| `KpiCard.tsx` | One Members/Attendance/Giving/Volunteers card |
| `QuickActionsRow.tsx` | 4 large action tiles → existing routes |
| `PrayerFocusCard.tsx` | Daily verse card |
| `ChurchGrowthCharts.tsx` | 3 trend panels using the existing `BarChart`/`LineChart` |
| `UpcomingEventsTimeline.tsx` | Timeline layout, demo events |
| `RecentActivityTimeline.tsx` | **New**, separate from `RecentActivityCard` — see below |

`ResidentPastorDashboard.tsx` was rewritten to compose all of the above
around the unchanged `ChurchPulseCard`/`AlertPriorityCard`.

## Why `RecentActivityTimeline.tsx` is a new file, not a `RecentActivityCard.tsx` edit

The redesign brief wants a richer activity feed (visitor intake, giving,
staffing — not just resolved Insights alerts). Blending in
`DEMO_RECENT_ACTIVITY` *inside* `RecentActivityCard.tsx` would have leaked
fabricated demo content onto `InsightsPage`/`ClusterInsightsView`, which
this sprint has nothing to do with. `RecentActivityTimeline.tsx` is a
separate, dashboard-only component: same loading/error/empty pattern,
merges real resolved alerts with the demo activity list, sorted by
recency. `RecentActivityCard.tsx` itself is untouched and still
real-data-only for Insights.

## The KPI/Events/Growth/Prayer-Focus data problem

None of Members/Attendance/Giving/Volunteers totals, an events calendar,
a 6-month growth trend, or a "today's prayer focus" have a backing
`apps/api` endpoint — only `GET /insights/branch-dashboard`
(`pulseScore` + `alerts`) is real. The brief is explicit that this sprint
doesn't touch backend logic, so `dashboardDemoData.ts` supplies realistic,
internally-consistent static numbers instead (GHS currency, Bacenta/
Basonta terminology, matching this codebase's own conventions elsewhere)
— not lorem ipsum, every figure and description is genuine prose
describing a real Ecclesia domain action.

`useDashboardDemoMetrics.ts` wraps this static data in the same
`useAsyncData` shape every real hook uses (with a short artificial delay)
specifically so: (1) every dashboard section shares one consistent
loading/error/success contract regardless of whether its data is real or
demo, and (2) swapping this for a real `apiGet('/insights/dashboard-summary', ...)`
call later is a one-function-body change, not a component rewrite — no
consumer imports `dashboardDemoData.ts`'s constants directly, only this
hook's return type.

**Update, Release 1 blocker fix**: `DEMO_CHURCH_NAME` is gone.
`ActorContextResponseDto` (`libs/contracts`) now carries a real
`branchName`, resolved server-side in `AuthController.getCurrentActor()`
from the actor's own `branchId` (`GET /auth/me`) — `DashboardHeader.tsx`
renders that real value directly. No new branch-resolution mechanism was
added; this reuses the `branchId` `AuthGuard` already resolves for every
request.

## Test change: `DashboardPage.spec.tsx` now wraps `RouterProvider`

`KpiCard`/`QuickActionsRow` call `useNavigate()` to reach existing routes.
`useNavigate()` throws when rendered outside a `RouterProvider`
(`router.tsx`'s own `useRouterContext()` — by design, not a bug). The
spec previously rendered `<DashboardPage/>` inside only `ThemeProvider`,
which would now throw on every test. Added a `renderWithProviders` helper
wrapping `RouterProvider` too — the exact same pattern
`FollowUpTaskQueuePage.spec.tsx` and every other page spec that links
elsewhere already uses. All 4 existing test *assertions* are unchanged;
this is a test-harness fix required by legitimate new UI, not a "routing"
change in the sense the brief meant (no route definition changed).

## Accessibility

- Color is never the sole carrier of meaning: KPI trend direction pairs
  an up/down/flat icon with explicit trend text (`'+12 this month'`,
  `'-8% vs. 4 weeks ago'`), never color alone.
- `KpiCard`/`QuickActionsRow`'s tiles reuse `Card`'s existing `interactive`
  mode (real `role="button"`, `tabIndex`, Enter/Space activation) rather
  than a clickable `<div>`.
- The fade-in-up entrance animation (`styles.css`) respects
  `prefers-reduced-motion: reduce`, the same way `Skeleton`'s pulse
  already does.
- Heading hierarchy: `DashboardHeader` introduces the page's first real
  `<h1>` (the dashboard previously had none) — `ChurchPulseCard`'s
  existing `<h3>` is left as-is (unmodified, shared component) rather than
  chasing perfect h1→h2→h3 sequencing across a component this sprint
  can't restyle; a net improvement over the prior no-h1 state, not a
  regression.

## Deliberately not built this sprint

- A real numeric count-up animation for KPI values — parsing
  `formattedValue` strings like `'GHS 24,500'` back into animatable
  numbers reliably (currency prefix, thousands separators) added
  complexity disproportionate to the visual payoff; the staggered
  fade-in-up entrance plus `Card`'s existing hover-elevation lift covers
  "subtle animations" without that fragility.
- Ministry Leader / Finance Officer / Branch Pastor / Council
  Administrator dashboards — see "Scope decision" above.
- A live aggregate-KPI endpoint — a real product/backend decision, not an
  engineering guess this UI-only sprint should make.

## Verification

Real, in this sandbox (same `node_modules` the user's own `pnpm install`
produced — not the "no registry access" limitation earlier milestones in
this project disclosed). Re-run after the reference-image iteration too
(`PillNav.tsx`, `AppShell.tsx`/`ProtectedRoute.tsx`/`app.tsx`'s
`navVariant` wiring, `PerformanceChartCard.tsx`, `BacentaLeaderboardCard.tsx`,
the restyled `QuickActionsRow.tsx`) — same clean result both times:

- `tsc --noEmit -p apps/web-admin/tsconfig.app.json` — clean, zero errors.
- `tsc --noEmit -p libs/ui/core/tsconfig.lib.json` /
  `libs/ui/web/tsconfig.lib.json` — clean (the new `ICON_REGISTRY`
  entries and every `ui-web` import used).
- `eslint` against every new/changed file — zero errors.
- `tsc --noEmit -p apps/web-admin/tsconfig.spec.json` — fails with
  `TS5095` (`moduleResolution: "bundler"` + this config's own
  `module: "commonjs"` override is an invalid combination under
  TypeScript 5.6.3). **Confirmed pre-existing and unrelated**: this
  error is a config-validation failure that occurs before any source
  file is even read, so it reproduces identically with zero files
  changed — not something this sprint introduced or could fix without
  editing shared `tsconfig.json` files, out of scope here.
- `jest` — still cannot run in this sandbox (`@swc/core`'s installed
  native binding is for a different platform, the same disclosed
  limitation every prior milestone in this project has carried). Every
  new/edited spec assertion was instead manually traced against the real
  component code instead of left as an unverified guess.

## Milestone 11 addendum — the four remaining dashboards

Closes the "Scope decision" section above and Objective 1: Ministry
Leader / Finance Officer / Branch Pastor / Council Administrator, each
now a real `DashboardPage.tsx` route rather than the generic stub.
`ResidentPastorDashboard.tsx` (this file's main subject above) is the
explicit design reference — every new dashboard reuses `DashboardHeader`,
`KpiCard`'s `Card`+`Icon`+`Heading`+`Skeleton` composition pattern,
`TrendCard.tsx` (new, shared — a thin generalization of
`ChurchGrowthCharts.tsx`'s single-series chart-in-a-card so all four new
dashboards and `ChurchGrowthCharts` itself don't each hand-roll one),
`useDashboardBreakpoint`, and the same KPI-grid/alerts/quick-actions/
recent-activity zone ordering.

**`MinistryLeaderDashboard.tsx`** (`BASONTA_LEADER`) — see
`Ministry/MINISTRY_PAGE_DESIGN_NOTES.md` §12 for the full account (real
roster/overcommitment/`StaffingTargetsPanel`/Upcoming Gatherings; demo
Ministry Attendance trend + Recent Ministry Activity).

**`FinanceOfficerDashboard.tsx`** (`TREASURER`) — real data throughout
except Monthly Trends and Financial Alerts: KPI strip (Pending
Verification/Flagged/Pending Expenses/Reconciliation Rate) and Offering
Summary are all computed client-side from `useTransactionQueue`/
`useExpenseQueue`, the same real endpoints `StewardshipPage` already
queries — no new backend work, this dashboard is a curated summary over
data that page already shows in full. Demo: Monthly Trends (reuses
`dashboardDemoData.ts`'s giving series) and Financial Alerts
(`DEMO_FINANCIAL_HIGHLIGHTS`, new) — Stewardship has no alert model or
monthly-aggregate endpoint of its own.

**`BranchPastorDashboard.tsx`** (`ASSISTANT_PASTOR`) — reuses
`ChurchPulseCard`/`AlertPriorityCard` scoped to the actor's Cluster via
`useClusterDashboard` (the same hook `ClusterInsightsView.tsx` already
uses — confirmed via grep before reuse, not a new endpoint), plus real
Follow-up Tasks (`useFollowUpTasks`, filtered to `OPEN`/`IN_PROGRESS`).
Bug caught and fixed during construction: an initial draft referenced a
non-existent `task.taskType` field on `FollowUpTaskResponseDto`; fixed
to render `<PersonNameText personId={task.personId} />` (the field the
real DTO — `pastoral-care.schemas.ts` — actually has), reusing
`PersonNameText` from `PastoralCare/` rather than a third copy (the same
reuse `MINISTRY_PAGE_DESIGN_NOTES.md` §8 already established as this
codebase's convention for id→display-value resolvers).

**`CouncilAdministratorDashboard.tsx`** (`ADMIN`, not
`COUNCIL_OVERSEER`) — `[Design Decision, disclosed]` the brief names this
persona "Council Administrator," and the Design System's persona table
maps it to a synthesized Admin+Overseer role with no clean 1:1 RBAC row.
`permission-matrix.ts` was checked directly: `COUNCIL_OVERSEER` has zero
ALLOW rows anywhere in the matrix (a role that exists in the RBAC enum
but was never wired to any permission), so a dashboard built for it would
403 on every single data call — a broken screen, not a working one.
`ADMIN` is the nearest role that actually holds real grants across every
zone this dashboard needs (BRANCH-scope People/Ministry/Stewardship/
Insights reads). Real data: `useBranchDashboard` (Church Pulse + alerts,
same as Resident Pastor's), People count, Ministry group count. Demo,
disclosed: "Multi-Branch overview" tiles — true multi-branch Council
consolidation is explicitly Horizon 3 (PRD §7.3/§9), so this is
demo-only content clearly labeled as such, not a fabricated real feature.

**Routing change**: `DashboardPage.tsx`'s router no longer groups
`BASONTA_LEADER` with `BACENTA_LEADER`'s mobile-only stub — see that
file's own doc comment. `BACENTA_LEADER` alone keeps the mobile-only
routing (PRD §16.2 still names that persona's mobile dashboard "the
single most important screen in the product," unaffected).

**Verification**: `tsc --noEmit -p apps/web-admin/tsconfig.app.json`
clean this sprint too, covering all four new dashboard files +
`TrendCard.tsx` + the rewritten router. `eslint` could not be re-run
this session — `pnpm`/`corepack`/`npx pnpm@9.12.0` are all unavailable in
this sandbox now (binary missing, `EACCES`, and a `403` from the npm
registry respectively), a new, disclosed limitation this milestone
uncovered that contradicts this same file's own §"Verification" account
of `eslint` running cleanly in an earlier sprint. `jest` still cannot
execute; `DashboardPage.spec.tsx` was rewritten with one smoke test per
newly-routed role (asserting a static, always-rendered heading from each
persona's own file) and manually traced against each dashboard's actual
render output, including a deliberately shaped `ADMIN`-role `fetch` mock
(see the spec's own inline comment on why `/insights/branch-dashboard`
needs a real `{ pulseScore, alerts }` shape while every other endpoint
tolerates the generic `[]` every other test in the file already used).

## Sprint 12 addendum — Product Experience Sprint I

Closes Objectives 2/3/6 of the "Dashboard Experience & Design System
Foundation" brief. Full token/component reference is now
`docs/ECCLESIA_DESIGN_SYSTEM.md` (new, Objective 1) — this addendum only
covers what changed in `DashboardPage/` specifically.

**Church Pulse elevated (Objective 3)**: `ChurchPulseInsightsPanel.tsx`
(new) replaces `ChurchPulseCard` on `ResidentPastorDashboard` only —
same real score/band/`testId="church-pulse-card"`/heading text (so
`DashboardPage.spec.tsx`'s pre-existing RESIDENT_PASTOR assertions are
unaffected), plus a sub-metric row (Attendance/Giving/Volunteer Health
read from the already-real `DEMO_KPIS`, Pastoral Care Alerts from the
real `openAlertCount`, Follow-up Health/Engagement Trend from two new,
disclosed-demo `dashboardDemoData.ts` fields), one computed actionable
insight sentence (open alerts beat a declining KPI beat a positive
default — reuses each KPI's own `actionLabel` copy rather than a second
prose-generation system), and an optional Branch Comparison strip
(`DEMO_COUNCIL_BRANCHES`, same Horizon-3-preview disclosure
`CouncilAdministratorDashboard` already established). `ChurchPulseCard`
itself is untouched and still used exactly as before on its other five
call sites (`InsightsPage`, `ClusterInsightsView`,
`CouncilAdministratorDashboard`, `BranchPastorDashboard`) — deliberately
not swapped everywhere; those are compact/read-only/cluster-scoped
contexts where the full flagship density would be wrong, not a gap.

**Responsive consistency (Objective 6)**: `MinistryLeaderDashboard`,
`FinanceOfficerDashboard`, and `CouncilAdministratorDashboard`'s KPI
grids previously jumped straight from 3–4 columns to 1 below `sm`,
skipping the tablet-range 2-column step `ResidentPastorDashboard`'s own
KPI grid already had. All three now read `isCompact` from
`useDashboardBreakpoint` the same way. `BranchPastorDashboard` has no
KPI grid to fix (its two-card pair grids already collapse correctly).

**Command palette (Objective 4, `AppShell.tsx` not this folder)**:
`CommandPalette` (`@ecclesia/ui-web`) existed since the Nav/Data/Layout
tier of the UI Foundation sprint but was never mounted anywhere in
`apps/web-admin` — confirmed via grep before wiring it. Cmd/Ctrl+K now
opens it from any page (ignored while a text field already has focus),
listing every nav destination `navItemsForRole` already resolves for the
current role. New `AppShell.spec.tsx` (this app had none before) covers
open/close/typing-suppression.

**Verification**: `tsc --noEmit -p apps/web-admin/tsconfig.app.json` and
`tsconfig.spec.json` both clean, covering every new/changed file above.
`pnpm`/`eslint`/`jest` remain unavailable in this sandbox session (same
disclosed limitation as every prior sprint) — every new spec assertion
was manually traced against the real component/hook code instead of
left unverified.

## Dashboard Visual Redesign (Release 1 product review)

Proposal-then-approval pass toward a "premium modern SaaS" visual
direction, scoped by explicit product decisions before any code changed
(full proposal + decisions are in the review conversation, not
reproduced here — this section only records what shipped and why).

**Elevation as hierarchy signal**: `Card`'s existing `elevation` prop
(0 default, border only) now carries a real hero-vs-standard convention,
documented in `ECCLESIA_DESIGN_SYSTEM.md` §4.2: exactly one zone per
screen may rest at `elevation={1}` — today, only
`ChurchPulseInsightsPanel` on the Resident Pastor dashboard. No other
card on any dashboard changed its resting elevation; the point is
contrast against a flat baseline, not a general lift.

**Church Pulse gauge**: `ChurchPulseInsightsPanel` gained a hand-drawn
SVG progress ring (`ChurchPulseGauge`, local to that file — two `<circle>`
elements, `stroke-dasharray`/`stroke-dashoffset`, no charting library),
rendered around the existing real `pulseScore.score`, colored by the
existing `churchPulse` band palette. Decorative (`aria-hidden`) — the
score and band are already real text right next to it. Static on mount,
matching `LineChart`/`BarChart`'s own no-entrance-animation precedent, so
there was no reduced-motion branch to add. **Deliberately not extended**
to `ChurchPulseCard` (Branch Pastor / Super Administrator / Insights) —
Release 1 decision: the flagship treatment stays Resident-Pastor-only for
now; those dashboards get the same visual *system* (elevation, tinted
icon rows) without copying this specific zone's depth.

**KPI sparklines**: new `Sparkline` primitive (`@ecclesia/ui-web`,
`libs/ui/web/src/lib/Charts/Sparkline.tsx`) — same dependency-free plain-
`<svg>` philosophy as `LineChart`/`BarChart`, sized for sitting inline
next to a number rather than as its own chart card, `aria-hidden` (the
KPI's own `trendLabel` text already carries the trend). `KpiCard` takes
an optional `series` prop; `ResidentPastorDashboard` threads through the
exact same real `growthSeriesFromSummary(summaryState.data)` series
`BranchTrendsSection.tsx` already renders on Insights — no new fetch,
no new endpoint. `members`→`membership`, `attendance`→`attendance`,
`giving`→`giving`; `volunteers` has no real series behind it yet and
renders without a sparkline rather than fabricating one.

**Activity/list row restyle (in place, no new component)**: every
icon-bearing list row across the five dashboards
(`RecentActivityTimeline`, `BranchPastorDashboard`'s Upcoming Gatherings,
`FinanceOfficerDashboard`'s Financial alerts,
`MinistryLeaderDashboard`'s Recent ministry activity) now wraps its icon
in the same 36px tinted-circle container `UpcomingEventsTimeline`
already used, instead of a bare `Icon`. Tint follows each icon's existing
semantic color (status `success`/`warning` background pairs, or
`border.subtle` for a neutral/secondary icon, or `brand.subtle` for a
plain brand-colored icon) — no icon changed color, only gained a
consistent container. **Explicitly not extracted into a shared
component** — a Release 1 decision: restyle the existing instances
in place now; revisit extraction later only if real shared
behavior/props (not just matching styles) turns out to be needed.
`AlertPriorityCard` (badge-driven, no per-row icon) and plain
name/text rows (Follow-ups, Ministries, Volunteer availability,
Multi-Branch Overview) were left as-is — this pass only touches rows
that already had an icon.

**Cleanup**: `ChurchGrowthCharts.tsx` removed — confirmed via grep to
have no importers anywhere in `apps/web-admin` (the real growth chart
this dashboard used to render moved to `BranchTrendsSection.tsx`/
Insights per this file's own Milestone 8/decision-8 entry above; this
file was the leftover, never deleted at the time).

**Verification**: unlike every prior entry in this file, `jest` *does*
run in this session's sandbox — every spec above (new and modified) was
executed via `nx test`, not manually traced, and all pass. Flagging the
discrepancy with earlier entries' "jest cannot execute" disclosure
rather than silently continuing to claim a limitation that no longer
applies.

## Second visual redesign pass (Resident Pastor only, composed grid)

Follow-up to the pass above, against a second visual reference (a
project-management-style dashboard) with an explicit instruction: match
its *layout rhythm* only (compact KPI strip, a paired hero, a full-width
analytics chart, a varied multi-column operational row) - not its
terminology, icons, colors, or project-management concepts. Scoped to
`ResidentPastorDashboard` only; the other four persona dashboards are
untouched.

**KPI strip**: `KpiCard` compacted from a tall 3-section vertical stack
into a 3-row card (icon+label / value+sparkline / clipped action
sentence), `padding` 5→4. Four of these now read as a genuine compact
strip instead of four tall single-column cards. Real data unchanged.

**Primary area**: `ChurchPulseInsightsPanel` (hero, `elevation={1}`,
2fr) paired with the new sibling `BranchComparisonCard` (1fr) - Branch
Comparison was previously a subsection *inside* the panel; it's now a
real adjacent card, same `DEMO_COUNCIL_BRANCHES` data and Horizon 3
disclosure. Collapses to one stacked column below `isCompact`.

Inside `ChurchPulseInsightsPanel` itself: the gauge grew (104px→136px)
and the score moved *inside* the ring (a real gauge reading, not a
circle sitting beside the number); the sub-metric grid became a
"WHAT'S CONTRIBUTING" row of compact tinted chips beside the gauge
instead of a tile grid beneath it. Still Resident-Pastor-only -
`ChurchPulseCard`'s other four call sites are untouched, per the
explicit Release 1 decision to keep the flagship treatment on one
persona for now.

**Secondary area**: `PerformanceChartCard` (real Attendance/Membership/
Giving 6-month series, from the same `summaryState` this page already
fetches) is back on the Dashboard, full width, as the "secondary
visualization." This *revises* the Milestone 8 / decision-8 call above
("Dashboard answers what-now, not what-over-time") for this one screen
only, per this pass's explicit brief - `BranchTrendsSection.tsx`'s own
Insights usage of the same component is untouched; it's a second call
site, not a moved one. Follow-up Health has no real time series (only a
single demo percentage), so it is deliberately not charted - "only
visualize series that actually exist."

**Operational area**: Needs your attention / Quick actions+Prayer Focus
/ Upcoming gatherings / Recent activity, composed into one
varied-width row (`1.4fr 1fr 1fr 1.3fr`) instead of two stacked
full-width pairs. `QuickActionsRow` compacted from three full tinted
cards into a tight list of small `Card interactive` rows (reused, not
reimplemented) to fit its narrower column. Collapses to 2×2 below
`isCompact`, one stacked column below `isNarrow`.

**New code**: no new shared/reusable component. `BranchComparisonCard`
is a new *named export*, but it's Church-Pulse-specific extracted JSX,
not a general-purpose primitive - it stays in
`ChurchPulseInsightsPanel.tsx` to reuse that file's own band-color
helpers rather than duplicating them. `PerformanceChartCard`,
`KpiCard`, `Sparkline`, `Card`, `Badge` were all reused as-is or with
prop-compatible internal restyles; none were replaced.

**Verification**: `pnpm nx test ui-web` (152/152), `pnpm nx test
web-admin` (373/373, incl. two new spec files -
`QuickActionsRow.spec.tsx` and `PerformanceChartCard.spec.tsx`, neither
of which had coverage before this pass), `tsc --build
apps/web-admin/tsconfig.json` (clean - see this folder's own note above
on why plain `tsc --noEmit -p` misfires in this repo's composite
project-reference setup), `nx lint web-admin` (clean) - all run for
real via `nx`, not manually traced.

## Third visual redesign pass (a true CSS grid, not stacked bands)

Direct correction to the pass above: standing feedback was that the
second pass, despite having internal columns per section, still read as
a vertical column of independently-stacked full-width bands ("a webpage
containing a collection of cards"), because every section was its own
flex row rather than part of one continuous grid, and nothing spanned
across sections. This pass replaces that with **one real `display: grid`
container** for the whole main content area (below the KPI strip),
using explicit `gridColumn`/`gridRow` line placement per module - the
structural mechanism a reference dashboard's own composition depends on
(a tall list/chart module spanning multiple row-tracks next to a column
of stacked shorter modules), not merely "more columns."

**The grid** (desktop, 4 columns x 3 row-bands):

```
┌────────────────────────────┬──────────────┬──────────────┐
│                            │ Needs your   │              │
│                            │ attention    │              │
│  Church Pulse              ├──────────────┤ Recent       │
│  (col 1-2, row 1-2)        │ Quick actions│ Activity     │
│                            │ + Prayer     │ (col 4,      │
│                            │ Focus        │ row 1-2)     │
│                            │ (col 3,row2) │              │
├────────────────────────────┼──────────────┼──────────────┤
│  Analytics (Attendance/    │  Upcoming    │  Branch      │
│  Membership/Giving chart)  │  Gatherings  │  Comparison  │
│  (col 1-2, row 3)          │ (col 3,row3) │ (col4, row3) │
└────────────────────────────┴──────────────┴──────────────┘
```

Church Pulse and Recent Activity each span both of the first two
row-bands - the two "tall modules" that give the page real spatial
rhythm and let column 3's two single-row modules (Needs your attention,
then Quick actions+Prayer Focus, stacked) read as a genuine third
column rather than a leftover. Row-band 3 is a plain left-to-right row
(Analytics spans 2 columns, then two single cells) - this is the
"secondary visualization + narrow list + narrow list" rhythm, distinct
in composition from row-band 1-2's "two tall modules flanking a stacked
pair."

**KPI cards**: value typography bumped `heading3`→`heading2` and the
sparkline fixed to a small 64x24 - "the number should dominate,
supporting trend information should be secondary." Same real data, same
component, no new props beyond the existing `series`.

**Responsive collapse**: `place()` (`ResidentPastorDashboard.tsx`) is
the one function that computes every module's grid placement, driven
entirely by `useDashboardBreakpoint()`. Below `isCompact` (tablet), the
grid drops to 2 columns and every explicit row-span/column-span is
dropped *except* Church Pulse and the Analytics chart, which keep
spanning both columns (they stay the two "big modules"); everything
else auto-flows into the 2-column grid in DOM order. Below `isNarrow`
(mobile), the grid drops to 1 column and every module is a plain full-
width cell - DOM order is the deliberate reading order (health status →
what needs attention → action items → activity → trends → schedule →
comparison), not desktop cards merely wrapping.

**No new components.** `KpiCard`, `ChurchPulseInsightsPanel`,
`BranchComparisonCard`, `AlertPriorityCard`, `QuickActionsRow`,
`PrayerFocusCard`, `RecentActivityTimeline`, `PerformanceChartCard`,
`UpcomingEventsTimeline` are all reused exactly as the prior pass left
them (or, for `KpiCard`, with a typography-only tweak) - this pass is
entirely a placement/composition change in
`ResidentPastorDashboard.tsx`, not a component rewrite.

**Verification**: `pnpm nx test ui-web` (152/152), `pnpm nx test
web-admin` (373/373), `tsc --build apps/web-admin/tsconfig.json`
(clean), `nx lint web-admin` (clean) - all run for real via `nx`.

## Fourth visual redesign pass (real screenshot, dead-space fix)

Direct correction to the third pass, and the first pass in this whole
history actually verified against a rendered screenshot rather than
DOM/test/CSS-declaration inspection alone. Set up a real local
verification loop for this: `pnpm nx serve api` + `pnpm nx serve
web-admin` against the existing local Postgres + seeded dev users
(`AUTH_MODE=development`, already configured in `.env` - no new
infrastructure), driven by a scratch Playwright + Chromium install
(outside the repo, in the session scratchpad - `chromium-cli` wasn't
available in this sandbox) logging in as the seeded `Resident Pastor`
dev user and screenshotting `/dashboard`.

**What the screenshot found, that no prior pass caught**: the third
pass's 2-row-band spanning grid produced large, real dead-space gaps -
confirmed visually, not guessed. Root cause: a CSS Grid row-band's
height is set by the *tallest single-track item* placed in it, not by
the spanning items crossing it. `Needs your attention` (short) and
`Quick actions + Prayer Focus` (tall, ~380px) ended up in row-bands 1
and 2 respectively; row-band 2's height was therefore driven by the
380px stack, inflating the *combined* height both row-bands offered to
the actually-shorter `ChurchPulseInsightsPanel`/`RecentActivityTimeline`
spanning modules, which left ~150-250px of blank card interior below
each of them - exactly the "huge empty areas" feedback, invisible to
`git diff`/tests/grid-declaration review, obvious in one screenshot.

**The fix**: dropped row-spanning entirely. Two independent, single-row
regions (each a 4-column grid, `alignItems: 'start'` so a shorter card
keeps its own natural height instead of stretching into false empty
space) replace the row-band-span structure:

- Region A: `ChurchPulseInsightsPanel` (2 cols) | Needs your attention +
  Quick actions, stacked (1 col) | Recent Activity (1 col)
- Region B: `PerformanceChartCard` (2 cols) | Upcoming Gatherings
  (1 col) | Branch Comparison + Prayer Focus, stacked (1 col)

Each region's height is now driven only by what's actually in that
region - no cross-region row-track coupling to produce surprise
inflation. Verified clean (no dead space, sensible collapse) at
1600px (desktop), 900px (tablet), and 390px (mobile) via real
screenshots.

**Data note, disclosed**: the local dev database this was verified
against is minimally seeded (8 People, ~GHS 50 total giving, 0
Attendance/Volunteers records) - Church Pulse reads 0/"At risk" and the
Performance Chart is visually flat as a direct, honest consequence of
that seed data, not a rendering bug. A Branch with realistic record
volumes would show real movement in both. Not fabricated to look
better for this screenshot.

**No new components.** Same reuse list as the third pass - this is a
placement-only correction in `ResidentPastorDashboard.tsx`.

**Verification**: `pnpm nx test ui-web` (152/152), `pnpm nx test
web-admin` (373/373), `pnpm nx run web-admin:typecheck` (clean),
`pnpm nx lint web-admin` (clean), plus real rendered screenshots at
three viewport widths - the acceptance test this whole redesign has
been missing until this pass.
