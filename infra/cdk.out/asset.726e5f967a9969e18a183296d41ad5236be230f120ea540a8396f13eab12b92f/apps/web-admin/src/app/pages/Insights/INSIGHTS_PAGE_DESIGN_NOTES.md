# Insights page — design notes

Sixth and final domain page, completing the People → Pastoral Care →
Ministry → Gatherings → Stewardship → Insights sequence. See each of
those pages' own `*_PAGE_DESIGN_NOTES.md` for the reused conventions this
document doesn't re-explain.

## 1. A backend gap-filling sprint this one wasn't

Every prior sprint's task list included a real "Backend gap-filling"
step (a missing list endpoint, a missing ADMIN row, or both).
`apps/api/src/modules/insights` needed none of that: `INSIGHTS_DESIGN_NOTES.md`
records that the whole module — `GET /insights/branch-dashboard`,
`GET /insights/bacenta-dashboard/:groupId`, `GET /insights/cluster-dashboard/:groupId`,
`GET/PATCH /insights/alerts/:id`, every guard, every RBAC row — was
already built and fully wired (module providers, controllers, guards all
registered) before this sprint started. This sprint is frontend-only.

## 2. Why `/insights` isn't just a copy of `/dashboard`

PRD §16.6's "Key surfaces" table and Design System §3.3's traceability
table both name the *same* two capabilities for Web Admin's Insights
domain: "Resident Pastor dashboard" and "Assistant Pastor cluster
dashboard." The first is *also* `apps/web-admin`'s post-login landing
screen (`DashboardPage`/`ResidentPastorDashboard`, built in the
Application Shell sprint) — the PRD's own language treats these as one
capability reachable from two navigation entries (default landing +
persistent sidebar item), not two different features. `InsightsPage`
therefore reuses `ResidentPastorDashboard` directly for
`RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` rather than rebuilding an
equivalent view — the two routes render the identical component.

The second capability — the Assistant Pastor's cluster dashboard — has
no equivalent anywhere else in `apps/web-admin` yet. That's this sprint's
one genuinely new surface: `ClusterInsightsView`.

## 3. Role routing

| Role | What they see | Why |
|---|---|---|
| `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` | `ResidentPastorDashboard` (reused) | `insights.branch_dashboard.read`/`insights.alert.read`/`.resolve`, all `BRANCH` |
| `ADMIN` | New `AdminInsightsView` (read-only) | `insights.branch_dashboard.read`/`insights.alert.read` both `BRANCH`, but **no** `insights.alert.resolve` row anywhere in `permission-matrix.ts` — see §4 |
| `ASSISTANT_PASTOR` | New `ClusterInsightsView` | `insights.cluster_dashboard.read`/`insights.alert.read`/`.resolve`, all `CLUSTER` |
| `BACENTA_LEADER`/`BASONTA_LEADER` | `EmptyState`, "lives on mobile" | Design System §3.3's traceability table names the Shepherd's Bacenta pulse view as a **Mobile** surface, not Web Admin — the same framing `DashboardPage.tsx` already uses for these two roles on `/dashboard` |
| Everyone else (Treasurer, Worker, Member, Visitor) | `EmptyState`, "not available for this role" | No `insights.*` row of any kind for these roles in the PRD §17.3 RACI table — not a gap, Insights was never scoped to them |

`BACENTA_LEADER` does hold `insights.bacenta_dashboard.read` (`OWN_GROUP`)
in the permission matrix, so the backend *would* serve them a Bacenta
dashboard if asked — but Design System §3.3 is explicit that this
specific surface belongs on mobile, and `DashboardPage.tsx` already
established the "your dashboard lives on mobile" framing for exactly
these two roles on the equivalent `/dashboard` route. Building a second,
redundant web-admin version here would contradict that already-made
platform-placement decision, not fill a gap.

## 4. `[Design Decision]` Admin gets a read-only view, not the full dashboard

`permission-matrix.ts` grants `ADMIN` `insights.branch_dashboard.read`
and `insights.alert.read` (both `BRANCH`) but has no
`insights.alert.resolve` row for `ADMIN` anywhere. PRD §17.3's own
Insights row shows Admin "R" only. This is the same class of finding as
Stewardship's zero-ADMIN-rows discovery and Pastoral Care's
`pastoral_care.notes.*` exclusion: configuration authority does not
imply act/dismiss authority over a pastoral alert.

