# Shepherd Dashboard — design spec

Read this alongside `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`,
`.../pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md` and
`.../gatherings/GATHERINGS_DESIGN_NOTES.md` — this screen is a pure
consumer of those three modules, built on top of the already-locked
Backend Platform, UX Foundation, and Shared UI Foundation (`@ecclesia/
ui-native`). Same discipline as every prior sprint: every design choice
cites the PRD/Design System section it comes from, or is explicitly
flagged `[Design Decision]`/`[Gap]`.

## 0. Reconciling this sprint's brief against the actual repo state

The sprint brief describes the Shared UI Foundation as including
"Navigation... Tables... Forms" and states "these are the ONLY components
you may use — do not recreate components." The actual, verified state of
`libs/ui/native/src/lib/` is 12 components: `Avatar`, `Badge`, `Button`,
`Card`, `Divider`, `EmptyState`, `ErrorState`, `Heading`, `Icon`, `Input`,
`Skeleton`, `Spinner`, `Text`. There is no `Navigation`, `Table`,
`Select`/`Checkbox`/`Radio`, or `Layout` component, and `apps/mobile` has
no navigation library installed (no `react-navigation` in
`package.json`). This is disclosed here rather than silently building new
base components (which the brief explicitly forbids) or silently
pretending navigation exists.

**Resolution**, consistent with "do not build anything except the
Shepherd Dashboard": this sprint builds the Dashboard screen itself,
composed entirely from the 12 existing components plus plain
`View`/`SafeAreaView`/`ScrollView` layout (no new base component is
added to `libs/ui/native`). Where the screen needs to "navigate to the
next feature" (Expected Outcome, item 8), the target screens
(Attendance, Follow-ups, Offering, Profile) do not exist yet and are
explicitly out of scope this sprint, so quick actions and nav
affordances are wired to `onPress` stubs with a `[Design Decision]`
comment rather than a real navigator — this is the honest state, not a
gap silently hidden behind a working-looking tap target.

## 1. STEP 1 — Requirements located (PRD/Design System citations)

- **Shepherd's Bacenta dashboard** is PRD §16.2's own "single most
  important screen in the product" (Key Surfaces table): *"Roster,
  attendance trend, active follow-ups, silent-drift flags."*
- **Shepherd = Bacenta Leader** (`BACENTA_LEADER` role, PRD glossary /
  Design System §2.1 cross-reference).
- It is a **mobile screen** (Design System §2.1, §3.1, §3.3, §4.3) —
  `apps/mobile` + `@ecclesia/ui-native`, not `web-admin`.
- **Design System §4.1/§4.2**: universal dashboard philosophy — *"no
  dashboard card exists without an implied or explicit next action"* —
  and the 5-zone anatomy (Priority / Primary metric / Quick actions /
  Recent activity / Notifications).
- **Design System §4.3** Shepherd's Bacenta dashboard spec table:
  Priority = active follow-ups + silent-drift flags; Primary metric =
  own-Bacenta Church Pulse; Quick actions = Take Attendance / Record
  Offering (persistent primary action, NFR-PERF-01); Recent activity =
  recent attendance/follow-up outcomes; Notifications = alert inbox.
- **Church Pulse** (PRD §12.8, FR-INS-01/03/04/05): weighted Branch/
  Group-level score, compute-on-read, trend-decline alerting
  (`PULSE_DECLINE` alert type), role-scoped (`insights.bacenta_dashboard.
  read`, `OWN_GROUP` scope).
