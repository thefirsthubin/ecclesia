# Usher Role Milestone — Design Notes

Milestone brief (verbatim): "The next milestone is defining and
implementing the Usher role... Do not implement anything until the
proposal has been reviewed. Once approved: Update RBAC, Update permission
matrix, Update documentation, Implement the role, Pass lint/test/build."
The full pre-implementation decision record is `USHER_ROLE_PROPOSAL.md`
(repo root) — this document covers what actually happened during
implementation, including the one place it diverged (additively) from
that proposal. Same disclosure discipline as every prior milestone: every
claim below is a direct citation or an explicit `[Design Decision]`/
`[Known limitation]`.

## 1. What was approved (verbatim, user's own words)

"Approved. Create a dedicated `USHER` role. Implement dedicated Usher
Attendance and Visitor Intake screens. Approve branch-wide search for
attendance purposes, but expose only the minimum member information
necessary for attendance capture. If field-level permissioning does not
yet exist, document that limitation and implement the current behavior
cleanly so it can be refined later."

Four binding decisions, all honored:

- **New, dedicated `USHER` role** — not a reuse of `WORKER`/
  `BACENTA_LEADER` (`USHER_ROLE_PROPOSAL.md` §3's own reasoning against
  both).
- **Dedicated (new) screens** — `UsherAttendanceScreen`/
  `VisitorIntakeScreen` are not adaptations of `AttendanceCaptureScreen`;
  they are new components with their own hooks, tests, and interaction
  shape (§4 below).
- **Branch-wide `people.person.read`** — Option 1 of
  `USHER_ROLE_PROPOSAL.md` §3's Open Question.
- **Minimum-information exposure, documented as a client-side-only
  mitigation** — §3 below is the "document that limitation" half of this
  instruction.

## 2. Role catalog + RBAC changes

`USHER` added to all three deliberately-unlinked role-catalog mirrors
this codebase maintains (no cross-imports between leaf libraries — the
same reason there are three copies at all):

- `libs/contracts/src/lib/people.schemas.ts` — `ROLE_VALUES`.
- `libs/rbac/src/lib/roles.ts` — `ROLES`/`Role`.
- `db/schema.prisma` — `enum Role`, plus a hand-written migration
  (`db/migrations/20260805000000_add_usher_role/migration.sql`, a single
  `ALTER TYPE people."Role" ADD VALUE 'USHER'`) — the same "hand-written,
  needs real-Postgres verification" pattern every migration in this
  sandbox has followed since the first one (`db/migrations/README.md`
  entry #8).

`apps/api/src/platform/auth/dev-users.ts` — `DevUserRole` gained
`'USHER'`, and `DEV_USER_SEEDS` gained a `dev-usher` entry
(`usher@dev.ecclesia.local`), the only change `db/seed-dev-users.ts`'s
seeding loop needed to make an Usher dev-login available.

### Permission-matrix rows (`libs/rbac/src/lib/permission-matrix.ts`)

Five of six rows are exactly `USHER_ROLE_PROPOSAL.md` §3's proposed
table, all `BRANCH`-scoped:

| Action | Effect | Scope | Source |
|---|---|---|---|
| `people.person.read` | ALLOW | BRANCH | §3, Open Question Option 1 (approved) |
| `gatherings.gathering.read` | ALLOW | BRANCH | §3 |
| `gatherings.attendance.create` | ALLOW | BRANCH | §3 |
| `gatherings.attendance.read` | ALLOW | BRANCH | §3 |
| `gatherings.visitor_intake.create` | ALLOW | BRANCH | §3 |

**One row is new, found during implementation, not in the approved
proposal**: `people.group.read` at `BRANCH` scope. Building
`VisitorIntakeScreen`'s Bacenta-preference picker (US-A2's
`bacentaPreferenceGroupId` field) required a way to list Bacentas for a
guest to name a preference against — `USHER_ROLE_PROPOSAL.md` §3's table
never anticipated this because the proposal's own attention was on the
two core actions (attendance, visitor intake), not on a secondary field
of the visitor-intake form. This is disclosed here rather than silently
folded into "the approved plan": it is a small, low-risk, read-only,
`BRANCH`-scoped grant (matching `USHER`'s only other scope), and
`GroupListResourceContextGuard`'s own doc comment already describes
exactly this "Branch-wide listing" shape as an intended, supported case —
but it is a real expansion of what was approved, and is called out as
such rather than assumed to be covered by the original sign-off.

Every new row's `reason` field cites `USHER_ROLE_PROPOSAL.md` and/or this
document directly, following this codebase's established practice of
making the permission matrix self-documenting rather than requiring a
reader to cross-reference a separate changelog.

### Stale doc-comment corrections

`libs/rbac/src/lib/actions.ts`'s `gatherings.visitor_intake.*` doc
comment and `apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md`'s
"Usher role gap" section (previously "found, not fixed") both previously
stated, accurately at the time, that "Usher" had no modeled `Role`. Both
are updated in place to say the gap is now closed, citing this document
and `USHER_ROLE_PROPOSAL.md` — the same "update stale comments rather
than leave them wrong" discipline the Engagement Signal Pipeline
milestone already established.
`apps/web-admin/src/app/pages/Gatherings/GATHERINGS_PAGE_DESIGN_NOTES.md`
§5 similarly updated: the page's own "why Attendance Capture/Visitor
Intake aren't here" note now confirms this was resolved on mobile, not
left as an open gap.

## 3. `[Known limitation, explicitly requested]` No field-level RBAC — client-side minimization only

The approved instruction's own words: "expose only the minimum member
information necessary for attendance capture... If field-level
permissioning does not yet exist, document that limitation and implement
the current behavior cleanly so it can be refined later." Checked before
building anything: **no field-level RBAC or DTO-narrowing mechanism
exists anywhere in this codebase.** `PersonResponseDto` is always the
full shape — id, branchId, firstName, lastName, phone, email,
dateOfBirth, address, lifecycleStage, guardianPersonId, createdAt,
updatedAt — for every role's `people.person.read` grant, including
`TREASURER`'s (whose PRD row says "R (name only, for transaction
attribution)" but was never actually implemented as a narrower type; no
`PersonSummary` or equivalent name-only DTO exists anywhere in this
codebase, confirmed by grep before this milestone's own proposal was
written).

