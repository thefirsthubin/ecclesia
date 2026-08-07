# Ministry page (Web Admin) — Design Notes

Sprint: "Ministry Web Admin" — the third domain page built on the
Application Shell, following the same discipline as
`People/PEOPLE_PAGE_DESIGN_NOTES.md` and
`PastoralCare/PASTORAL_CARE_PAGE_DESIGN_NOTES.md` (read those first; this
doc doesn't re-explain their router/`useAsyncData` conventions).
Replaces the `/ministry` `StubPage` and adds a new `/ministry/:groupId`
route.

## 1. What this sprint builds

PRD §16.3's Key Surfaces table, scoped to what's honestly buildable:

| Surface | Built? | Notes |
|---|---|---|
| Basonta roster view | Yes | `BasontaRosterView` — current workers + overcommitment flag, FR-MIN-01/FR-MIN-04 |
| Staffing gap view (H2) | No | §4 — no list-by-Basonta read path exists; every Staffing Target is tied to one specific Gathering, and there's no Gathering picker on web-admin |
| Worker availability self-service (H2) | No | §5 — a `SELF`-scoped write flow (Worker/Member marking themselves unavailable), not an oversight-role read view; a different page's job |

Basonta *directory* (`BasontaDirectoryPage`) isn't a PRD-named surface on
its own — it's the necessary first tier for a BRANCH-scoped role to reach
any specific roster at all, the same role the People sprint's directory
plays before `PersonDetailPage`.

## 2. Backend gap-filling (companion to this doc)

Two real gaps: no ADMIN row on any `ministry.*` read action, and no way
to enumerate Groups (Basontas) at all — every roster route needs an
already-known `groupId`. Full reasoning lives in
`apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`'s "Resolved
(Ministry Web Admin sprint)" section and
`apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`'s "Ministry Web
Admin sprint follow-up" section (the new `GET /groups` endpoint lives in
the People module, since Groups are People-schema-owned — not
duplicated here).

## 3. Why the directory only works for BRANCH-scoped roles

`GroupListResourceContextGuard` (backing the new `GET /groups`) always
resolves to the actor's own Branch — there's no per-request Group to
derive an OWN_GROUP/CLUSTER scope from when the whole point of the route
is *listing* Groups. Concretely:

- `BASONTA_LEADER` already knows their own single Basonta
  (`actor.basontaId`) and never needs the directory — `MinistryPage`
  routes them straight to `BasontaRosterView` for their own group,
  skipping `GET /groups` entirely.
- `ASSISTANT_PASTOR`'s CLUSTER scope cannot match a bare `{ branchId }`
  resource at all (`evaluate.ts`'s CLUSTER case requires a `bacentaId` to
  test set-membership against, and Basontas never populate one — the same
  structural limitation `MINISTRY_DESIGN_NOTES.md` already discloses for
  every Basonta-scoped Ministry action). An Assistant Pastor visiting
  `/ministry` sees `BasontaDirectoryPage`'s `ErrorState` from a 403, not a
  silently-empty list — an honest reflection of a real, already-disclosed
  gap, not something newly broken by this page.
- `RESIDENT_PASTOR`/`ADMIN` (BRANCH scope) are this directory's real
  audience, and the only roles who can successfully call it.

## 4. Why Staffing Targets aren't shown

`GET /ministry/staffing-targets/:id` reads one target by id — there is no
"list staffing targets for this Basonta" endpoint, because a
`StaffingTarget` is keyed to a specific `(gatheringId, groupId)` pair
(FR-MIN-02/03), not the Basonta alone. Showing staffing adequacy on the
roster view would require either a new list-by-group endpoint *and* a
Gathering picker (to choose which upcoming Gathering's target to view/set)
— neither exists, and building a Gathering-selection UI is a
meaningfully separate piece of work, not a one-line addition. Deferred
in full, the same class of decision as Pastoral Care's Escalate action
needing an as-yet-unbuilt Person picker.

## 5. Why Worker Availability isn't shown

§16.3 itself names "Worker/Member" as this surface's persona, not the
oversight roles (`RESIDENT_PASTOR`/`ADMIN`) this page's directory serves.
It's a `SELF`-scoped self-service write flow ("mark myself unavailable
for a date range") — a fundamentally different page (something closer to
a personal profile/settings surface any authenticated worker would use,
not a Ministry-oversight page), and out of scope for this sprint.

## 6. Overcommitment as a Badge, not a separate section