- **Silent-drift** (PRD §15.8 decision tree, FR-PC-05, workflow §19.3):
  nightly sweep (`apps/worker`'s `SilentDriftSweepJob`) flags a Person
  whose Sunday/Wed/Fri attendance meets threshold `N` but whose Bacenta
  attendance falls below threshold `M`, writes a `SilentDriftFlag` row
  scoped to the Person's Bacenta, and notifies the assigned Shepherd with
  the *specific pattern* (US-G3: "3 Sundays present, 3 Bacenta meetings
  absent," not a generic "at risk" label).
- **Follow-up task queue** (PRD §16.2, FR-PC-03/04): auto-created on
  `FirstTimeGuest`/`Lapsed→FollowUp`, assigned to a Shepherd, SLA-tracked
  (3 days First-Time-Guest / 14 days Lapsed, OQ-06), escalates to
  Assistant Pastor if unactioned. §16.2: *"sorted by SLA urgency."*
- **Attendance** (FR-GTH-03/05, NFR-PERF-01): per-instance recording,
  ≤60s active-interaction target; completeness monitoring flags
  Gatherings with no attendance recorded past a configurable window.
- **Notifications emitted**, relevant to a Shepherd (aggregated from
  §16.2/§16.4/§16.6): new Follow-up task assigned; Follow-up SLA breach
  (escalation, informational to the Shepherd whose task escalated);
  silent-drift flag raised; Bacenta Church Pulse decline alert
  (`PULSE_DECLINE`). No PRD section names a distinct "Quick Actions" or
  "Meetings" domain — Quick Actions is Design System §4.2's zone concept
  applied to this persona (Take Attendance / Record Offering, the two
  NFR-PERF-01/§3.3-named critical actions), and "today's meeting" is
  `[Design Decision]`: composed from the Gathering entity FR-GTH-01/02
  already models (a Bacenta Meeting instance), not a new concept.

## 2. STEP 2 — User story

**Primary Goal.** As a Shepherd, when I open the app before or during my
Bacenta's fellowship, I immediately know what needs my attention today —
without hunting across screens.

**Secondary Goals.**
- I can see my Bacenta's Church Pulse trend at a glance and know whether
  to feel good or concerned.
- I can see exactly which members need a specific pastoral action today
  (open follow-ups, silent-drift flags) and why.
- I can jump straight into taking attendance or recording an offering
  when it's time, in line with the ≤60s target.
- I know if something I already acted on (an alert, a follow-up) is
  resolved or still outstanding.

**Success criteria.**
- Every number on the screen has a next action attached (Design System
  §4.2's rule) — nothing is a dead-end statistic.
- Cold load (first paint of skeletons) is fast; real content resolves
  without the Shepherd needing to pull-to-refresh manually on a normal
  connection.
- The screen is usable and legible on a mid-tier Android device
  (NFR-PERF-02's device profile), one-handed, in short usage windows.
- Offline or degraded connectivity never shows a blank/broken screen —
  it shows the last-known data with a clear "offline" state
  (NFR-AVAIL-01/NFR-OFF-01's spirit; this screen is read-mostly, so true
  offline queuing is out of scope, but a stale-but-visible state is not).

**Failure states.**
- No Bacenta assignment (a Shepherd account misconfigured before a
  Group exists) → explicit `EmptyState`, not a crash or infinite
  skeleton.
- API/network failure on any card → that card's own `ErrorState` with
  retry; one failing card must never blank out the whole screen (cards
  are independently fetched).
- Zero follow-ups / zero drift flags → a positive `EmptyState` ("All
  caught up"), not an empty gap, per Design System's "never display
  statistics without actionable context" applied in the negative case
  too.

## 3. STEP 3 — Information architecture

**Page hierarchy.** `App` → `ThemeProvider` → `ShepherdDashboardScreen`
(new root content of `apps/mobile`, replacing the UI Foundation showcase
in `App.tsx`) → `ScrollView` of cards.

**Navigation.** Design System §3.2: bottom tab bar (Dashboard ·
Attendance · Follow-ups · Offering · Profile), Dashboard tab *is* the
quick-action surface. Since only Dashboard exists this sprint, the
screen renders as the sole content with no functioning tab bar chrome
built (see §0) — quick actions and card "view all" affordances are
`onPress` stubs, clearly marked, that a future navigation sprint wires
to real routes.

**Component hierarchy** (see §4).

**Interaction flow.** Screen mounts → each card independently fetches
its own data (parallel, not waterfalled) → skeleton → content/empty/
error per card, independently. Pull-to-refresh re-fetches all cards.
Tapping a card's primary row (a flagged member, a follow-up task) is a
stub this sprint (target screens don't exist) but visually affords
being tappable, consistent with "every card has a next action."

**Responsive behavior.** See §8 (Mobile is this screen's only target
per Design System §2.1/§3.1; desktop/tablet are out of scope for this
persona this sprint — Web Admin is explicitly the secondary surface).

**Accessibility.** See §7.

## 4. STEP 4 — Component tree

```
ShepherdDashboardScreen
├─ SafeAreaView
│  └─ ScrollView (refreshControl → pull-to-refresh all cards)
│     └─ View (padded stack, theme.spacing gap)
│        ├─ DashboardHeader                     — greeting + Bacenta name (Heading/Text)
│        ├─ ChurchPulseCard                      — Primary metric zone (Card + Heading + Badge + trend Text)
│        ├─ PriorityCard (Follow-ups + Drift)     — Priority zone, the §16.2 "most important" content
│        │   ├─ SilentDriftFlagRow[]             — Card row: name, pattern, "reach out" affordance
│        │   └─ FollowUpTaskRow[]                — Card row: name, due/overdue state (Badge), trigger
│        ├─ TodaysMeetingCard                     — [Design Decision] next/today's Bacenta Meeting
│        ├─ AttendanceSummaryCard                 — last-meeting attendance count + trend
│        ├─ QuickActionsRow                       — Quick action zone: Take Attendance / Record Offering (Button, primary — NFR-PERF-01)
│        ├─ NotificationsCard                     — Notifications zone: unresolved alerts (Badge + Text)
│        └─ RecentActivityCard                    — Recent activity zone: last resolved follow-ups/flags
└─ (each card above independently: Skeleton while loading, ErrorState on failure, EmptyState when empty)
```

Every card is a plain composition of `Card`, `Heading`, `Text`, `Badge`,
`Button`, `Avatar`, `Divider`, `Icon`, `Skeleton`, `EmptyState`,
`ErrorState` — no new base component. Row-level lists inside cards
(follow-ups, drift flags) are plain `View`/`FlatList`-free `.map()`
composition (no `Table`/`List` component exists — seven or fewer rows
per card, per the design decision in §5, so a virtualized list is not
warranted).

## 5. STEP 5 — Data requirements per widget

| Widget | Endpoint | Scope/Permission | Loading | Empty | Error | Notes |
|---|---|---|---|---|---|---|
| ChurchPulseCard | `GET /insights/bacenta-dashboard/:groupId` | `insights.bacenta_dashboard.read`, OWN_GROUP | `Skeleton` | n/a (score always present, 0 if no signals) | `ErrorState` + retry | Also returns `alerts` (embedded, §16.6) — `PULSE_DECLINE` alerts feed NotificationsCard |
| PriorityCard — drift flags | `GET /pastoral-care/groups/:groupId/silent-drift-flags?status=FLAGGED` **[Gap — new endpoint, see §6]** | `pastoral_care.silent_drift_flag.read`, OWN_GROUP | `Skeleton` | `EmptyState` "No drift flags" | `ErrorState` + retry | Capped client-side to top 5 by `createdAt` desc |
| PriorityCard — follow-ups | `GET /pastoral-care/groups/:groupId/follow-up-tasks?status=OPEN,ESCALATED` **[Gap — new endpoint, see §6]** | `pastoral_care.followup_task.read`, OWN_GROUP | `Skeleton` | `EmptyState` "No open follow-ups" | `ErrorState` + retry | Sorted by `dueAt` ascending server-side (§16.2 "SLA urgency") |
| TodaysMeetingCard | `GET /groups/:groupId/gatherings?from=<today-start>&to=<7d-out>` **[Gap — new endpoint, see §6]** | `gatherings.gathering.read`, OWN_GROUP | `Skeleton` | `EmptyState` "No upcoming meeting scheduled" | `ErrorState` + retry | Client picks the earliest `scheduledStart` ≥ now |
| AttendanceSummaryCard | Composed: same gatherings list (most recent *past* Bacenta Meeting) + `GET /gatherings/:gatheringId/attendance-records` | `gatherings.gathering.read` + `gatherings.attendance.read`, OWN_GROUP | `Skeleton` | `EmptyState` "No attendance recorded yet" | `ErrorState` + retry | Reuses existing endpoints per STEP 6's "do not invent APIs" instruction — no new aggregation endpoint |
| QuickActionsRow | none (navigation stubs only) | n/a | n/a | n/a | n/a | Take Attendance / Record Offering — `onPress` stub, see §0 |
| NotificationsCard | Derived from ChurchPulseCard's `alerts[]` (no separate fetch — see `INSIGHTS_DESIGN_NOTES.md`'s "Alert inbox: embedded per-dashboard" decision, which this screen inherits rather than re-deciding) | (same as ChurchPulseCard) | (same) | `EmptyState` "No alerts" | (same) | `status === 'OPEN'` only |
| RecentActivityCard | Composed client-side: `status === 'COMPLETED'`/`RESOLVED` items already fetched for PriorityCard, last 5 by resolution date | (same as PriorityCard fetches) | (same) | `EmptyState` "Nothing resolved recently" | (same) | No extra network call |

**Caching.** No client cache layer exists in this codebase yet (no
React Query/SWR dependency found in `package.json`) — each card issues a
plain `fetch` and holds local component state, matching the codebase's
current "no client data-fetching library" state honestly rather than
introducing one unilaterally this sprint. `[Design Decision]`,
flagged as a real follow-up for a future sprint.

**Offline behavior.** This screen is read-only (no attendance/offering
capture happens here — that's explicitly out of scope). NFR-OFF-01's
offline-queue guarantee applies to the *capture* screens, not this one.
This screen's offline behavior is simply: keep the last successfully
fetched data on screen with a small "offline — showing last update"
indicator rather than clearing to an error state, consistent with
NFR-AVAIL-01's spirit without overclaiming the write-path guarantee.

## 6. STEP 6 — API integration (existing vs. missing)

**Reused as-is, no changes:**
- `GET /insights/bacenta-dashboard/:groupId` (`DashboardController`)

**Genuine permission-matrix gaps found and fixed** (the `BACENTA_LEADER`
role could create/update but, in three cases, had no matching `.read`
row at all — a pre-existing bug this sprint fixes since the Shepherd
dashboard is the first real caller that surfaces it):
- `gatherings.gathering.read` had no `BACENTA_LEADER`/`OWN_GROUP` row.
- `gatherings.attendance.read` had no `BACENTA_LEADER`/`OWN_GROUP` row.
- `pastoral_care.followup_task.read` had no `BACENTA_LEADER`/`OWN_GROUP`
  row (create/update existed, read did not).

**New endpoints** (STEP 6 format: Method / Route / DTO / Response /
Validation / Authorization):

1. **`GET /pastoral-care/groups/:groupId/follow-up-tasks`**
   - Query: `status` (optional, comma-separated `OPEN,ESCALATED,
     COMPLETED`; default `OPEN,ESCALATED`).
   - Response: `FollowUpTaskResponseDto[]`, sorted by `dueAt` ascending
     (nulls last).
   - Validation: `groupId` must be a UUID; `status` values must be valid
     `FollowUpTaskStatus` enum members.
   - Authorization: `pastoral_care.followup_task.read`, group-scoped
     guard (mirrors `GroupDashboardResourceContextGuard`).

2. **`GET /pastoral-care/groups/:groupId/silent-drift-flags`**
   - Query: `status` (optional, default `FLAGGED,ESCALATED`).
   - Response: new `SilentDriftFlagResponseDto[]` (id, branchId,
     groupId, personId, attendanceMissedCount, attendanceThreshold,
     bacentaMissedCount, bacentaThreshold, status,
     assignedShepherdPersonId, resolvedAt, escalatedAt, createdAt),
     sorted by `createdAt` descending.
   - Validation: same shape as above.
   - Authorization: new action `pastoral_care.silent_drift_flag.read`
     (no PRD §17.3 row names this surface — same "inferred, disclosed"
     category as `insights.alert.read` — `RESIDENT_PASTOR` BRANCH,
     `ASSISTANT_PASTOR` CLUSTER, `BACENTA_LEADER` OWN_GROUP, `ADMIN`
     BRANCH).

3. **`GET /gatherings`** (query-filtered collection, mirroring
   `FinancialTransactionController`'s `GET /financial-transactions`
   precedent), scoped via a new `ownerGroupId` query param:
   - Query: `ownerGroupId` (required for this screen's use — Branch-wide
     listing with no group filter is out of scope this sprint),
     `from`/`to` (ISO datetime, optional, default now → +30 days).
   - Response: `GatheringResponseDto[]`, sorted by `scheduledStart`
     ascending.
   - Validation: `ownerGroupId` UUID; `from`/`to` ISO datetimes, `from <
     to`.
   - Authorization: `gatherings.gathering.read`, group-scoped guard
     (mirrors `GatheringResourceContextGuard`'s existing group
     resolution, applied to a query param instead of a loaded record).

All three follow the exact repository → service → guard → controller
layering, Zod contract, and `[INFERRED]`-disclosure conventions already
established across every existing module (see the guard/controller pairs
cited above) — nothing here is a new architectural pattern.

## 7. STEP 7 — UX specification

- **Loading.** Per-card `Skeleton` (already built), not a single
  full-screen spinner — cards resolve independently and at different
  speeds; no card should block another's paint.
- **Errors.** Per-card `ErrorState` with a retry button that re-fetches
  only that card.
- **Empty states.** Per-card `EmptyState`, phrased positively where the
  empty state is good news (no drift, no open follow-ups) and neutrally
  elsewhere (no meeting scheduled).
- **Transitions.** No custom animation introduced — `Skeleton`'s
  existing shimmer (built in the UI Foundation sprint) is the only
  motion, already reduced-motion-aware (`useReducedMotion`).
- **Keyboard navigation / focus.** Not applicable to this read-only,
  touch-first mobile screen (no text input on this screen).
- **Accessibility.** Every card's heading is a real `Heading` (screen
  reader landmark); status Badges carry `accessibilityLabel` text, not
  color alone (existing `Badge` component already supports this);
  silent-drift rows state the specific pattern in the accessible label
  ("3 Sundays present, 3 Bacenta meetings absent"), not just "flagged,"
  matching US-G3's own requirement.
- **Mobile adaptations.** This *is* the mobile screen — no adaptation
  layer needed; see §8.

## 8. STEP 8 — Responsive design

Design System §2.1/§3.1: the Shepherd persona is mobile-only for this
surface ("Web Admin is a secondary surface for this persona"). This
sprint therefore targets **one** layout: a single-column vertical stack
of full-width cards inside a `ScrollView`, tuned for a mid-tier Android
phone (NFR-PERF-02). No tablet/desktop breakpoint is built for this
screen this sprint — `[Design Decision]`, consistent with the persona
spec rather than a gap.

## STEP 9 — Implementation summary (what was actually built)

**Backend (`apps/api`, `libs/rbac`, `libs/contracts`):**

- Fixed three real `BACENTA_LEADER`/`OWN_GROUP` permission-matrix gaps
  (`libs/rbac/src/lib/permission-matrix.ts`): `gatherings.gathering.read`,
  `gatherings.attendance.read`, `pastoral_care.followup_task.read` all
  existed for other roles/actions but not for the Shepherd's own read
  path — a Shepherd could create data but never read it back through
  these three endpoints until this sprint.
- Added `pastoral_care.silent_drift_flag.read` (new action) with a full
  role/scope matrix (`RESIDENT_PASTOR` BRANCH, `ASSISTANT_PASTOR`
  CLUSTER, `BACENTA_LEADER` OWN_GROUP, `ADMIN` BRANCH).
- New endpoint: `GET /pastoral-care/groups/:groupId/silent-drift-flags`
  (`controllers/services/repositories/guards/silent-drift-flag.*` in
  `apps/api/src/modules/pastoral-care`) — this codebase's first HTTP read
  path for `SilentDriftFlag` rows, which `apps/worker`'s
  `SilentDriftSweepJob` has written since the Insights milestone.
- New endpoint: `GET /pastoral-care/groups/:groupId/follow-up-tasks`
  (`FollowUpTaskController.listForGroup`, `FollowUpTaskService.listForGroup`,
  `FollowUpTaskRepository.listByGroup`, `FollowUpTaskListResourceContextGuard`)
  — sorted by `dueAt` ascending (SLA urgency, §16.2).
- New endpoint: `GET /gatherings?ownerGroupId=...&from=...&to=...`
  (`GatheringController.listForGroup`, `GatheringService.listForGroup`,
  `GatheringRepository.listByGroupAndRange`,
  `GatheringListResourceContextGuard`).
- New contracts (`libs/contracts`): `listFollowUpTasksQuerySchema`,
  `silentDriftFlagResponseSchema`/`listSilentDriftFlagsQuerySchema`,
  `listGatheringsQuerySchema`.
- `apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md`'s
  "no `SilentDriftFlag` repository/service/controller is built this
  milestone" line has been corrected in place — it was accurate when
  written, stale after the Gatherings/worker milestones, and is now
  further superseded by this sprint's endpoint.

**Frontend (`apps/mobile`):**

- `screens/ShepherdDashboard/ShepherdDashboardScreen.tsx` — the screen
  itself, now `App.tsx`'s root content (replacing the UI Foundation
  showcase).
- `screens/ShepherdDashboard/components/` — one file per STEP 4 card
  (`DashboardHeader`, `ChurchPulseCard`, `PriorityCard`,
  `TodaysMeetingCard`, `AttendanceSummaryCard`, `QuickActionsRow`,
  `NotificationsCard`, `RecentActivityCard`), plus two shared
  screen-local helpers: `CardAsyncBoundary` (the loading/error/success
  split every card reuses) and `PersonNameText` (resolves a `personId`
  row into a display name via `GET /people/:id`). None of these are new
  `libs/ui/native` base components — all are composed from the existing
  12 plus plain RN layout, per §0.
- `screens/ShepherdDashboard/hooks/` — `useAsyncData` (the generic
  loading/error/success/refetch hook) and `useShepherdDashboardData`
  (one hook per card, each a thin `apiGet` + `useAsyncData` composition
  against the exact endpoints in STEP 6).
- `lib/api-client.ts` / `lib/session.ts` — the two `[Design Decision]`
  pieces of scaffolding this screen needed that didn't exist anywhere in
  `apps/mobile` before: a minimal `fetch` wrapper (no HTTP client
  library added) and a placeholder session/actor context standing in for
  a real Cognito sign-in flow (out of scope this sprint — see each
  file's own doc comment and "Known limitations" below).

## STEP 10 — Testing summary

- **Backend**: every new/changed repository, service, guard, and
  controller has a matching `*.spec.ts` following this codebase's
  existing mock-based unit-test convention (no `TestingModule`
  bootstrap) — `silent-drift-flag.{repository,service,controller}.spec.ts`
  and `silent-drift-flag-resource-context.guard.spec.ts` are new;
  `follow-up-task.*` and `gathering.*`'s existing spec files gained a
  `listByGroup`/`listForGroup`/`listByGroupAndRange` describe block each.
  The three permission-matrix bug fixes are exercised indirectly by the
  new guard/controller tests using a `BACENTA_LEADER` actor, not by a
  dedicated `permission-matrix.spec.ts` addition (no such file exists in
  this codebase to extend — scope evaluation itself is
  `libs/rbac`'s own, already-covered `evaluate.spec.ts` concern, not
  this sprint's).
- **Frontend**: `useAsyncData.spec.ts` (loading→success, loading→error,
  `refetch()`, dependency-change re-fetch) using
  `@testing-library/react-native`'s `renderHook`. Component-level tests
  exist for the two most requirement-dense cards —
  `ChurchPulseCard.spec.tsx` (loading/success/error, band→badge mapping)
  and `PriorityCard.spec.tsx` (positive empty state per Design System
  §4.2, the US-G3 specific-pattern text, overdue-badge logic) — with the
  hook module mocked via `jest.mock`. The remaining five cards
  (`TodaysMeetingCard`, `AttendanceSummaryCard`, `QuickActionsRow`,
  `NotificationsCard`, `RecentActivityCard`) are exercised together, with
  real data, by `ShepherdDashboardScreen.spec.tsx` — a full integration
  test mocking `global.fetch` per-endpoint and asserting each of the
  5-zone cards resolves to real content, plus an accessibility assertion
  (`getAllByRole('header')`) that every card's heading is a real,
  discoverable header. This is a disclosed scoping choice, not an
  oversight: dedicated per-card unit tests for all seven cards would be
  more thorough but mostly duplicate what the integration test already
  exercises end-to-end.
- `App.spec.tsx` (previously asserting the UI Foundation showcase's
  scaffold heading) now stubs `global.fetch` to reject and asserts the
  Dashboard's header renders — the same "one card's error never blanks
  the rest of the screen" property STEP 7 requires, exercised at the
  `App` root.
- A real fix, found while wiring the above:
  `Skeleton` (used by every card's loading state, via
  `CardAsyncBoundary`) needs `NativeAnimatedHelper` mocked under Jest,
  the same fix `libs/ui/native/src/test-setup.ts` already carries — added
  to `apps/mobile/src/test-setup.ts`. Also mirrored `libs/ui/native`'s
  own `tsconfig.app.json`/`tsconfig.spec.json` `test-setup.ts`
  exclude/include split in `apps/mobile`'s equivalent files, once that
  file's new `jest.mock(...)` call needed Jest's ambient types.

## STEP 11 — Developer notes / future extension points

- **Real navigation.** The single largest structural gap (§0). Once a
  navigator is installed, `QuickActionsRow`'s two stub callbacks and
  every card's implicit "tap to see more" affordance are the integration
  points — no card component needs to change shape, only
  `ShepherdDashboardScreen`'s two `onPress` stubs.
- **Real auth.** `lib/session.ts`'s `useSession()` is the single seam a
  real sign-in flow replaces — every hook in `useShepherdDashboardData.ts`
  already consumes it, so nothing downstream changes.
- **A client data-fetching/caching library.** `useAsyncData` is
  intentionally minimal (STEP 5). If request deduplication, background
  refetch, or cross-card cache sharing (e.g. `PersonNameText` rows for
  the same `personId` appearing in both `PriorityCard` and
  `RecentActivityCard` currently issue independent requests) becomes a
  real performance concern, this is the file to replace.
- **Branch-wide `GET /gatherings` (no `ownerGroupId`).** Not built —
  only the group-scoped case this screen needs. A future Resident
  Pastor/Assistant Pastor calendar surface would need this added.
- **A batch `GET /people?ids=...` endpoint.** `PersonNameText` currently
  makes one `GET /people/:id` call per row (capped at 5 rows per card per
  STEP 4/5). Fine at this scale; would need revisiting if row counts grow.

## Known limitations (disclosed, not silently fixed)

- **`INSIGHTS_DESIGN_NOTES.md`'s Engagement Signal ingestion gap** may
  still mean Church Pulse reads as low/zero in a fresh environment
  depending on whether `apps/worker`'s consumers are deployed and
  producers wired end-to-end in the target environment — inherited, not
  re-solved, by this screen.
- **No client data-fetching/caching library** — see STEP 5's "Caching"
  row.
- **No real navigation** — see §0. Quick actions and card taps are
  visually complete but functionally stubbed pending a future navigation
  sprint.
- **`GET /gatherings` Branch-wide (no `ownerGroupId`) listing** is not
  built — only the group-scoped case this screen needs.
