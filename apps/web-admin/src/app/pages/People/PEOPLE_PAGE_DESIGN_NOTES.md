# People pages (Web Admin) — Design Notes

Sprint: "People Web Admin" — the first domain page built on top of the
Application Shell (`APPLICATION_SHELL_DESIGN_NOTES.md`), replacing the
`/people` `StubPage` with a real directory + profile view. Same disclosure
discipline as every prior sprint: every choice below is either a direct
citation or an explicit `[Design Decision]`/`[INFERRED]`.

## 1. What this sprint builds

PRD §16.1's "People" key surfaces, scoped down to what the existing
backend can honestly support this pass:

| Surface | Built? | Notes |
|---|---|---|
| Search & directory | Yes | `PeopleListPage` |
| Person profile view | Partial | `PersonDetailPage` — profile fields + Group-membership history + Role-Assignment history (FR-PPL-07). Attendance/giving summaries are Gatherings'/Stewardship's own data — out of scope here, same reasoning as `APPLICATION_SHELL_DESIGN_NOTES.md` §5's alert-severity omission: don't fabricate a field the API doesn't return. |
| New Person / visitor intake form | No | Deferred — §6 |
| Duplicate resolution queue | No | Deferred — §6, and already flagged as a narrower-than-PRD substitute in `PEOPLE_DESIGN_NOTES.md`'s "What this milestone deliberately does not build" |
| Bacenta/Basonta reassignment flow | No | Deferred — §6 |

This sprint is read-only: list, search, and view history. No mutation UI.

## 2. Backend gap-filling (companion to this doc)

Building this page surfaced three read-path gaps in `apps/api`'s People
module — `GET /people`, `GET /people/:personId/group-memberships`,
`GET /people/:personId/role-assignments` — plus one RBAC bug fix
(`people.role_assignment.read` missing RESIDENT_PASTOR/ASSISTANT_PASTOR
rows) and one new action (`people.group_membership.read`). Full reasoning
lives in `apps/api/src/modules/people/PEOPLE_DESIGN_NOTES.md`'s "Resolved
(People Web Admin sprint)" section — not repeated here.

## 3. Scope resolution — `resolveDefaultPeopleQuery`

PRD §16.1: "Role-scoped search (a Shepherd searches within their Bacenta
context by default; an Admin searches the whole Branch)." `GET /people`
takes one optional `groupId`; `resolveDefaultPeopleQuery`
(`usePeopleData.ts`) maps `ActorContext.role` to that query, mirroring the
scope rows already in `libs/rbac/src/lib/permission-matrix.ts` for
`people.person.read`:

