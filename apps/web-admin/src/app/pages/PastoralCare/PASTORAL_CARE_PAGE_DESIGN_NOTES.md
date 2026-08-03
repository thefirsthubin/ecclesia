# Pastoral Care page (Web Admin) — Design Notes

Sprint: "Pastoral Care Web Admin" — the second domain page built on the
Application Shell, following the exact same discipline as
`apps/web-admin/.../People/PEOPLE_PAGE_DESIGN_NOTES.md` (read it first;
this doc assumes and doesn't re-explain that one's router/`useAsyncData`/
`GroupNameText` conventions). Replaces the `/pastoral-care` `StubPage`.

## 1. What this sprint builds

PRD §16.2's Key Surfaces table, scoped down to what's honestly buildable
this pass:

| Surface | Built? | Notes |
|---|---|---|
| Follow-up task queue | Yes | `FollowUpTaskQueuePage` — "sorted by SLA urgency," read + one write action (Complete) |
| Shepherd's Bacenta dashboard | No (not web-admin's job) | Already built on mobile (`ShepherdDashboardScreen`) — §16.2 itself names Bacenta Leader as the primary persona, and `APPLICATION_SHELL_DESIGN_NOTES.md` §1 already scoped mobile as Shepherd's surface |
| Assistant Pastor cluster view | No | This is really an Insights surface (Church Pulse trend across a cluster) — `APPLICATION_SHELL_DESIGN_NOTES.md` §7 already names `GET /insights/cluster-dashboard/:groupId` as `DashboardPage`'s own next extension point; building it here would duplicate that seam |
| Poimen tracker (H2) | No | Already flagged Release-2 scope in `PASTORAL_CARE_DESIGN_NOTES.md`'s "What this milestone deliberately does not build" — nothing changed that assessment |