`RosterService.listOvercommitmentFlags` and `.listRoster` are both
already computed from the same active-membership set server-side
(`MINISTRY_DESIGN_NOTES.md`'s own FR-MIN-04 section). `BasontaRosterView`
fetches both and cross-references by `personId`, showing an
"Overcommitted" `Badge` inline on the flagged row rather than a
duplicate list — the same "make an implicit cross-reference visible
in-line" judgment `FollowUpTaskQueuePage`'s Overdue badge already used.

## 7. Component structure — a view/route-wrapper split, not `useParams()` directly

`BasontaRosterView({ groupId })` is a plain presentational component with
no router dependency, unlike `PersonDetailPage` (which reads
`useParams()` directly). This page needed the split because
`BasontaRosterView` has two different callers: `BasontaRosterPage`
(`/ministry/:groupId`, resolves `groupId` from the route) and
`MinistryPage` (renders it directly for a Basonta Leader's own
`actor.basontaId`, no route param involved at all). `[Design Decision]`
— a genuinely different shape from People's, not an inconsistency.

## 8. Person name resolution — reused, not reimplemented a third time

Roster rows show Person names via `PersonNameText`, imported directly
from `../PastoralCare/PersonNameText` rather than a third copy. This is
the second time a component originally written for one page folder has
been imported into another (`PastoralCare` already reused People's
`GroupNameText`) — a real signal that these small id→display-value
resolvers (`PersonNameText`, `GroupNameText`) would be better placed in a
shared location (a `pages/shared/` folder, or promoted into `libs/ui/web`
itself) rather than living in whichever page folder happened to need one
first. Not refactored this sprint to keep the diff focused - flagged here
as a genuine, low-risk cleanup opportunity for a future pass.

## 9. What was actually built

**Routes** (`app.tsx`): `/ministry` → `MinistryPage` (role router),
`/ministry/:groupId` → `BasontaRosterPage`.

**Components** (`apps/web-admin/src/app/pages/Ministry/`):
- `MinistryPage.tsx` — role router, §3/§7.
- `BasontaDirectoryPage.tsx` — branch-wide Basonta list, links to
  `/ministry/:id`.
- `BasontaRosterPage.tsx` — route wrapper, §7.
- `BasontaRosterView.tsx` — the roster + overcommitment view itself, §6.
- `useMinistryData.ts` — `useBasontaDirectory`, `useRoster`,
  `useOvercommitmentFlags`.

**No new `libs/ui/web` primitives needed** — `Badge`, `Card`, `Divider`,
`EmptyState`, `ErrorState`, `Heading`, `Skeleton`, `Text` all already
existed.

## 10. Deferred / explicitly out of scope this pass

- Staffing Target / adequacy view — §4.
- Worker Availability self-service — §5.
- Staffing-gap alert — no scheduler exists anywhere in this codebase to
  evaluate one on any cadence (same disclosed gap category as every other
  module's missing scheduler, per `MINISTRY_DESIGN_NOTES.md`).
- Assistant Pastor cluster-wide Basonta visibility — structural gap, §3,
  not re-examined this sprint (same as `MINISTRY_DESIGN_NOTES.md`'s own
  prior disclosure).
- Roster add/remove (write) — already fully functional through People's
  existing `GroupMembershipController`/`GroupMembershipService`
  (`MINISTRY_DESIGN_NOTES.md`'s own note that this was never rebuilt in
  Ministry) but not surfaced as a write control on this page this pass —
  read-only, matching every prior domain page's first-pass scope.

## 11. Known sandbox limitation

Same as every prior sprint: no `pnpm`/`tsc`/`eslint`/`jest` execution in
this sandbox. Statically reviewed only — needs a real
`pnpm lint && pnpm test && pnpm build` pass on the user's machine.

## 12. Milestone 11 addendum — Staffing Targets UI + Ministry Leader dashboard

Closes the two gaps §5 above (and `ECCLESIA_ROADMAP.md`) named as still
open: "no Staffing Targets UI" and "no Ministry Leader Web Admin
dashboard."

**Backend, additive only** (brief: "Do NOT rewrite backend logic"):
`GET /ministry/staffing-targets?groupId=` — a new `list()` on
`StaffingTargetController`/`StaffingTargetService.listByGroup`/
`StaffingTargetRepository.findByGroupId`, guarded by a new
`StaffingTargetListResourceContextGuard` that resolves scope from the
query param the same way the existing Create guard resolves it from the
request body. `create()`/`getById()` are byte-for-byte unchanged.

**`StaffingTargetsPanel.tsx`** (new, `pages/Ministry/`) — Staffing
Overview (list + Adequate/Understaffed filter + Gathering-type search),
current/target staff counts + a vacancy count, a progress-bar capacity
indicator per target, "+ Set target"/row-level "Edit" (both call the same
upsert-shaped `POST /ministry/staffing-targets`), and "+ Assign
volunteer" (`RecordPicker` over `GET /people?search=`, submits
`POST /people/:personId/group-memberships` — an existing endpoint, no
backend change). Embedded in two places: `BasontaRosterView.tsx` (closing
that file's own §"why Staffing Target adequacy is not shown here too"
disclosure) and `MinistryLeaderDashboard.tsx`'s compact variant.
`canEdit` is `true` only for `BASONTA_LEADER` — the only role
`ministry.staffing_target.create` grants; Resident Pastor/Admin reaching
the roster view via the directory see it read-only.

**`MinistryLeaderDashboard.tsx`** (new, `pages/DashboardPage/`) — the
Ministry Leader (`BASONTA_LEADER`) persona's `/dashboard`. Real data:
roster, overcommitment flags, `StaffingTargetsPanel`, Upcoming Gatherings
(`ownerGroupId` = this Basonta — `BASONTA_LEADER` holds
`gatherings.gathering.read` at `OWN_GROUP`). Demo data, disclosed:
Ministry Attendance trend, Recent Ministry Activity — no aggregate
attendance-by-Basonta or activity-feed endpoint exists.
`DashboardPage.tsx`'s router no longer groups `BASONTA_LEADER` with
`BACENTA_LEADER`'s mobile-only stub — see that file's own doc comment for
the full reasoning.
