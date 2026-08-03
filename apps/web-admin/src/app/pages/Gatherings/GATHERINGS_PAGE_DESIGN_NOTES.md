# Gatherings page (Web Admin) — Design Notes

Sprint: "Gatherings Web Admin" — the fourth domain page built on the
Application Shell, following the same discipline as `People/`,
`PastoralCare/`, and `Ministry/`'s own `*_PAGE_DESIGN_NOTES.md` (read
those first). Replaces the `/gatherings` `StubPage`.

## 1. What this sprint builds

PRD §16.4's Key Surfaces table, scoped to what's honestly buildable:

| Surface | Built? | Notes |
|---|---|---|
| Gathering calendar | Yes | `GatheringsListPage` — "upcoming and past Gatherings, filterable by type and Group," "All operator roles" |
| Attendance completeness report | Partial | Folded into the calendar as a per-row `AttendanceCompletenessBadge` on past Gatherings, not a separate report page — §4 |
| Attendance capture screen | No | Usher-primary, mobile-optimized "tap-to-mark-present" flow — §5 |
| Visitor intake form | No | Usher-primary — §5 |

## 2. Backend gap-filling (companion to this doc)

Two real gaps: `GET /gatherings` had no BRANCH-wide case at all
(`ownerGroupId` was required), and `gatherings.gathering.read`/
`gatherings.attendance.read` both had ADMIN missing despite ADMIN already
holding `.create`/`.update`. Full reasoning lives in
`apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md`'s "Resolved
(Gatherings Web Admin sprint)" section — not repeated here.

## 3. Scope resolution — `resolveDefaultGatheringsQuery`

Same shape as the three prior domain pages'
`resolveDefaultXQuery` functions, mapped onto
`gatherings.gathering.read`'s scope rows:

- `BACENTA_LEADER` → `{ ownerGroupId: actor.bacentaId }` (OWN_GROUP)
- `RESIDENT_PASTOR` / `ADMIN` → `{}` (BRANCH, falls back to the actor's
  own Branch — and now also picks up Branch-wide Gatherings like Sunday
  Service, which `ownerGroupId`-scoped queries never could)

`ASSISTANT_PASTOR` and `BASONTA_LEADER` hold no `.read` row on this
action at all — a pre-existing gap `GATHERINGS_DESIGN_NOTES.md`'s own
"Usher role gap"/RBAC section already leaves open, and not the gap this
page's backend work closed (§2 only added the ADMIN rows this page
specifically needed). Both fall through to the same `{}` query and get a
403 from the backend, same precedent every prior `resolveDefaultXQuery`
already established for roles with no scoping story of their own.

## 4. Why completeness is a badge, not a separate report page

FR-GTH-05/§16.4 name a Branch-wide completeness *report* across many
Gatherings, but `GATHERINGS_DESIGN_NOTES.md` already discloses that no
such aggregate endpoint exists — only `GET /gatherings/:id/attendance-records/completeness`,
evaluated one Gathering at a time. Rather than leave this surface
entirely unbuilt, `AttendanceCompletenessBadge` fetches that per-Gathering
check for each row already being rendered — the same "compute the missing
list-level view from an existing single-record endpoint, per row" judgment
Ministry's overcommitment badge and Pastoral Care's Overdue badge already
used. Only rendered for Gatherings already past their scheduled end
(`GatheringsListPage.isPast()`) — nothing to flag on one that hasn't
happened yet.

`[Design Decision]` This is a real, narrower substitute for the PRD's
report surface, not the report itself — there's no dedicated "show me
everything incomplete this week" view, no sweep, and no reminder
notification (all already disclosed as unbuilt in
`GATHERINGS_DESIGN_NOTES.md`). Flagged the same way People's synchronous
duplicate-check was flagged as a substitute for PRD §16.1's persistent
duplicate queue.

## 5. Why Attendance Capture and Visitor Intake aren't on this page

Both are named Usher-primary in PRD §16.4's own Key Surfaces table
("Ushers, Shepherds, Basonta Leaders" / "Ushers, self-service (future)"),
and `GATHERINGS_DESIGN_NOTES.md`'s own "Usher role gap" section already
discloses that **no `USHER` role exists in `libs/rbac`'s role catalog at
all** — a structural blocker, not a scope choice this page could route
around. `gatherings.attendance.create`/`gatherings.visitor_intake.create`
are granted to `BACENTA_LEADER`/`BASONTA_LEADER`/`ASSISTANT_PASTOR`/`ADMIN`
as a disclosed stand-in, but those are mobile-primary at-the-door
workflows (fast, tablet-optimized, "pre-populated roster with
tap-to-mark-present") that don't fit a web-admin oversight page's shape
even if the permission technically allows it. Building either here would
mean designing a workflow UI for a role that doesn't formally exist yet -
deferred pending the product decision `GATHERINGS_DESIGN_NOTES.md`
already flags as needed.

## 6. Why Group filtering isn't built

§16.4 names "filterable by type and Group" together. `type` is a simple
free-text `Input`, matched exactly server-side - no picker needed. `Group`
filtering would need a Bacenta/Basonta picker control (search-and-select
across potentially many Groups) that doesn't exist anywhere in
`libs/ui/web` yet - the same class of "needs a picker component that
isn't built" deferral Pastoral Care's Escalate action and Ministry's
Staffing Target view already used. A Basonta Leader/Bacenta Leader is
already implicitly Group-filtered via `resolveDefaultGatheringsQuery`
(§3); RESIDENT_PASTOR/ADMIN see the whole Branch with no way to narrow to
one Group this pass.

## 7. What was actually built

**Route** (`app.tsx`): `/gatherings` → `GatheringsListPage`, replacing
the `StubPage`.

**Components** (`apps/web-admin/src/app/pages/Gatherings/`):
- `GatheringsListPage.tsx` — role-scoped list, type filter, status
  Badge, Group name (reused `GroupNameText` from `../People/`, the third
  reuse of that component — see People/Pastoral Care/Ministry's own notes
  on this recurring pattern), completeness Badge on past Gatherings.
- `AttendanceCompletenessBadge.tsx` — per-row completeness fetch, §4.
- `useGatheringsData.ts` — `resolveDefaultGatheringsQuery`,
  `useGatheringsList`, `useAttendanceCompleteness`.

**No new `libs/ui/web` primitives needed** — `Badge`, `Card`, `Divider`,
`EmptyState`, `ErrorState`, `Heading`, `Input`, `Skeleton`, `Text` all
already existed.

## 8. Deferred / explicitly out of scope this pass

- Attendance Capture screen — §5, blocked on the USHER role gap.
- Visitor Intake form — §5, same blocker.
- A true Branch-wide completeness report/sweep/reminder — §4, no
  aggregate endpoint or scheduler exists.
- Group filtering — §6, needs a picker component.
- GatheringSeries management (creating/editing a recurring series
  definition) — a separate, Admin-configuration-shaped surface, not part
  of the calendar itself; also blocked on the unresolved recurrence-rule
  format `GATHERINGS_DESIGN_NOTES.md` already flags.
- ASSISTANT_PASTOR/BASONTA_LEADER read access — §3, pre-existing RBAC gap
  not fixed this pass since it wasn't blocking this page's own build.

## 9. Known sandbox limitation

Same as every prior sprint: no `pnpm`/`tsc`/`eslint`/`jest` execution in
this sandbox. Statically reviewed only — needs a real
`pnpm lint && pnpm test && pnpm build` pass on the user's machine.