Pastoral notes are not shown on this page either — they're Person-scoped
content that belongs on `PersonDetailPage` (People's page), not a
Pastoral-Care-domain page of their own. Deferred to a future People-page
enhancement, not built here (§9).

## 2. Backend gap-filling (companion to this doc)

Building the queue surfaced two real gaps in `apps/api`'s Pastoral Care
module — a missing ASSISTANT_PASTOR `pastoral_care.followup_task.read`
RBAC row, and a missing BRANCH-wide `GET /pastoral-care/follow-up-tasks`
listing endpoint. Full reasoning lives in
`apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md`'s
"Resolved (Pastoral Care Web Admin sprint)" section — not repeated here.

## 3. Scope resolution — `resolveDefaultFollowUpTaskQuery`

Same shape as People's `resolveDefaultPeopleQuery`, mapped onto
`pastoral_care.followup_task.read`'s scope rows instead of
`people.person.read`'s:

- `BACENTA_LEADER` → `{ groupId: actor.bacentaId }` (OWN_GROUP)
- `ASSISTANT_PASTOR` → `{ groupId: actor.clusterBacentaIds[0] }` (CLUSTER) — same `[Design Decision]` first-Bacenta-only simplification as People's, for the same reason (the endpoint takes one `groupId`, not a set)
- `RESIDENT_PASTOR` / `ACTING_RESIDENT_PASTOR` / `ADMIN` → `{}` (BRANCH, falls back to the actor's own Branch)

`BASONTA_LEADER` has no `pastoral_care.followup_task.*` row at all
(Follow-up tasks are a Bacenta/Shepherd-relationship concept per FR-PC-03 —
Basonta membership is a Ministry concern, not this domain's). Falls
through to the `{}` default and gets a 403 from the backend rather than a
client-side pre-emptive block — same precedent `resolveDefaultPeopleQuery`
already set for roles with no scoping story of their own.

## 4. Why Complete is built and Escalate is not

`PATCH /follow-up-tasks/:id/complete` takes no body — a direct fit for
the `AlertPriorityCard`'s existing "Resolve" quick-action pattern
(no-payload `PATCH`, `Button` with a per-row `loading` state, refetch on
success). Wired in exactly that shape.

`PATCH /follow-up-tasks/:id/escalate` requires a caller-supplied
`escalatedToPersonId` (BR-PC-04 — see `PASTORAL_CARE_DESIGN_NOTES.md`'s
own note that automatic organizational-superior resolution isn't
buildable from anything in the schema). Escalating from this page would
need a Person picker/search control that doesn't exist anywhere in
`libs/ui/web` yet — building one is a real, separate piece of work, not a
one-line addition. `[Design Decision]` deferred rather than built with a
half-considered UI (§9).

## 5. Person/Group name resolution

`FollowUpTaskResponseDto` carries `personId` (the subject),
`assignedToPersonId`, and an optional `groupId` — none of them display
names. `PersonNameText` (`GET /people/:id`, the People Web Admin sprint's
own endpoint) resolves the first two; `GroupNameText` is imported directly
from `../People/GroupNameText` rather than duplicated — it's a pure,
page-agnostic id→name presentational component with no People-page
coupling, the same reuse judgment already applied when `PersonDetailPage`
reused `apps/mobile`'s `PersonNameText` concept. The subject Person's name
is wrapped in a `Link` to `/people/:id` (drill-down into the profile
People's own page already builds); the assignee's is not linked — there's
no assignee-specific view to link to yet.

## 6. Overdue highlighting

`isOverdue()` — `status !== 'COMPLETED' && dueAt` in the past —
`[Design Decision]`, not a PRD-specified field. PRD §16.2 only says
"sorted by SLA urgency" (already the server's `dueAt ASC` ordering); an
overdue Badge is a small, low-risk addition that makes that ordering
legible at a glance, the same reasoning `PersonDetailPage`'s
active/past-history badges already used for a comparable "make an
implicit state visible" case.

## 7. What was actually built

**Route** (`app.tsx`): `/pastoral-care` → `FollowUpTaskQueuePage`,
replacing the `StubPage`.

**Components** (`apps/web-admin/src/app/pages/PastoralCare/`):
- `FollowUpTaskQueuePage.tsx` — the queue: role-scoped list, per-row
  subject/assignee names, status/overdue `Badge`, due date, Complete
  action.
- `PersonNameText.tsx` — id→name resolver, §5.
- `usePastoralCareData.ts` — `resolveDefaultFollowUpTaskQuery`,
  `useFollowUpTaskQueue`, `completeFollowUpTask`, `usePersonName`.

**No new `libs/ui/web` primitives needed** — `Badge`, `Button`, `Card`,
`Divider`, `EmptyState`, `ErrorState`, `Heading`, `Skeleton`, `Text` all
already existed.

## 8. Data fetching

Same `useAsyncData`/`apiGet`/`apiPatch` pattern as every prior sprint —
no new HTTP client or async-state abstraction.

## 9. Deferred / explicitly out of scope this pass

- Escalate action — needs a Person picker, §4.
- Silent-drift flags — same class of BRANCH-wide-listing gap as Follow-up
  tasks had (`GET /pastoral-care/groups/:groupId/silent-drift-flags` is
  Group-scoped only, no BRANCH-wide route exists yet either); not fixed
  this pass since this sprint's scope is the Follow-up task queue
  specifically, not a second full surface.
- Pastoral notes — belongs on `PersonDetailPage`, not this page, §1.
- Poimen tracker — Release-2, `PASTORAL_CARE_DESIGN_NOTES.md`'s own prior
  assessment, unchanged.
- Assistant Pastor cluster Church Pulse view — an Insights surface, §1.
- Manual Follow-up task creation form (`POST /people/:personId/follow-up-tasks`)
  — this page is read-plus-Complete only, matching People's own
  read-only-this-pass precedent; creation is a write flow with its own
  assignee-picker/trigger-selection UX, deferred to a future sprint.

## 10. Known sandbox limitation

Same as every prior sprint: no `pnpm`/`tsc`/`eslint`/`jest` execution in
this sandbox. Statically reviewed only — needs a real
`pnpm lint && pnpm test && pnpm build` pass on the user's machine.