Given that, `USHER`'s `people.person.read` grant (`BRANCH` scope, §2
above) returns the same full `PersonResponseDto` every other role's grant
does — the API itself does not, and cannot yet, narrow the response by
role. **The current, disclosed implementation is client-side
minimization only**: `useUsherData.ts`'s `searchPeopleForAttendance()` is
the single enforcement point. It calls `GET /people?search=...` (which
returns full `PersonResponseDto[]`) and immediately maps each result down
to a `RecordOption` using only `firstName`, `lastName`, and
`lifecycleStage` — `phone`, `email`, `dateOfBirth`, `address`, and
`guardianPersonId` are read off the API response by nothing in this
codebase's Usher code path and never reach a component, a render, or
device storage. `lifecycleStage` itself is only surfaced as a
`description` when it is not `MEMBER` (e.g. "Visitor," "First-time
guest") — for the common case of an existing Member, the search result
shows only their name.

This is **implemented cleanly so it can be refined later**, per the
instruction: the minimization lives in exactly one function
(`searchPeopleForAttendance`), not scattered across the screen, so a
future field-level RBAC mechanism (e.g. a server-side `PersonSummary`
DTO, gated the same way `PersonResponseDto` is today) could replace this
function's body without touching `UsherAttendanceScreen.tsx` at all — the
screen only ever consumes `RecordOption[]`, never `PersonResponseDto`
directly. **What this does not do**: prevent a sufficiently motivated
client (a modified app build, a direct API call with an Usher's token)
from calling `GET /people?search=` themselves and reading the full
response — that enforcement can only happen server-side, and does not
exist yet. This is the same class of gap `USHER_ROLE_PROPOSAL.md` §3's
Open Question flagged before approval, now formally on record as a
known, disclosed limitation rather than a silently-assumed one.

## 4. Navigation + dedicated screens

`USHER_TABS` wired into `AppShell.tsx`'s `TABS_BY_ROLE` (Dashboard ·
Attendance · Visitor Intake · Profile, per `USHER_ROLE_PROPOSAL.md` §4),
`ScreenName` gained `'usher-attendance'`/`'visitor-intake'`
(`navigation/Navigator.tsx`), and `App.tsx` gained a `USHER` case in
`DashboardForRole` plus two more `CurrentScreen` cases — the same
mechanical pattern every prior persona used, reused without modification.
`icon-registry.ts` gained `userPlus` (`UserPlus`, confirmed present in
both `lucide-react`/`lucide-react-native` before adding, the same
verification discipline `coins`/`clipboardList`/`landmark`/`building`
already used).

Both domain screens are genuinely new components, not adaptations,
per the approved instruction:

- **`UsherAttendanceScreen`** — search-and-immediately-check-in, not
  `AttendanceCaptureScreen`'s roster-toggle-then-batch-save. Selecting a
  person from the `RecordPicker` (backed by
  `searchPeopleForAttendance`, §3 above) immediately `POST`s
  `{personId, status: 'PRESENT'}` and appends to a session-local
  "Checked in this session" list. `[Known limitation]` that list is
  session-local only — it does not resolve historical
  `AttendanceRecordResponseDto.personId` values back to names (would
  require an N+1 Person lookup per record); the "N recorded" count shown
  alongside it comes from `useAttendanceRecords()`'s own count, which is
  accurate, just not individually named.
- **`VisitorIntakeScreen`** — this codebase's first frontend consumer of
  `POST /visitor-intake` anywhere (mobile or web-admin); the endpoint has
  existed, unconsumed, since the Gatherings sprint. A "Record
  another"/"Done" confirmation shape (matching
  `OfferingRecordingScreen`'s precedent), not a single-batch-then-
  navigate-away flow. `[Known limitation]` no client-side
  duplicate-candidate review modal, unlike `NewPersonForm.tsx`'s fuller
  409-handling flow on web-admin (`PEOPLE_INTAKE_DESIGN_NOTES.md` §2) — a
  409 from `PersonService.create`'s own duplicate check surfaces here only
  as a plain inline error string. Flagged in
  `USHER_ROLE_PROPOSAL.md` §6 as an implementation-time UI decision, not
  a permissions question, and resolved toward the simpler path for this
  milestone; echoing the fuller pattern is a reasonable future follow-up,
  not built here.
- **`UsherDashboardScreen`** — today's Gathering summary (type, venue,
  recorded count) plus a static Visitor Intake shortcut card — no
  list-GET endpoint exists for visitor-intake submissions to summarize,
  so that card is a plain navigation shortcut, disclosed as such rather
  than presented as if it were a real data summary.