- `BACENTA_LEADER` → `{ groupId: actor.bacentaId }` (OWN_GROUP)
- `BASONTA_LEADER` → `{ groupId: actor.basontaId }` (OWN_GROUP)
- `ASSISTANT_PASTOR` → `{ groupId: actor.clusterBacentaIds[0] }` (CLUSTER) — see the `[Design Decision]` below
- `RESIDENT_PASTOR` / `ACTING_RESIDENT_PASTOR` / `ADMIN` / `TREASURER` → `{}` (BRANCH, no `groupId` — `PersonListResourceContextGuard` falls back to the actor's own Branch)

`[Design Decision]` `ASSISTANT_PASTOR`'s CLUSTER scope spans every Bacenta
in `actor.clusterBacentaIds`, but `GET /people` only accepts a single
`groupId`. This sprint defaults to the first Bacenta in the cluster rather
than building a multi-`groupId` query or a Bacenta picker — a real
"browse my whole cluster" UX is deferred (§6). Not a citation-backed
choice; flagged for review.

`WORKER` / `MEMBER` / `VISITOR` / `COUNCIL_OVERSEER` fall through to the
`{}` default too, but per `APPLICATION_SHELL_DESIGN_NOTES.md` §1's
persona/port scoping, these roles are not this page's primary audience on
web-admin in the first place — not specially handled.

## 4. Search

`search` is a free-text query param, sent to `GET /people` alongside
`groupId`. Same "plain case-insensitive first/last-name substring match"
implementation already disclosed as `[Design Decision]` in
`PEOPLE_DESIGN_NOTES.md` — client just passes the trimmed input straight
through; no client-side filtering, debouncing, or fuzzy matching added
this pass.

## 5. Router extension — dynamic `:param` segments

`/people/:id` is the first route in this codebase needing a path
parameter. The hand-built router (`app/router/router.tsx`,
`APPLICATION_SHELL_DESIGN_NOTES.md` §0's "no routing library available,
no package-registry access" constraint — unchanged this sprint) previously
only matched flat, exact-string paths. Extended minimally:

- `matchPath(pattern, path)` — segment-by-segment match; a `:name`
  pattern segment captures the corresponding path segment into a params
  map, `decodeURIComponent`-ed. No partial-segment params
  (`/people-:id`), no wildcards, no optional segments, no nested routes —
  still not a general-purpose router, just enough for one dynamic segment
  per path.
- `ParamsContext` / `useParams<T>()` — `Routes` now iterates its children
  looking for the first pattern that matches the current path (instead of
  a single exact-equality check), and provides the matched params via
  context so the rendered page can read them with `useParams()`, the same
  shape `react-router-dom` uses (deliberately — if a real router is ever
  installed, page components using `useParams()` don't need to change).

## 6. `ProtectedRoute` refactor — self-derived path

`ProtectedRoute` previously took `path` as a prop (a hardcoded pattern
string like `/people`), used only to remember where to redirect back to
after login. That breaks for a param route: hardcoding `path="/people/:id"`
would send a user back to a literal, non-existent `/people/:id` URL after
login instead of the actual `/people/abc-123` they'd requested.

Fixed by removing `path` from `ProtectedRouteProps` entirely — the
component now calls `useLocation()` itself, which reports the router's
real current path (not the matched pattern), and uses that for
`rememberIntendedPath`. Every `<ProtectedRoute>` call site in `app.tsx`
had its now-redundant `path="..."` prop removed as part of this change —
a mechanical cleanup, not a behaviour change for the flat routes, but a
correctness fix for `/people/:id`.

## 7. Data fetching

Same `useAsyncData`/`apiGet` pattern as every prior sprint (Dashboard,
Shepherd Dashboard) — no new HTTP client, no new async-state abstraction.
`usePeopleData.ts` adds five hooks: `usePeopleList`, `usePersonDetail`,
`useGroupMembershipHistory`, `useRoleAssignmentHistory`, `useGroupName`.

`useGroupName` exists because `GroupMembershipResponseDto` /
`RoleAssignmentResponseDto` history rows only carry a `groupId`, not a
display name — `GroupNameText` resolves one id → name per row via
`GET /groups/:id` (already built, Pastoral Care milestone). This mirrors
`apps/mobile`'s `PersonNameText` component, which solves the identical
id-to-display-value problem for a different resource — not a new pattern
invented for web.

## 8. What was actually built

**Routes** (`app.tsx`): `/people` → `PeopleListPage`, `/people/:id` →
`PersonDetailPage`. Both protected, both under the existing `AppShell`.

**Components** (`apps/web-admin/src/app/pages/People/`):
- `PeopleListPage.tsx` — search input + role-scoped list, each row a
  `Link` to `/people/:id`, lifecycle stage shown as a `Badge` (status
  colour mapped per stage — `[Design Decision]`, Design System doesn't
  prescribe stage→colour mapping).
- `PersonDetailPage.tsx` — profile `Card` (name, avatar, lifecycle badge,
  phone/email/address) + Bacenta/Basonta history `Card` + Role history
  `Card`, each history row showing active/past status and date range.
- `GroupNameText.tsx` — id→name resolver, §7.
- `usePeopleData.ts` — hooks + `resolveDefaultPeopleQuery`, §3/§7.

**No new `libs/ui/web` primitives needed** — `Avatar`, `Badge`, `Card`,
`Divider`, `EmptyState`, `ErrorState`, `Heading`, `Input`, `Skeleton`,
`Text` all already existed from the Application Shell sprint.

**Router** (`app/router/router.tsx`): `matchPath`, `ParamsContext`,
`useParams` — §5.

**`ProtectedRoute.tsx`**: `path` prop removed, `useLocation()` used
internally — §6.

## 9. Deferred / explicitly out of scope this pass

- New Person / visitor intake form (PRD §16.1) — a write flow with its
  own validation/duplicate-detection UX; belongs in its own sprint.
- Duplicate resolution queue UI — no persistent queue exists server-side
  yet either (`PEOPLE_DESIGN_NOTES.md`'s own "deliberately does not
  build" list); nothing to build a UI against.
- Bacenta/Basonta reassignment flow (PRD §16.1) — a write flow (calls the
  existing `group-membership.controller.ts` `POST`), deferred with the
  intake form.
- ASSISTANT_PASTOR multi-Bacenta cluster browsing — §3's `[Design
  Decision]` simplification to "first Bacenta only."
- Pagination — `GET /people` returns the full scoped result set
  unpaginated; fine at current data volumes, a real gap at Branch scale.
- Attendance/giving summaries on the profile view — other domains' data,
  §1.

## 10. Known sandbox limitation

Same as every prior sprint: no `pnpm`/`tsc`/`eslint`/`jest` execution in
this sandbox. This sprint's frontend and backend code has been statically
reviewed only — needs a real `pnpm lint && pnpm test && pnpm build` pass
on the user's machine before being considered done.