Reusing `ResidentPastorDashboard` wholesale for Admin would render a
Resolve button that always 403s when clicked — a false affordance, not
a "let the backend decide" deferral (that precedent, from Gatherings'
ASSISTANT_PASTOR/BASONTA_LEADER gap, applies to *visibility* gaps where
the whole endpoint 403s; here the endpoint succeeds and only the specific
button's action would fail). `AlertPriorityCard` gained an optional
`readOnly` prop (default `false`, so `ResidentPastorDashboard`'s existing
usage is unaffected) that swaps the Resolve `Button` for a plain "Read
only" `Badge`. `AdminInsightsView` is otherwise a thin composition of the
same three cards (`ChurchPulseCard`, `AlertPriorityCard`,
`RecentActivityCard`) over the same `useBranchDashboard` hook — not a
duplicated data layer, just a different assembly of the same pieces.

## 5. The cluster dashboard's Bacenta picker

`INSIGHTS_DESIGN_NOTES.md` (backend) already discloses that
`GET /insights/cluster-dashboard/:groupId` is a single-Bacenta drill-down,
not a true ranked multi-Bacenta list (`evaluate.ts`'s `CLUSTER` scope
check has no "many Bacentas at once" `ResourceContext` shape — the same
structural limit Pastoral Care's and Gatherings'
`resolveDefaultXQuery(actor)` resolvers worked around by defaulting to
`clusterBacentaIds[0]`, the first Bacenta only, and stopping there).

`ClusterInsightsView` does better than that precedent without needing a
new picker component: `ActorContext.clusterBacentaIds` already holds the
*entire* list of Bacentas in the Assistant Pastor's cluster, so every one
of them is rendered as a `Button` chip (the same filter-chip pattern
Stewardship's state filters and Gatherings' type filter established),
each resolving its label via the existing `GroupNameText`. Clicking a
chip re-fetches the cluster-dashboard endpoint for that Bacenta. It is
still one Bacenta at a time — the backend has no other shape to offer —
but an Assistant Pastor can now move between every Bacenta in their
cluster without leaving the page, rather than being stuck on just the
first one.

## 6. `ChurchPulseCard.scopeLabel`

`ChurchPulseCard`'s heading was hardcoded to "Church Pulse — whole
Branch." Reusing it for a Bacenta's own score needed a different label.
Added an optional `scopeLabel?: string` prop (default `'whole Branch'`,
so `ResidentPastorDashboard`'s existing usage is byte-for-byte
unaffected), interpolated into the same heading text. `ClusterInsightsView`
resolves the selected Bacenta's name via the existing `useGroupName` hook
(the same one `GroupNameText` wraps) rather than passing JSX through the
prop, since the prop is a plain string interpolated directly into
`Heading`'s text content.

## 7. What this sprint deliberately does not build

- **FR-INS-02's weight-configuration screen (H2).** Already disclosed as
  out of scope in the backend `INSIGHTS_DESIGN_NOTES.md` — no endpoint
  exists to write `platform.configurations.church_pulse_weights`, so
  there is nothing for a frontend screen to call.
- **A true multi-Bacenta ranked-list cluster view (US-G2).** See §5 — the
  backend has no such endpoint; the chip picker is the best available
  substitute, not a full replacement for the PRD's ranked-list vision.
- **A Shepherd's own-Bacenta web-admin view.** See §3 — Design System
  §3.3 places this on mobile; `insights.bacenta_dashboard.read`
  (`OWN_GROUP`) exists on the backend for a future mobile consumer, not
  for this page.
- **Person-level Church Pulse.** NFR-PRIV-02 hard gate, already enforced
  structurally at the backend layer (`INSIGHTS_DESIGN_NOTES.md`) — there
  is no endpoint this page could call even if it wanted to.

## 8. Known sandbox limitation

Same as every prior sprint: no `pnpm`/`tsc`/`eslint`/`jest` execution in
this environment. Reviewed statically (import resolution, JSX balance,
prop shapes cross-checked against the actual component source, including
the two small prop additions to `ChurchPulseCard`/`AlertPriorityCard`).
Needs a real `pnpm install && pnpm lint && pnpm test && pnpm build` run
before this can be considered proven correct rather than merely
reviewed.