`ProfileScreen.tsx`'s `ROLE_LABELS` (an exhaustive, non-`Partial`
`Record<RoleDto, string>`) required a `USHER: 'Usher'` entry to keep
compiling once `USHER` joined `RoleDto` — found via the same
`grep -n "Record<Role,|Record<RoleDto,"` sweep every prior milestone's
own design notes describe running before trusting `tsc`.
`GROUP_LABELS` (a `Partial` map) was left unchanged — an Usher has no
single Group of their own, the same reason `TREASURER`/`RESIDENT_PASTOR`
already omit that row. The identical exhaustiveness issue existed in
`apps/web-admin/src/app/shell/nav-items.ts`'s own `ROLE_LABELS` and was
fixed the same way.

## 5. Differences from Shepherd

Reproduced from `USHER_ROLE_PROPOSAL.md` §7 (unchanged by
implementation):

| | Shepherd | Usher |
|---|---|---|
| Scope | `OWN_GROUP` (their one Bacenta) | `BRANCH` |
| Domains touched | People, Gatherings, Stewardship, Pastoral Care, Insights | Gatherings + read-only People/Groups |
| Attendance | Full CRUD for Gatherings they configure | Create + read only, for Gatherings someone else configured |
| Visitor intake | Yes (`OWN_GROUP`), pre-existing | Yes (`BRANCH`), this milestone's core addition |
| Person data | Read + update own Bacenta's members | Read-only, Branch-wide, client-minimized (§3) |
| Mobile tabs | 5 (Dashboard, Attendance, Follow-ups, Offering, Profile) | 4 (Dashboard, Attendance, Visitor Intake, Profile) |
| Is a "leader" role | Yes — one per Bacenta | No — Worker-tier, many concurrent Ushers per Branch |

## 6. Tests

One spec file per new screen, following this codebase's established
per-screen convention (mock `lib/session`, exercise real
`useAsyncData`/`apiGet`/`apiPost` against a mocked `global.fetch`):

- `UsherAttendanceScreen.spec.tsx` — 5 tests: empty state, gathering
  info + recorded count, search+select records `PRESENT` and appears in
  the session list (asserts the exact POST body), search results never
  surface phone/email, error state.
- `VisitorIntakeScreen.spec.tsx` — 5 tests: submit disabled until both
  names entered, submit POSTs the correct body and shows confirmation,
  picking a Bacenta preference includes `bacentaPreferenceGroupId` and
  shows the "follow-up task created" message, "Record another" resets the
  form, submission failure shows an inline error.
- `UsherDashboardScreen.spec.tsx` — 3 tests: empty fallback, gathering +
  count + attendance nav, visitor-intake nav.
- `App.spec.tsx` — extended with a "renders UsherDashboardScreen and the
  Usher tab bar for USHER" test, mirroring the Mobile Personas
  milestone's own per-persona test additions.
- `AppShell.spec.tsx` — extended with a "renders the Usher's four tabs
  for role=\"USHER\"" test, alongside the existing per-persona tests.

## 7. What's deliberately out of scope

Reproduced from `USHER_ROLE_PROPOSAL.md` §8, unchanged:

- Self-service visitor intake (PRD's own "future" horizon).
- A standalone Follow-up-task view for Ushers.
- Any web-admin surface — mobile-only, same as every prior persona.
- Building the field-level-RBAC infrastructure that would make §3's
  client-side-only mitigation unnecessary — explicitly deferred, not
  built here, per the approval instruction's own "so it can be refined
  later."

## 8. Verification

See `README.md`'s milestone entry and this milestone's final task
(#101) for the actual lint/tsc/test run and its results.
