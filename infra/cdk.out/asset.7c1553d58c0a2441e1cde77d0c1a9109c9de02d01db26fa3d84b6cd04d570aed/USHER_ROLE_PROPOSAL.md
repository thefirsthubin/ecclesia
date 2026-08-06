# Usher Role — Product Proposal (pre-implementation)

**Status: awaiting review. Nothing in this milestone has been implemented
yet** — per the brief's explicit instruction, this document is the
deliverable until it's approved. Same disclosure discipline as every
prior milestone: every claim below is a direct citation (PRD/Blueprint
section or existing code) or an explicit `[Design Decision]`/
`[Open Question]`.

## 0. The gap this proposal closes

"Usher" is named throughout the PRD's narrative — the Gatherings domain's
own stakeholder row ("recorded by Ushers/Leaders," §13.1), the RACI table
(§16.1, row 317: "Gatherings | Ushers / Bacenta & Basonta Leaders |
Assistant Pastors | Church Administration | Resident Pastor"), the
Attendance Capture and Visitor Intake capability rows (§16.4), and Epic
A's own lead user story ("As an Usher, I want to capture a first-time
guest's details..." US-A1, §18) — but **§17.2's formal Role catalog and
§17.3's permission matrix have no Usher row at all.** This is a real gap
in the PRD's own source documents, not a transcription miss: this
codebase already found and flagged it, twice, in its own comments —
`libs/rbac/src/lib/actions.ts`'s `gatherings.visitor_intake.*` doc
comment ("'Usher' is not a modeled `Role`... a genuine gap between the
narrative personas and the formal RBAC model, not something this
milestone invents a fix for") and `permission-matrix.ts`'s matching note
on the same actions. Two of this codebase's own test fixtures even name
their actor `'usher-1'` while typing it `role: 'BACENTA_LEADER'`
(`attendance-resource-context.guard.spec.ts`,
`visitor-intake-resource-context.guard.spec.ts`) — a small, telling sign
that "the Usher" has been informally standing in for whichever leader
role happened to hold the relevant grant, the whole time.

This milestone is the fix those comments deferred: give Usher a real,
narrow identity in the RBAC model instead of continuing to borrow
Shepherd's/Basonta Leader's much broader grants.

## 1. Responsibilities

Drawn directly from the PRD passages above, not invented:

- **Record attendance** at a Gathering (§16.4's "Attendance capture
  screen | Ushers, Shepherds, Basonta Leaders").
- **Capture visitor/first-time-guest intake** at a Gathering — the
  digital replacement for the paper card (§16.4's "Visitor intake form |
  Ushers, self-service (future)"; US-A1).
- Nothing else. The PRD never lists Ushers against Pastoral Care, Ministry
  staffing, Stewardship, or Insights surfaces anywhere — Gatherings
  (attendance + visitor intake) is the entire named scope.

`[Design Decision]` Structurally, an Usher is a **Worker who serves in a
"Ushers" Basonta** — the glossary's own definition of Basonta is "a
ministry/serving team (e.g., Choir, Media, **Ushers**, Technical...)"
(§glossary, and §10.1's stakeholder table: "Basonta (Ministry Team)
Leaders | Lead a serving team (Choir, Media, **Ushers**, Technical,
etc.)"). That membership is what today's Ministry domain already models
(`GROUP_TYPE_VALUES: 'MINISTRY'`, Ministry Leader persona's Roster tab) —
this proposal does not touch that. What's missing is the **functional
grant** to actually record attendance/visitor intake, which membership in
a Basonta alone has never conferred (Workers hold zero Gatherings actions
today — see §3).

## 2. Reporting relationships

Two distinct lines, both PRD-traceable:

- **Ministry/organizational line**: Usher → their Ushers Basonta's
  Basonta Leader (Ministry Leader), the same as any Worker relates to the
  Basonta(s) they serve in (§17.2's Worker row: "Self plus the Basonta(s)
  they serve in"). This governs scheduling/staffing, not data access —
  out of scope for this proposal, already covered by the Ministry
  Leader's existing Roster tab.
- **Functional/data line**: Usher-recorded Gatherings data (attendance,
  visitor intake) rolls up through the same chain every other
  Gatherings-domain actor's data does — BR-ORG-01's hierarchy (Resident
  Pastor → Assistant Pastors → Bacenta Leaders → Members) plus §16.1's
  RACI row naming Assistant Pastors as "Responsible" and Resident Pastor
  as "Informed" for Gatherings. An Usher does not gain any oversight
  authority over anyone — they are the data-entry point, not an
  escalation link, mirroring Worker's existing "no direct reports"
  status.

## 3. Permissions / RBAC actions

**`[Design Decision]` Recommendation: add `USHER` as a new, distinct
`RoleDto` value** (`libs/contracts/src/lib/people.schemas.ts`'s
`ROLE_VALUES`, mirrored in `libs/rbac`'s own role list), not a reuse of
`WORKER`. Reasoning, checked against the actual code rather than assumed:

- `WORKER`'s entire current grant set is five `SELF`-scoped rows (own
  Person read, own role-assignment read, own group-membership read, own
  worker-availability create/read) — **zero** Gatherings actions of any
  kind. Granting Gatherings actions to the generic `WORKER` role would
  hand attendance/visitor-intake capability to *every* Worker in *every*
  Basonta (Choir, Media, Technical, ...), not just Ushers — over-broad
  relative to what the PRD actually asks for.
- Reusing `BACENTA_LEADER`/`BASONTA_LEADER` (as today's guard tests
  informally do) would over-grant an Usher far past their named scope:
  those roles also carry Person update, Group management, Stewardship
  (expense request/receipt, transaction read), Pastoral Care (follow-up
  tasks, notes, silent-drift flags), and Insights dashboard/alert access
  — none of which the PRD ever names for an Usher. See §7's full
  contrast table.
- This exactly mirrors how the Mobile Personas milestone treated Ministry
  Leader/Finance Officer/Resident Pastor — except those three already
  existed as `RoleDto` values with PRD-defined `§17.3` grants waiting to
  be surfaced. Usher has no such row to surface; a new role value is the
  only option that doesn't either under- or over-grant.

### Proposed permission-matrix rows

All `BRANCH`-scoped, not `OWN_GROUP` — an Usher isn't the leader of a
Bacenta/Basonta and the Gathering they serve (Sunday Service) is
typically Branch-wide (`ownerGroupId: null`,
`gatherings.schemas.ts`'s own doc comment: "`ownerGroupId` is omitted for
a Branch-wide Gathering (e.g. Sunday Service)"). `OWN_GROUP` literally
cannot resolve for a Gathering with no owning group — confirmed by
reading `AttendanceResourceContextGuard`/`VisitorIntakeResourceContextGuard`,
both of which already fall back to `{ branchId }` precisely for this
case. `BRANCH` scope is also the exact shape `ADMIN` already holds for
these same two actions today ("support cases only") — this proposal asks
for the same shape as an Usher's *primary* function, not a fallback.

| Action | Effect | Scope | Why |
|---|---|---|---|
| `gatherings.gathering.read` | ALLOW | BRANCH | To find today's Gathering(s) to record against — no role today can read Branch-wide Gatherings except `RESIDENT_PASTOR`/`ADMIN`; an Usher needs this as a baseline lookup, not an oversight grant. |
| `gatherings.attendance.create` | ALLOW | BRANCH | Core responsibility (§1). |
| `gatherings.attendance.read` | ALLOW | BRANCH | Same "record but can't read it back" bug class this codebase has already fixed twice for Shepherd/Ministry Leader (`permission-matrix.ts`'s own `[Bug fix]` rows) — needed so the Usher's own screen can show "N recorded" without a second role's help. |
| `gatherings.visitor_intake.create` | ALLOW | BRANCH | Core responsibility (§1). |

**Deliberately not requested:** `gatherings.visitor_intake.read` (no
`GET` endpoint exists for it anywhere in this codebase today — would be a
dead grant), `people.person.create` (not needed —
`VisitorIntakeService.submit` calls `PersonService.create` as an
internal cross-module call with no second RBAC check at that boundary;
confirmed by reading `person.service.ts`, which has no permission check
inside `create()` itself — only the controller's own
`@RequirePermission('people.person.create')` guards direct `POST
/people`, which an Usher never calls directly), any Stewardship/Pastoral
Care/Insights/Ministry action (never named for Ushers anywhere in the
PRD).

### `[Open Question — needs your decision]` Does attendance-marking need a searchable People directory?

§16.4's own words: "Attendance capture screen | **Ushers**, Shepherds,
Basonta Leaders | Optimized for speed (NFR-PERF-01): **pre-populated
roster** with tap-to-mark-present interaction, not a blank form" — the
same pattern is named for Ushers as for Shepherds. But Shepherd's
existing screen pre-populates from `GET /people?groupId=<ownBacenta>`
(bounded to ~15-30 people). An Usher at a Branch-wide Sunday Service has
no single small group to pre-populate from — the natural equivalent is
`GET /people?branchId=<branch>` (or an unfiltered Branch list), which
means granting `people.person.read` at **BRANCH** scope: full name (and
whatever else `PersonResponseDto` exposes) for every Person in the
Branch, to a Worker-tier role. That's a real privacy tradeoff worth your
explicit sign-off rather than a silent default, given `libs/rbac` has no
field-level restriction mechanism today (the PRD's own "R (name only, for
transaction attribution)" note on Treasurer's row was never actually
implemented as a narrower DTO — checked; no `PersonSummary`/name-only
type exists anywhere in this codebase). Two options:

1. **Grant `people.person.read` at BRANCH scope.** Matches §16.4's
   literal wording exactly. Usher can search/browse the full Branch
   roster to mark attendance. Simplest, most faithful to the PRD text,
   but the widest privacy footprint.
2. **Don't grant it.** The Usher's attendance screen becomes
   visitor-intake-and-headcount only for unknown/new guests, while
   marking *known* members present is left to their own Bacenta's
   Shepherd (who already has this capability, scoped to their own
   Bacenta). Narrower privilege, but a real capability gap against
   §16.4's literal description, and slower for a large Sunday Service.

This proposal's working recommendation is **Option 1** — it's what the
PRD explicitly describes for this exact screen with Ushers explicitly
named as a user — but it is flagged here rather than silently assumed,
per this project's own disclosure standard.

## 4. Navigation

Follows the exact `TABS_BY_ROLE`/`ScreenName` pattern the Mobile Personas
milestone established (`apps/mobile/src/app/navigation/AppShell.tsx`) —
reused, not redesigned:

```
USHER_TABS = [
  { key: 'dashboard',        label: 'Dashboard',       icon: 'home' },
  { key: 'usher-attendance', label: 'Attendance',      icon: 'users' },
  { key: 'visitor-intake',   label: 'Visitor Intake',  icon: 'userPlus' },  // new icon, see §6
  { key: 'profile',          label: 'Profile',         icon: 'user' },
]
```

Four tabs, matching every other persona's tab count. `dashboard` and
`profile` reuse the existing shared keys (no per-persona duplication, the
same rule every other persona already follows) — a new, small
`UsherDashboardScreen` (open-Gatherings-today count, quick links to the
other two tabs — the same shape Ministry/Finance/Pastor dashboards
already use) and the existing shared `ProfileScreen`, generalized further
(one more `GROUP_LABELS` case, or none at all if an Usher has no single
Group of their own — same as Treasurer/Resident Pastor today).

`usher-attendance` and `visitor-intake` are **new screens**, not reuses
of `AttendanceCaptureScreen` — that screen's whole design (roster
pre-populated from one Bacenta, `OWN_GROUP`-scoped) doesn't fit a
Branch-wide Gathering (§3's Open Question). `VisitorIntakeScreen` is
entirely new — **no frontend anywhere in this codebase (mobile or
web-admin) currently calls `POST /visitor-intake` at all**; the backend
has existed, unconsumed, since the Gatherings sprint. This is real net-
new screen work, not persona-wiring around an already-exposed capability
the way Ministry/Finance/Pastor mostly were.

Mobile-only, same as every prior persona — no web-admin surface proposed
(an Usher's job happens at the door with a phone/tablet in hand; nothing
in the PRD names a desktop Usher surface).

## 5. Attendance responsibilities

- Record presence for a Gathering the Usher did not create and does not
  own (BRANCH scope, not `OWN_GROUP`) — a structural difference from
  Shepherd, who only ever records attendance for Gatherings they
  themselves configured.
- Read-back of "N recorded so far" for the same Gathering (own screen's
  own progress indicator only — not a completeness report; that's
  `gatherings.attendance.create`'s existing Admin/Assistant-Pastor-only
  surface, `FR-GTH-05`, untouched by this proposal).
- Does **not** configure/create/edit the Gathering itself
  (`gatherings.gathering.create/update` not requested — that stays
  Assistant Pastor/Bacenta Leader/Basonta Leader/Admin's job, §17.3's
  existing "Gathering: create/configure" row, which never named Usher
  either).
- Does **not** see attendance-completeness alerts, historical trends, or
  any Bacenta's own attendance summary beyond the one Gathering they're
  actively working (no `insights.*` grant requested).

## 6. Visitor Intake responsibilities

- Submit the digital visitor form during/immediately after a Gathering
  (`POST /visitor-intake`, US-A1) — creates a Person at `VISITOR` (or
  `FIRST_TIME_GUEST` if confirmed) and, when a Bacenta preference is
  given, an automatic Follow-up task for the matching Shepherd (US-A2,
  already fully built in `VisitorIntakeService` — this proposal adds no
  new backend logic, only a new caller/consumer).
- Duplicate-candidate handling: none required of the Usher directly —
  `PersonService.create`'s own duplicate check runs regardless of caller
  role; a 409 with candidates is Admin's resolution queue, same as every
  other intake path (`PEOPLE_INTAKE_DESIGN_NOTES.md` §2's existing
  "View this person / Create anyway" pattern would need to be echoed in
  this new screen, or the simpler "surface the error, let an Admin
  resolve later" path — an implementation-time UI decision, not a
  permissions question).
- Does **not** read back submitted visitor intake records
  (`gatherings.visitor_intake.read` not requested — no backing `GET`
  endpoint exists to read from anyway).
- Does **not** own or triage the resulting Follow-up task — that's
  auto-assigned to a Shepherd (or left `followUpTaskCreated: false` for
  manual assignment) per existing `VisitorIntakeService` logic, untouched
  here.
- New icon needed: `userPlus` (`UserPlus` in `lucide-react`/
  `lucide-react-native`) is not yet in `libs/ui/core/src/lib/icon-registry.ts`
  — would need adding and confirming presence in both installed packages
  first, the same verification discipline every prior icon addition
  (`coins`, `clipboardList`, `landmark`, `building`) already used.

## 7. Differences from Shepherd (`BACENTA_LEADER`)

| | Shepherd | Usher (proposed) |
|---|---|---|
| Scope | `OWN_GROUP` (their one Bacenta) | `BRANCH` (whichever Gathering they're working, typically Branch-wide) |
| Domains touched | People, Gatherings, Stewardship, Pastoral Care, Insights (5) | Gatherings only (1) |
| Total grants | ~20 permission-matrix rows | 4 |
| Attendance | Full CRUD for their own Bacenta's Gatherings, which they also create/configure | Create + read only, for Gatherings someone else configured |
| Visitor intake | Yes (`OWN_GROUP`) — already held today | Yes (`BRANCH`) — this proposal's core addition |
| Person data | Read + **update** their own Bacenta's members | No Person grant proposed by default (Open Question §3 governs read-only search) |
| Pastoral Care | Follow-up tasks (create/update), pastoral notes, silent-drift flags — full ownership of their people's care | None |
| Stewardship | Records offerings, requests/receipts expenses, reads their Bacenta's transactions | None |
| Insights | Own-Bacenta dashboard, alert read/resolve | None |
| Mobile tabs | 5 (Dashboard, Attendance, Follow-ups, Offering, Profile) | 4 (Dashboard, Attendance, Visitor Intake, Profile) |
| Reports to | Assistant Pastor (their cluster) | Basonta Leader (Ushers team, ministry line) + rolls into the same Gatherings RACI chain (functional line) — no direct pastoral-oversight relationship |
| Is a "leader" role | Yes — leads a Bacenta, exactly one per Bacenta | No — a Worker-tier serving role, many concurrent Ushers per Branch |

The short version: Shepherd is a broad, standing pastoral-care owner of
one small group across every domain; Usher is a narrow, door-facing
data-entry role in one domain (Gatherings), scoped to the Branch rather
than a group they lead, with no ownership of the people or data they
touch beyond the moment of capture.

## 8. What's deliberately out of scope

- Self-service visitor intake (§16.4's own "self-service (future)" —
  explicitly a later horizon, not this milestone).
- A standalone Follow-up-task view for Ushers — they trigger task
  creation indirectly via visitor intake but never see the queue itself
  (that stays Shepherd/Assistant Pastor's surface).
- Any web-admin surface (§4).
- Building the `people.person.read` field-restriction infra that would
  make Option 2 in §3's Open Question moot — flagged as a possible
  future improvement, not built here regardless of which option is
  chosen.

## 9. Implementation plan (once this proposal is approved — not started)

1. Add `USHER` to `ROLE_VALUES` (`libs/contracts`) and wherever
   `libs/rbac` mirrors the role catalog.
2. Add the four permission-matrix rows from §3 (plus `people.person.read`
   at BRANCH if Option 1 is chosen).
3. Update `GATHERINGS_DESIGN_NOTES.md`/`actions.ts`'s own doc comments —
   the "'Usher' is not a modeled Role" notes this proposal is closing
   need updating in place, not left stale (this codebase's established
   practice, most recently followed in the Engagement Signal Pipeline
   milestone).
4. Build `UsherDashboardScreen`, `UsherAttendanceScreen` (new — not a
   reuse of `AttendanceCaptureScreen`, per §4), `VisitorIntakeScreen`
   (entirely new, first frontend consumer of `POST /visitor-intake`).
5. Wire `USHER_TABS` into `AppShell.tsx`'s `TABS_BY_ROLE`, extend
   `ScreenName`/`App.tsx`'s `CurrentScreen`/`DashboardForRole`, add the
   `userPlus` icon.
6. Generalize `ProfileScreen` further if needed (likely a no-op — Usher
   has no single Group of its own, same as Treasurer/Resident Pastor
   today).
7. Tests per new screen/hook, following this codebase's established
   per-screen convention.
8. Update `README.md` with the milestone summary paragraph.
9. `lint`/`test`/`build`, with the same honest sandbox-limitation
   disclosure this project has followed every prior milestone, then a
   real run on your machine to confirm.

---

**Please review §3 (new role vs. reuse), the Open Question in §3
(searchable directory access), and §4 (new screens vs. reuse) before I
start building** — those three are the decisions with real product/
privacy consequences; everything else in this proposal follows fairly
mechanically once those are settled.
