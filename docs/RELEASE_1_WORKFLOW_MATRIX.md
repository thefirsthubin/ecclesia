# Ecclesia — Release 1 Workflow Matrix

**Program**: "Release 1 — Workflow Completion." Ecclesia Web Admin must work as one coherent product — every Release-1 workflow provably usable end-to-end by its intended persona — before UI/UX redesign, mobile work, or AWS/deployment work resumes.

Progress is measured in **user capabilities**, not files changed. A workflow is DONE only when: the persona can perform it, the UI supports it, the API works, authentication works, RBAC works, resource authorization works, RLS/tenant isolation works, data persists correctly, downstream effects occur where expected, tests cover the important regression points, and live local verification succeeded where practical.

**Status vocabulary** (used per-boundary, not invented):
- `VERIFIED` — implemented and proven at that boundary (test and/or live check exists and passed)
- `UNVERIFIED` — code exists at that boundary but no test/live proof exists that it actually works
- `MISSING` — does not exist

Compiled from: `ECCLESIA_ROADMAP.md`, every domain's `*_DESIGN_NOTES.md`, `libs/rbac/src/lib/permission-matrix.ts`, `db/schema.prisma` + RLS migrations, direct code reads, and this session's own live-Postgres verification work (Insights Resident Pastor dashboard slice, Gatherings Branch Pastor / Basonta Leader RBAC fixes). Where this document disagrees with `ECCLESIA_ROADMAP.md`, this one is newer — e.g. the roadmap's claim that "only Resident Pastor has a real dashboard" is now **stale**; four more persona dashboards exist with partial real data.

---

## 1. PEOPLE

### Person Directory / Search
- **Persona**: Resident Pastor/Admin/Treasurer (BRANCH), Assistant Pastor (CLUSTER, first Bacenta only), Bacenta/Basonta Leader (OWN_GROUP)
- **Journey**: leader opens People, searches/filters the directory within their scope
- **Impl status**: COMPLETE for the scoped-list case; unpaginated (disclosed limitation, not a correctness bug)
- **UI**: VERIFIED (`PeopleListPage.tsx`, real)
- **API**: VERIFIED (`GET /people`, real Prisma query)
- **DB/persistence**: VERIFIED (`people.persons`, branch-filtered)
- **RBAC**: VERIFIED (`people.person.read` matrix rows exist for every scope)
- **RLS**: UNVERIFIED at this specific endpoint this session (global mechanism is VERIFIED elsewhere — see §8)
- **Downstream**: none
- **Tests**: VERIFIED (spec files exist for controller/service/repo/UI)
- **Live verification**: not run this session
- **Blocker/gap**: no pagination
- **Priority**: P3

### Person Profile View
- **Persona**: same read scopes as Directory, plus SELF (Worker/Member)
- **Journey**: leader opens a Person's profile to see identity, Group-membership history, Role-Assignment history
- **Impl status**: COMPLETE for read; no lifecycle-transition action from this screen
- **UI**: VERIFIED (`PersonDetailPage.tsx`)
- **API**: VERIFIED
- **DB**: VERIFIED
- **RBAC**: VERIFIED
- **RLS**: UNVERIFIED at this endpoint this session
- **Downstream**: none
- **Tests**: VERIFIED
- **Live verification**: not run this session
- **Blocker/gap**: attendance/giving history intentionally not shown (other domains' data, deliberate scope cut)
- **Priority**: P3

### New Person Intake (create + duplicate detection)
- **Persona**: Admin only (BRANCH)
- **Journey**: Admin creates a new Person; if a name/phone match is found, gets a 409 with candidates and must explicitly override
- **Impl status**: COMPLETE as a synchronous reject-with-override — **not** the PRD's persistent duplicate-resolution queue (no such table exists)
- **UI**: VERIFIED (`NewPersonForm.tsx` implements the 409-resubmit flow)
- **API**: VERIFIED (`POST /people`, real duplicate-candidate query)
- **DB**: VERIFIED
- **RBAC**: VERIFIED (Admin-only, matches BR)
- **RLS**: UNVERIFIED at this endpoint this session
- **Downstream**: none
- **Tests**: VERIFIED
- **Live verification**: not run this session
- **Blocker/gap**: no persistent duplicate queue — a disclosed, deliberate substitute, not a bug
- **Priority**: P2

### Lifecycle Stage Transition
- **Persona**: Assistant Pastor (CLUSTER), Bacenta Leader (OWN_GROUP), Admin (BRANCH) — **not** Resident Pastor, who deliberately holds only `.read` on this action per PRD §17.3's own matrix (not a bug, confirmed by direct citation)
- **Journey**: leader opens a Person's profile and moves them to the next modeled stage, with an optional reason
- **Impl status**: **DONE.** Built this session — `PersonDetailPage.tsx` now has a "Transition lifecycle stage" action, reusing `@ecclesia/domain-people`'s exact state machine (`checkLifecycleTransition`) to populate only valid next stages, client-side, with zero duplicated transition logic.
- **UI**: VERIFIED (`PersonDetailPage.tsx` — reveal-panel `Select` + optional reason `Input`, matching `FollowUpTaskQueuePage`'s established Escalate pattern; no client-side role gate, matching Stewardship's precedent — the backend is the sole authority)
- **API**: VERIFIED (`POST /people/:id/lifecycle-transitions`)
- **DB/persistence**: **VERIFIED live** — confirmed via a fresh `GET` after each live transition
- **RBAC**: **VERIFIED live** — Resident Pastor (read-only) denied, Treasurer (no grant) denied, unauthenticated denied, Assistant Pastor allowed inside their cluster, Admin allowed branch-wide, plus both 409 domain-rule cases (terminal stage, skipped stage) and the special `FOLLOW_UP → ASSIGNED_TO_BACENTA` redirect message all confirmed with the server's real reason text
- **RLS/tenant isolation**: **VERIFIED live** — an Admin actor in Branch A got a clean 404 (not a leaking 403) attempting to transition a real Person seeded in a second Branch; an Assistant Pastor was denied a same-Branch, out-of-cluster Person
- **Downstream**: `lifecycle_stage.transitioned` Engagement Signal published to the real (already-deployed) dev EventBridge bus on every successful transition — confirmed in server logs, a disclosed expected side effect of already-existing infrastructure, not new AWS work
- **Tests**: VERIFIED — 2 new hook tests + 2 new UI describe blocks (offer/hide the action, submit + refetch, denial message shown inline), full suite still green (577 api / 221 web-admin)
- **Live verification**: **VERIFIED**, 11 scenarios against real Postgres (see session record)
- **Blocker/gap**: none remaining for the transitions this endpoint owns. The one transition it structurally excludes by design (`FOLLOW_UP → ASSIGNED_TO_BACENTA`) still has nowhere to happen from Web Admin — see Group Membership Assignment below, now the identified next dependency.
- **Priority**: P3 (closed)

### Bacenta/Basonta Group Membership Assignment
- **Persona**: Resident Pastor/Admin (BRANCH — the only roles that can perform a Person's *first-ever* assignment; see RBAC note), Assistant Pastor (CLUSTER — reassignment only, of someone already in one of their cluster's Bacentas), Bacenta/Basonta Leader (OWN_GROUP — reassignment only, of someone already in their own Group)
- **Journey**: leader opens a Person's profile, searches for a Bacenta/Basonta, assigns or reassigns them, with a reason required only when the assignment closes an existing active Bacenta membership
- **Impl status**: **DONE.** Built this session — `PersonDetailPage.tsx`'s "Bacenta / Basonta history" card now has an "Assign to Bacenta/Basonta" action (`RecordPicker` search over `GET /groups` + optional reason), calling the existing `POST /people/:id/group-memberships` unchanged. **A real backend bug was found and fixed while verifying this** — see below.
- **UI**: VERIFIED (reveal-panel pattern matching Lifecycle Transition/Escalate; server's actual 400/409 reason surfaced inline, never predicted client-side — `planGroupMembershipChange`'s reason-required decision stays server-side, by design, per this milestone's "do not invent reassignment semantics" constraint)
- **API**: VERIFIED (`POST /people/:id/group-memberships`)
- **DB/persistence**: **VERIFIED live** — fresh reads after every mutation confirmed correct state; `one_active_bacenta_per_person` DB-level constraint independently confirmed by a raw SQL `INSERT` attempt outside the application entirely (`duplicate key value violates unique constraint`)
- **RBAC**: **VERIFIED live**, including a real structural finding: `GroupMembershipResourceContextGuard` resolves scope from the Person's **current** active membership, not the target Group — so `CLUSTER`/`OWN_GROUP`-scoped roles can only ever reassign someone already inside their own scope; a Person's very first Bacenta/Basonta assignment (no current membership, `resource.bacentaId` undefined) can only be performed by a `BRANCH`-scoped role (Resident Pastor/Admin). Confirmed live in both directions (allowed in-scope reassignment, denied first-time-assignment attempt, denied out-of-scope reassignment, denied no-grant role, denied unauthenticated).
- **RLS/tenant isolation**: **VERIFIED live**, and **a real P0 bug was found and fixed**: `GroupMembershipRepository.applyChange` opened its own nested `this.prisma.$transaction(...)`, which — because `PrismaService` deliberately never proxies `$transaction` to the ambient branch-scoped connection — escaped `BranchScopeInterceptor`'s single request-wide `SET LOCAL app.current_branch_id` scope entirely. Every assignment attempt 500'd with `unrecognized configuration parameter "app.current_branch_id"` before the fix. Fixed by removing the redundant nested transaction (the statements already share the one outer transaction `BranchScopeInterceptor` opens for the whole request — atomicity is unaffected, arguably stronger). **Two other repositories share the exact same pattern and almost certainly the same bug, unfixed and out of this milestone's scope**: `financial-transaction.repository.ts` (Stewardship — Record Transaction, Verify, Flag, expense Approve/Reject/Pay) and `role-assignment.repository.ts` (People — Role Assignment grant/succession). Neither has been live-tested against real Postgres by any session to date; the Stewardship section's RLS status elsewhere in this document was recorded as VERIFIED based on static reading only and should now be treated as suspect until independently live-tested.
- **Downstream**: **VERIFIED live** — a first-time MINISTRY assignment increased the real Volunteers KPI count (`GET /insights/branch-dashboard-summary`) and appeared correctly in the Basonta roster (`GET /ministry/groups/:groupId/roster`); BR-PPL-02's "Basonta joins never close anything" confirmed live (a Person ended the test with two concurrent active Basonta memberships); PRD §19.1 step 6's lifecycle auto-transition (`FOLLOW_UP → ASSIGNED_TO_BACENTA`) confirmed live and correctly reflected in the Web Admin UI via a dual refetch (membership history + Person).
- **Tests**: VERIFIED — 5 new hook tests, 5 new UI tests, repository tests rewritten to match the fixed (non-nested-transaction) implementation; full suite green (577 api / 231 web-admin)
- **Live verification**: **VERIFIED**, 16 scenarios against real Postgres (see session record) plus one raw-SQL constraint check
- **Blocker/gap**: none remaining for this workflow itself. The CLUSTER/OWN_GROUP "current membership only" scope limitation is real but matches the resource-context guard's own explicit design intent (reassignment of an already-scoped Person), not a bug to fix here.
- **Priority**: P3 (closed)

### Role Assignment Management (grant/read/revoke)
- **Persona**: **Grant**: Resident Pastor (BRANCH) — the only role that can successfully grant today; `ASSISTANT_PASTOR` (CLUSTER) and `ADMIN` both hold no *working* grant path (see RBAC note below). **Revoke**: traced independently this session, not assumed to mirror grant — `people.role_assignment.update` (an existing matrix action, previously unbacked by any route) names the identical two roles (`RESIDENT_PASTOR` BRANCH, `ASSISTANT_PASTOR` CLUSTER) as `.grant`, but **Assistant Pastor's CLUSTER revoke is NOT structurally broken the way their grant is** — see below, a genuine, deliberate divergence.
- **Journey**: Person → Person Detail → Role history → Grant role → Select a role (+ a Bacenta/Basonta search when the role requires one) → Confirm → persisted, visible on a fresh read → **select an active role → Revoke → confirm → persisted end date → fresh read shows it inactive, history preserved.**
- **Impl status**: **DONE** for the full grant→revoke lifecycle. Grant was built in a prior session this run; **revoke was built this session** — the backend genuinely had no revoke method or route at all before this milestone (confirmed by tracing, not assumed), so this required implementing the missing capability, not just wiring a UI to an existing one.
- **Existing Role Assignment semantics (traced, not invented)**: `effectiveFrom`/`effectiveTo` (both `Timestamptz`, `effectiveTo` nullable) are the sole temporal model — "active" means `effectiveFrom <= now AND (effectiveTo IS NULL OR effectiveTo > now)`, the exact predicate `ActorContextResolverService`/`findActiveBacentaLeader` both already use. Ending an assignment already had one precedent in the codebase before this session: `createWithSuccession` closes a prior Bacenta Leader's assignment (`effectiveTo = now`) as a side effect of granting a successor. **Revoke reuses this exact same "close, don't delete" update — no new temporal model, no hard delete.**
- **Revoke/deactivation semantics**: `POST /people/:personId/role-assignments/:assignmentId/revoke`, no request body. Sets `effectiveTo = now()` on the named assignment after verifying it exists, belongs to the named Person, and is currently active (409 if already ended or not yet started). **No successor is created or required** — PRD §17.2's "exactly one active Bacenta Leader" is an upper-bound constraint; `createWithSuccession`'s own doc comment already anticipates a Bacenta having zero active leaders as a valid transient state, confirmed live this session (see below). **No role is protected from revocation and self-revocation is not restricted** — no domain rule anywhere addresses either, so none was invented; disclosed as an open question, not silently decided. **No Engagement Signal is published** — `role_assignment.active` is the only Role-Assignment-shaped type in the closed `ENGAGEMENT_SIGNAL_EVENT_TYPES` catalog; inventing a `.revoked`/`.inactive` type would mean extending a closed, exhaustively-typed classification map another domain (`libs/domain/insights`) owns, which no traced rule requires.
- **UI**: VERIFIED — a per-row "Revoke" `Button` on the existing "Role history" card, shown only for a row already displayed as "Active" (the same `!assignment.effectiveTo` condition the existing Badge uses), revealing an inline confirm step (Confirm/Cancel) before submitting — the same reveal-panel discipline every other risky action this session uses, no `window.confirm()`. No PersonDetailPage redesign; no new screen.
- **API**: VERIFIED (`POST /people/:personId/role-assignments/:assignmentId/revoke`) — new controller method, new `RoleAssignmentRevokeResourceContextGuard` (resolves scope from the **assignment's own** `groupId`/`branchId` via `GroupScopeService`, not the candidate-Person-shaped resource `grant()` builds), single-statement repository `revoke()` call, confirmed **not** affected by the nested-`$transaction`-escapes-branch-scope bug class found elsewhere this session. Reuses the existing `people.role_assignment.update` action rather than inventing a new one.
- **DB/persistence**: **VERIFIED live** — revoke → 200 → independent fresh `GET` confirms `effectiveTo` populated and the record still present (not deleted) → a second fresh read (simulating reload) shows the identical state.
- **RBAC**: **VERIFIED live.** `RESIDENT_PASTOR` (BRANCH) revoke succeeds; `ADMIN` revoke 403s (no `.update` grant, same as no `.grant` grant — "no grant authority" is consistent across both actions for Admin). **Genuine divergence from grant, confirmed live, not assumed**: Assistant Pastor's CLUSTER-scoped revoke is reachable — because this new route's resource context resolves from the assignment's own real `groupId` (unlike `grant()`'s resource, which never sets `bacentaId` at all) — confirmed with a real out-of-cluster Bacenta (403, "outside the actor's CLUSTER scope") and the identical revoke succeeding once that Bacenta was added to their cluster (200).
- **RLS/tenant isolation**: **VERIFIED live** — nonexistent assignment 404s; an assignment belonging to a different Person (real assignment, mismatched `:personId`) 404s without leaking existence; a real assignment in a real second Branch 404s (RLS blocks it from resolving at all); unauthenticated request 401s.
- **Effective-role behavior**: **VERIFIED** — after revoke, a direct query using the exact same active-assignment predicate `ActorContextResolverService` uses returns zero rows for that Person/role, confirming the next authentication for that identity would no longer resolve this as their active role (no separate "effective role" endpoint exists to call directly, so this was verified at the query-predicate level, the same one every consumer shares).
- **Bacenta Leader/succession behavior**: **VERIFIED live** — revoking an active Bacenta Leader assignment succeeds as a plain close; a direct query for active `BACENTA_LEADER` rows on that Bacenta afterward returns zero rows — no auto-successor was created (none was built, per instruction), and this is confirmed to be a valid, already-anticipated state, not a broken one. Revoking does not throw, block, or otherwise treat "last active leader" as a protected case, since no domain rule requires that.
- **Downstream**: none beyond effective-role resolution (already covered) — no other consumer reacts to a Role Assignment ending.
- **AWS side effects**: **none**, identified before execution and confirmed by reading the full service: `revoke()` never calls `EventBridgePublisherService` (see semantics note above for why no event type exists to publish).
- **Tests**: VERIFIED — 4 new backend repository tests + 5 new service tests (success, nonexistent, wrong-Person, already-inactive, not-yet-started, Bacenta-Leader-needs-no-successor) + 1 new controller test + 4 new guard tests (groupId-present/absent resolution, nonexistent, wrong-Person) + 4 new Web Admin hook tests + 4 new UI tests (active-only Revoke visibility, confirm/cancel, successful revoke + refetch + historical-record-preserved, server error inline) — full suite 611/611 api (was 577 at session start), 313/313 web-admin (was 282) passing.
- **Live verification**: **VERIFIED**, the full grant→active→revoke→history-preserved→effective-role-updated chain plus 5 authorization/scope scenarios against real Postgres: active grant confirmed on fresh read → authorized revoke (200) → fresh read shows inactive, history preserved → already-revoked retry 409 → nonexistent assignment 404 → wrong-Person 404 → unauthenticated 401 → Admin 403 → Assistant Pastor out-of-cluster 403 → Assistant Pastor in-cluster 200 (the CLUSTER-reachability divergence from grant) → cross-Branch 404 (RLS) → Bacenta Leader revoke confirmed to leave zero active leaders, no auto-successor → all fixtures cleaned up (verified via direct count, zero rows remain, no append-only-trigger blockers).
- **Blocker/gap**: none for the workflow itself. Two open questions disclosed, not silently decided: whether an actor should be able to revoke their own role, and whether any role should be revoke-protected — no existing domain rule addresses either. `ASSISTANT_PASTOR` still cannot successfully **grant** any role today (unchanged, structural, see the still-open decision note below) — revoke's own CLUSTER reachability does not retroactively fix grant's.
- **Priority**: DONE (was P1)

**Explicit product decision still needed for grant (unchanged from before this session, not resolved by revoke's build):** should `ASSISTANT_PASTOR` be able to grant Role Assignments within their own cluster at all? If yes, `RoleAssignmentService.grant()`'s `ResourceContext` needs a `bacentaId` populated from the *candidate Person's* current Bacenta membership (mirroring `PersonScopeService`'s own resolution for other People-module actions). If no, the CLUSTER row in `permission-matrix.ts` for `.grant`/`.grant_shepherd` is misleading and should be removed or re-scoped by whoever owns that call. This document takes no position — it only reports the finding.

### [Known blocker] Multi-Role-Assignment Login
- **Persona**: any Person holding 2+ concurrent active Role Assignments
- **Journey**: such a Person cannot log in at all
- **Impl status**: hard `ConflictException`, by design, pending a product decision — confirmed in `actor-context-resolver.service.ts` and its own test
- **RBAC/API**: VERIFIED as intentional, not a bug
- **Blocker/gap**: this is a real product gap, not an engineering bug — needs a decision (pick one role? merge permissions? disallow at data layer?)
- **Priority**: P2 (workaround exists: don't grant a second concurrent role)

---

## 2. GATHERINGS & ATTENDANCE

### Gathering Calendar (list/view, filter by type)
- **Persona**: Resident Pastor/Admin/Usher (BRANCH), Assistant Pastor (CLUSTER, **fixed this session**), Bacenta/Basonta Leader (OWN_GROUP, Basonta Leader **fixed this session**)
- **Journey**: leader opens Gatherings, sees upcoming/past Gatherings in their scope with an attendance-completeness badge on past ones
- **Impl status**: COMPLETE for all 6 roles holding a `.read` grant, as of this session's two fixes
- **UI**: VERIFIED (`GatheringsListPage.tsx`)
- **API**: VERIFIED (`GET /gatherings`, `GET /gatherings/:id`)
- **DB**: VERIFIED
- **RBAC**: VERIFIED — this session added/exercised the `ASSISTANT_PASTOR` CLUSTER row and the `BASONTA_LEADER` OWN_GROUP default-query fix; full `describe.each` executable spec covers every row
- **RLS**: **VERIFIED live** — this session ran real Postgres checks: Branch Pastor denied an out-of-cluster (same-Branch) Bacenta's Gathering, Basonta Leader denied another Basonta's Gathering, unauthenticated → 401, unrelated role → 403 with correct reason
- **Downstream**: feeds `AttendanceCompletenessBadge` per row
- **Tests**: VERIFIED (17 api specs, 3 web-admin specs, all passing: 577/577 api, 212/212 web-admin at last full run)
- **Live verification**: VERIFIED (this session, twice — Branch Pastor and Basonta Leader personas)
- **Blocker/gap**: no Group/Bacenta picker filter in the UI (needs a picker component that doesn't exist yet)
- **Priority**: P3 (was P1 before this session's two fixes; now closed)

### Gathering Create/Update (configure)
- **Persona**: Admin (BRANCH, only role that can create Branch-wide), Assistant Pastor (CLUSTER), Bacenta/Basonta Leader (OWN_GROUP). **Correction to this document, traced directly against `permission-matrix.ts` this session — Resident Pastor holds only `gatherings.gathering.read`, no `.create`/`.update` row exists for that role at all.** This matches the same oversight-only pattern already found for Lifecycle Transition and Role Assignment grant — Resident Pastor is consistently read/oversight-only across several PRD domains, not a bug.
- **Journey**: leader opens Gatherings → Create Gathering → enters type/owner group/schedule/venue → submits → sees it in the list → opens it → edits it inline → saves → fresh read reflects the change
- **Impl status**: COMPLETE and **VERIFIED live this session** — the full Web Admin create/update workflow now exists, reusing the page's own established reveal-panel/inline-edit convention (no new UI framework, no redesign)
- **UI**: VERIFIED (`GatheringsListPage.tsx` — "+ Create Gathering" reveal panel; per-row "Edit" inline panel pre-filled from the real `GatheringResponseDto` already in hand, no extra fetch/detail route). `type` is free text (no configured-type list exists anywhere in the backend to validate against — traced, not assumed). Status picker is driven by `nextGatheringStatusOptions`, which filters `@ecclesia/domain-gatherings`'s real, server-validated forward-only state machine, so it can never offer a transition the server would reject.
- **API**: VERIFIED (`POST /gatherings`, `PATCH /gatherings/:id`) — both single-statement Prisma calls in `GatheringRepository`, confirmed **not** affected by the nested-`$transaction`-escapes-branch-scope bug class fixed elsewhere this session in Group Membership/Financial Transaction/Role Assignment repositories
- **DB**: VERIFIED — real Postgres insert/update, `Prisma.JsonNull` handling for clearing `config` (not exercised by the Web Admin form, which deliberately omits the free-form `config` JSON field on both create and update)
- **RBAC**: VERIFIED live — Admin create/update succeed; Resident Pastor create/update both correctly 403 ("No Role Assignment grants 'gatherings.gathering.create'/'.update' to role 'RESIDENT_PASTOR'")
- **RLS/scope**: **VERIFIED live** — Basonta Leader create against their own Basonta succeeds (201); create against a second, real, different Basonta correctly 403s ("Resource is outside the actor's OWN_GROUP scope for 'gatherings.gathering.create'"); create with no `ownerGroupId` (Branch-wide) as the same OWN_GROUP-scoped Basonta Leader also correctly 403s for the identical reason
- **Downstream**: **VERIFIED live** — a freshly created Gathering immediately accepted a real `POST /gatherings/:id/attendance-records` call (Admin persona), and a fresh `GET` of that Gathering's attendance records reflected it; `AttendanceRecordService.record()` has no status precondition, confirmed by reading the code, not assumed
- **Tests**: VERIFIED — 8 new `web-admin` UI tests (create success incl. field-level POST body assertion, create RBAC-denial inline message, create cancel, edit success incl. pre-fill + PATCH body assertion + fresh-read-shows-update, edit conflict inline message, edit cancel) + 6 new hook tests (`createGathering`/`updateGathering` POST/PATCH shape and error propagation, `nextGatheringStatusOptions` filtering) — full suite 256/256 web-admin, 577/577 api passing
- **Live verification**: **VERIFIED live this session** against real Postgres via `nx serve api` + dev-auth — create (201) → fresh read confirms persistence → update (200) → fresh read confirms the updated `venue`/`scheduledEnd` → Resident Pastor create+update both 403 → Basonta Leader cross-group create 403 (real second Group, not just a 404) → Basonta Leader Branch-wide create 403 → attendance record created against the new Gathering and confirmed on a fresh read → all fixtures cleaned up (fresh read of the deleted Gathering correctly 404s, no append-only-trigger blockers encountered)
- **Blocker/gap**: none found. The `config` free-form JSON field is deliberately not exposed in either form (no generic JSON editor built) — same judgment already made and disclosed for the field itself, not a newly discovered gap.
- **Priority**: DONE (was P1)

### Attendance Capture
- **Persona**: Usher (mobile-primary), Bacenta/Basonta Leader (mobile-primary)
- **Journey**: at-the-door tap-to-mark-present flow
- **Impl status**: COMPLETE, mobile-only by deliberate design (PRD names this a mobile persona flow)
- **UI**: VERIFIED on mobile; MISSING on Web Admin (correctly, not a gap)
- **API/DB/RBAC**: VERIFIED
- **RLS**: UNVERIFIED this session
- **Downstream**: feeds Attendance Completeness Badge, Insights Attendance KPI
- **Tests**: VERIFIED
- **Live verification**: not run this session
- **Priority**: P3 (Web Admin is this program's focus; mobile is out of scope for now)

### Visitor Intake + auto Follow-up Task creation
- **Persona**: Usher (mobile-primary)
- **Journey**: capture a visitor at the door; if first-time guest with a stated Bacenta preference, a Follow-up task auto-creates for that Bacenta's Leader
- **Impl status**: COMPLETE — the **one real cross-domain automation** in this codebase
- **UI**: VERIFIED on mobile
- **API/DB**: VERIFIED
- **RBAC**: VERIFIED
- **RLS**: UNVERIFIED this session
- **Downstream**: **VERIFIED as designed** — `VisitorIntakeService.submit()` calls `GroupLeadershipService` to resolve the active Bacenta Leader and creates the task; silently skips if unresolvable (disclosed, not silently broken)
- **Tests**: VERIFIED
- **Live verification**: not run this session
- **Priority**: P3

### GatheringSeries Management (recurring series)
- **Persona**: would be Resident Pastor/Admin
- **Impl status**: MISSING — no Web Admin surface; recurrence-rule format itself is still an undefined opaque string
- **Priority**: P2 (real limitation, workaround is creating each Gathering individually)

---

## 3. PASTORAL CARE

### Follow-up Task Creation (manual)
- **Persona**: Assistant Pastor (CLUSTER), Bacenta Leader (OWN_GROUP). **Correction to this document, traced directly against `permission-matrix.ts` this session — Resident Pastor holds only `.read`/`.update` (BRANCH), no `.create` row exists for that role at all; Admin holds only `.read` (BRANCH), no `.create`/`.update` at all.** Scope resolves from the *subject Person's own* active Bacenta membership (`PersonScopeService.loadResourceContext`), not the acting user's — the selected subject must actually belong to a Bacenta the actor's scope reaches.
- **Journey**: leader opens Pastoral Care → Create Follow-up task → selects the subject Person → selects an assignee → optionally names a Group and a due-date override → submits → sees it in the queue → continues it (Complete or Escalate) → fresh read reflects the resulting state
- **Impl status**: COMPLETE and **VERIFIED live this session** — the full Web Admin creation workflow now exists, reusing the page's own established reveal-panel convention and the existing `RecordPicker`/`searchPeopleForEscalation` machinery Escalate already built (no new UI framework, no redesign)
- **UI**: VERIFIED (`FollowUpTaskQueuePage.tsx` — "+ Create Follow-up task" reveal panel: Person `RecordPicker` (subject), Assign to `RecordPicker`, optional Group `RecordPicker` (reused `searchGroupsForAssignment` from People), optional due-date-override `Input`). No task type/status/priority/outcome semantics were invented — only the fields `createFollowUpTaskSchema` actually accepts.
- **API**: VERIFIED (`POST /people/:personId/follow-up-tasks`) — single-statement Prisma call in `FollowUpTaskRepository.create`, confirmed **not** affected by the nested-`$transaction`-escapes-branch-scope bug class fixed elsewhere this session
- **DB**: VERIFIED — real Postgres insert, `dueAt` correctly computed server-side from the `MANUAL` trigger's SLA default when no override is supplied
- **RBAC**: VERIFIED live — Assistant Pastor (CLUSTER) create succeeds for a subject Person in their cluster Bacenta; Admin and Resident Pastor create both correctly 403 with the real RBAC denial message
- **RLS/scope**: **VERIFIED live** — Assistant Pastor create against a real, different, out-of-cluster Bacenta's Person correctly 403s ("Resource is outside the actor's CLUSTER scope for 'pastoral_care.followup_task.create'"); a real cross-Branch Person correctly 404s for both Admin and Assistant Pastor (RLS blocks the row from resolving at all, not merely an RBAC scope check)
- **Downstream**: **Complete publishes a real `follow_up.completed` `PublishableEngagementSignal` to AWS EventBridge** (`EventBridgePublisherService`, pre-existing code, not built this session) — confirmed live: this machine has real AWS credentials configured, and the Complete call in this session's verification made an actual `PutEvents` call. No local `apps/worker` consumer was running, so no `insights.engagement_signals` row was written (confirmed: table empty after the call) — the publish step itself is real and verified; the full ingestion chain into Church Pulse was not independently exercised this session (would require running `apps/worker` as an EventBridge consumer too). **Escalate has no downstream publish** (confirmed by reading `FollowUpTaskService.escalate()` — only `complete()` calls the publisher).
- **Tests**: VERIFIED — 3 new UI tests (create success incl. field-level POST body assertion + fresh-queue-shows-new-task, create RBAC-denial inline message, create cancel) + 2 new hook tests (`createFollowUpTask` POST shape and error propagation) — full suite 261/261 web-admin, 577/577 api passing
- **Live verification**: **VERIFIED live this session** against real Postgres via `nx serve api` + dev-auth — create (201, Assistant Pastor/CLUSTER) → fresh read confirms persistence → appears in the creating persona's own real queue (confirmed a task created **without** a `groupId` does *not* appear in a group-scoped queue view — a real, disclosed behavior of `listByGroup`'s own filter, not a bug) → Escalate (200) → fresh read confirms `ESCALATED` → Complete (200, on a separate task) → fresh read confirms `COMPLETED` → Admin and Resident Pastor create both 403 → Assistant Pastor cross-cluster create 403 (real second Bacenta) → cross-Branch create 404 for both Admin and Assistant Pastor (RLS) → all fixtures cleaned up (fresh read of the deleted task correctly 404s, no append-only-trigger blockers encountered)
- **Blocker/gap**: none found in the creation workflow itself. **Disclosed, not a defect**: a Follow-up task created with no `groupId` is invisible to any Group-scoped queue view (only a BRANCH-scoped `listByBranch` read, e.g. Resident Pastor/Admin, would surface it) — the Web Admin form's Group field is optional per the real schema, so this is expected behavior a user should understand, not a client-side omission.
- **Priority**: DONE (was P1)

### Follow-up Task Auto-Creation (general FR-PC-03)
- **Persona**: system-triggered, would benefit every pastoral persona
- **Impl status**: MISSING — "no concrete, buildable algorithm... needs a product decision, not an engineering guess" (design notes, verbatim). Only the narrower Visitor Intake case (above) auto-creates.
- **Priority**: P2 (documented product gap, not a silent bug)

### Follow-up Task Queue / Complete
- **Persona**: Resident Pastor/Admin (BRANCH), Assistant Pastor (CLUSTER), Bacenta Leader (OWN_GROUP)
- **Journey**: leader views their queue sorted by SLA/due date, marks a task Complete
- **Impl status**: COMPLETE. **Basonta Leader has no `.read` grant on this action at all** (403, confirmed, not merely a default-query gap like Gatherings had)
- **UI**: VERIFIED (`FollowUpTaskQueuePage.tsx`)
- **API**: VERIFIED
- **DB**: VERIFIED
- **RBAC**: VERIFIED for the 4 roles that hold the grant; VERIFIED-as-denied for Basonta Leader
- **RLS**: schema-level VERIFIED, not live-checked this session
- **Downstream**: none
- **Tests**: VERIFIED
- **Live verification**: not run this session
- **Blocker/gap**: Basonta Leader (Ministry Leader persona) cannot see any Follow-up queue at all
- **Priority**: P2

### Follow-up Task Escalation
- **Persona**: same as queue
- **Journey**: leader escalates a task to an explicitly-chosen Person
- **Impl status**: COMPLETE for explicit-target escalation. Automatic escalation-target resolution (BR-PC-04, org-hierarchy lookup) is MISSING — no org-hierarchy model exists in the schema
- **UI**: VERIFIED (`RecordPicker` reveal + submit)
- **API**: VERIFIED
- **DB**: VERIFIED
- **RBAC**: VERIFIED
- **RLS**: schema-level VERIFIED
- **Downstream**: none automatic
- **Tests**: VERIFIED
- **Live verification**: not run this session
- **Blocker/gap**: an OWN_GROUP Bacenta Leader can only search escalation targets within their own visible scope — cannot search "up" to find their actual Assistant Pastor
- **Priority**: P2

### Silent-Drift Detection
- **Persona**: worker sweep (system, writes flags nightly). Read: Resident Pastor/Admin (BRANCH), Assistant Pastor (CLUSTER), Bacenta Leader (OWN_GROUP) — traced against `permission-matrix.ts`, unchanged this session.
- **Journey**: nightly sweep flags Persons matching drift thresholds (BR-PC-02/FR-PC-05/§15.8's decision tree — attended enough main-service Gatherings but missed too many of their own Bacenta's meetings) → leader opens Silent-Drift flags → sees Branch-wide (or scoped) results → inspects the specific attendance pattern behind each flag (not a generic "at risk" label) → refetches.
- **Impl status**: COMPLETE and **VERIFIED live this session** — added the missing BRANCH-wide/optional-`groupId` listing endpoint (`GET /pastoral-care/silent-drift-flags`), byte-for-byte the same pattern this session's own Follow-up Task branch-wide listing endpoint established (new guard resolving `{ branchId: actor.branchId }` when no `groupId` query param is given, new repository `listByBranch`, new service `list()`), plus a read-only Web Admin section. The existing group-scoped route (`GET /pastoral-care/groups/:groupId/silent-drift-flags`) is byte-for-byte unchanged — confirmed still returns identical results live.
- **UI**: VERIFIED — a new "Silent-Drift flags" section on the existing `FollowUpTaskQueuePage.tsx` (Pastoral Care's page), read-only. No resolve/escalate action is offered — traced and confirmed `SilentDriftFlagController` exposes no mutation route at all (`GET` only), so unlike the Follow-up queue above it, there is genuinely nothing to act on here; inventing one was explicitly out of scope.
- **API**: VERIFIED (`GET /pastoral-care/silent-drift-flags`) — `branchId` is derived server-side from `ActorContext`, never accepted from the client (the new guard's `loadResource` reads `actor.branchId`, not any request field); a single-statement Prisma call, confirmed **not** affected by the nested-`$transaction`-escapes-branch-scope bug class found elsewhere this session.
- **DB**: VERIFIED — real Postgres read against `pastoral_care.silent_drift_flags`.
- **RBAC**: VERIFIED live — Admin and Resident Pastor (BRANCH) both succeed; Treasurer (no grant at all for this action) correctly 403s; an unauthenticated request correctly 401s.
- **RLS/tenant isolation**: **VERIFIED live** — a real flag belonging to a real second Branch does not appear in this Branch's Admin's Branch-wide list (RLS-scoped query, not merely an RBAC check).
- **Downstream**: unchanged by this milestone — still feeds the Insights alerts pipeline (§6) via the worker's own separate write path, not touched here. This endpoint is purely additive/read-only.
- **Tests**: VERIFIED — 4 new backend tests (repository `listByBranch` default/explicit-status, service `list()` groupId-present/absent branching, controller `list()` delegation, guard groupId-present/absent resolution) + 6 new Web Admin tests (Branch-wide load with real rendered data, groupId query param for OWN_GROUP-scoped roles, empty state, error state, no-mutation-action assertion) — full suite 584/584 api (was 577), 294/294 web-admin (was 282) passing.
- **Live Postgres verification**: **VERIFIED live this session** against real Postgres via `nx serve api` + dev-auth. Real fixtures were used to generate a genuine flag - not an invented one: a real Bacenta, a real Person with an active membership, 3 real main-service Gatherings with real `PRESENT` attendance records (satisfying node B), and 3 real Bacenta Meetings with zero attendance (failing node C) - the exact attendance counts (3 of 3, 0 of 3) were confirmed via direct query before writing the flag, so its `attendanceMissedCount`/`bacentaMissedCount` values are the real, correct output `evaluateSilentDrift()` would produce for these records, not arbitrary numbers. Sequence: 401 unauthenticated → 403 unauthorized (Treasurer) → `[]` empty state (Admin, before the fixture existed) → Branch-wide read returns the real flag with correct values (Admin and Resident Pastor both) → the pre-existing group-scoped route still returns the identical flag, unchanged → a real second-Branch flag is absent from this Branch's list (RLS) → a second, independent fresh read returns the identical persisted result → all fixtures cleaned up (verified via direct count, zero rows remain, no append-only-trigger blockers encountered).
- **AWS side effects**: **none, by deliberate choice, identified before execution.** `apps/worker`'s `SilentDriftSweepJob` (the only mechanism that writes real flags in production) calls the real `EventBridgePublisherService.publish()` for every newly-flagged Person — the same live-AWS-credentials risk already disclosed in the Follow-up Task Completion milestone. Rather than running that job (uncontrolled flag/call count) or inventing arbitrary field values, the fixture flag was constructed by computing the real `evaluateSilentDrift()` decision function's actual output for genuine attendance records created for this test, then written directly to Postgres — faithful to real application semantics, with zero AWS calls made. This endpoint itself (`GET .../silent-drift-flags`) is pure read, no AWS involvement at all.
- **Blocker/gap**: none found. The pre-existing structural CLUSTER-vs-BRANCH gap already disclosed for Follow-up Tasks/Bank Deposit does **not** apply here in the same way — Silent-Drift's `SilentDriftFlagListForActorResourceContextGuard` (like Follow-up Task's) resolves scope from an explicit `groupId` query param when supplied, so an Assistant Pastor naming their own cluster Bacenta can succeed; only the *Branch-wide, no-groupId* case is BRANCH-only by design, matching Follow-up Task exactly.
- **Priority**: DONE (was P1)

### Pastoral Notes
- **Persona**: Resident Pastor (BRANCH), Assistant Pastor (CLUSTER), Bacenta Leader (OWN_GROUP)
- **Impl status**: PARTIAL — real API, **no Web Admin UI** (deferred to a future `PersonDetailPage` enhancement)
- **UI**: MISSING
- **API/DB/RBAC**: VERIFIED
- **RLS**: schema-level VERIFIED
- **Tests**: VERIFIED at API layer
- **Priority**: P2

### Poimen Enrollment Tracking
- **Persona**: Resident Pastor/Assistant Pastor (create/update), Admin (read/update)
- **Impl status**: PARTIAL — real CRUD API, **no Web Admin UI** (explicitly Release-2 scope)
- **UI**: MISSING (by design, not a bug)
- **API/DB/RBAC**: VERIFIED
- **Priority**: P3

---

## 4. MINISTRY / GROUPS

### Group (Bacenta/Basonta) CRUD
- **Persona**: Resident Pastor/Admin (BRANCH create+read+update), Assistant Pastor (CLUSTER read+update, **no create** — deciding which cluster a brand-new Bacenta belongs to is itself an unresolved configuration question, `db/DESIGN_NOTES.md` Open Question #1), Bacenta/Basonta Leader (OWN_GROUP read+update, no create), Usher (BRANCH read only). Traced directly against `permission-matrix.ts` — create is BRANCH-only, no CLUSTER/OWN_GROUP create grant exists at all for any role.
- **Bacenta/Basonta semantics**: both are the same `people.groups` row (`type: PASTORAL_CARE` = Bacenta, `type: MINISTRY` = Basonta) behind the same `POST/GET/PATCH /groups` routes — no separate create flow per type, matching the real `createGroupSchema`, which is `[INFERRED]` (no PRD §17.3 row covers Group creation at all) and deliberately accepts every optional field (`meetingSchedule`/`meetingLocation`/`category`) regardless of `type`, not type-conditionally required. `lifecycleStatus` (`ACTIVE`/`SPLITTING`/`MERGING`/`ARCHIVED`) has **no transition-validating state machine anywhere in `libs/domain/people`** (confirmed by reading `GroupService.update()` and searching the domain lib) — unlike Gathering's real `checkGatheringStatusTransition`, so nothing was invented here; the form offers the flat status set directly, matching the backend's own unconstrained acceptance. Leadership is deliberately not a Group field — it's a separate Role Assignment (`RoleAssignmentService.grant()`), confirmed not touched by this workflow.
- **Impl status**: COMPLETE and **VERIFIED live this session** — the existing Basonta-only directory (`BasontaDirectoryPage.tsx`) is broadened to list both Bacentas and Basontas (real `GET /groups`, no `type` filter — the endpoint always supported both, only the page's own hard-coded query restricted it) and gains Create + inline per-row Edit, reusing the exact reveal-panel convention every other milestone this session established. The Basonta-specific roster `Link` (`/ministry/:id` → `BasontaRosterView`) is preserved exactly as-is and stays Basonta-only — a Bacenta row renders as plain text rather than inventing a roster destination that doesn't exist in this codebase for Bacentas.
- **UI**: VERIFIED (`BasontaDirectoryPage.tsx` — "+ Create Group" reveal panel with a Type select (Bacenta/Basonta) plus Name/Schedule/Location/Category fields; per-row "Edit" inline panel covering every `updateGroupSchema` field including `lifecycleStatus`). `useBasontaDirectory` renamed to `useGroupDirectory` (single call site, no other consumer — confirmed via repo-wide grep) since its old name no longer matched what it does.
- **API**: VERIFIED (`POST /groups`, `PATCH /groups/:id`) — single-statement Prisma calls in `GroupRepository`, confirmed **not** affected by the nested-`$transaction`-escapes-branch-scope bug class fixed elsewhere this session.
- **DB**: VERIFIED — real Postgres insert/update.
- **RBAC**: VERIFIED live — Admin (BRANCH) create/update succeed; Assistant Pastor (CLUSTER) create correctly 403s (no create grant exists for this role at all, not a scope failure); Assistant Pastor update on a Bacenta genuinely outside their cluster correctly 403s ("outside the actor's CLUSTER scope"), and the identical update succeeds (200) once that same Bacenta is added to their cluster scope — proving the positive CLUSTER case, not just denial.
- **RLS/tenant isolation**: **VERIFIED live** — a real Group in a second, real Branch is completely unreachable to this Branch's Admin: single read 404s (RLS blocks the row from resolving at all, not merely an RBAC scope check) and the Branch-wide list does not leak it. **Documentation correction, not a defect**: `GroupRepository`'s own doc comment claims "RLS not yet wired... `db/DESIGN_NOTES.md` Open Question #3" and its queries carry no explicit `branchId` filter on `findById`/`update` — traced against the actual migration and confirmed **RLS genuinely is wired** (`ALTER TABLE people.groups ENABLE ROW LEVEL SECURITY` + `groups_branch_isolation` policy, `db/migrations/20260801000000_init_bounded_context_schemas/migration.sql`), and this session's live cross-Branch test above proves it enforces correctly. The comment is stale, left over from before RLS was wired; nothing here was changed to fix it, since it's a documentation issue, not a behavioral one.
- **Downstream workflow verification**: **VERIFIED live, all four**, using one real newly-created Bacenta: (1) **Group Membership Assignment** — a real Person was assigned to it via `POST /people/:id/group-memberships`, confirmed on a fresh read; (2) **Gathering Create/Update** — a real Gathering was created with `ownerGroupId` set to it, confirmed via a fresh `GET /gatherings?ownerGroupId=`; (3) **Role Assignment** — a real `BACENTA_LEADER` grant was issued against it via `POST /people/:id/role-assignments`; (4) **Follow-up Task creation/visibility** — a real task was created with `groupId` set to it and confirmed visible in the group-scoped queue read. All four existing Release 1 workflows consumed the newly created Group with zero changes to any of them.
- **Tests**: VERIFIED — 7 new/updated UI tests (both-types list + type Badge, Basonta-linked/Bacenta-plain-text row rendering, empty state, error state, create success incl. field-level POST body assertion + directory refresh, create RBAC-denial inline message, create cancel) + 3 new edit tests (pre-fill + PATCH body assertion + fresh-read-shows-update, server-error inline message, cancel) + 4 new hook tests (`createGroup`/`updateGroup` POST/PATCH shape and error propagation) + 1 pre-existing `MinistryPage.spec.tsx` assertion updated for the new copy — full suite 272/272 web-admin, 577/577 api passing.
- **Live Postgres verification**: **VERIFIED live this session** against real Postgres via `nx serve api` + dev-auth — create (201, Admin) → fresh read confirms persistence → appears in the real branch-wide list → update (200) → fresh read confirms the renamed/relocated fields → Assistant Pastor create 403 (no grant) → Assistant Pastor out-of-cluster update 403 → Assistant Pastor in-cluster update 200 (positive CLUSTER case) → real cross-Branch Group 404s on single read and is absent from the list (RLS) → all four downstream workflows above → all fixtures cleaned up (fresh read of the deleted Group correctly 404s, no append-only-trigger blockers encountered).
- **Blocker/gap**: none found. No live AWS side effects were triggered this pass (Group CRUD's own code path never calls `EventBridgePublisherService`; the downstream Follow-up Task check only exercised Create, not Complete, specifically to avoid the real AWS `PutEvents` call already disclosed and confirmed in the prior Follow-up Task Creation milestone).
- **Priority**: DONE (was P1)

### Basonta Directory Listing
- **Persona**: Resident Pastor/Admin (BRANCH)
- **Impl status**: COMPLETE for BRANCH-scoped roles. Assistant Pastor gets 403, but **this is not the same bug class as the Gatherings fixes** — confirmed by reading `evaluate.ts`'s `resourceInScope()` directly: CLUSTER scope's implementation only ever checks `resource.bacentaId`, never `resource.basontaId`, and `ActorContext` has no `clusterBasontaIds` field at all. A Basonta/MINISTRY-type resource **cannot structurally satisfy CLUSTER scope no matter what query parameter is supplied** — unlike Gatherings (Bacenta-owned, which CLUSTER *does* support), fixing this needs either a genuine RBAC-model extension (a `clusterBasontaIds` concept) or a product decision that Assistant Pastor's cluster oversight was never meant to include Basontas at all (plausible — Basontas are cross-cutting ministry teams, not Bacenta-cluster-shaped). **Do not fix this the same way as the Gatherings default-query bug — it needs a decision first.**
- **UI**: VERIFIED (`BasontaDirectoryPage.tsx`)
- **API**: VERIFIED for BRANCH scope; confirmed 403 for Assistant Pastor (correct behavior pending the above decision, not confirmed-incorrect)
- **DB**: VERIFIED
- **RBAC**: VERIFIED as structurally CLUSTER-incompatible for any Basonta resource, by current design
- **RLS**: VERIFIED (People module)
- **Tests**: VERIFIED
- **Blocker/gap**: Branch Pastor (Assistant Pastor) cannot view the Basonta directory — real gap, but the fix requires a product/design decision, not a quick engineering patch
- **Priority**: P2 (downgraded from an initial P1 read — needs a decision before it's "shovel-ready," matching this codebase's own treatment of the Multi-Role-Assignment login gap)

### Basonta Roster View
- **Persona**: Basonta Leader (OWN_GROUP), Resident Pastor/Admin (BRANCH)
- **Impl status**: COMPLETE for these roles
- **UI**: VERIFIED (`BasontaRosterView.tsx`/`BasontaRosterPage.tsx`)
- **API**: VERIFIED (`GET /ministry/groups/:groupId/roster`)
- **DB/RBAC/RLS**: VERIFIED
- **Tests**: VERIFIED
- **Priority**: P3

### Staffing Targets
- **Persona**: Basonta Leader (create/edit), Resident Pastor/Admin (read-only)
- **Impl status**: COMPLETE and more built than the roadmap discloses — `StaffingTargetsPanel.tsx` exists (embedded in roster view and Ministry Leader dashboard), backed by a real list/upsert endpoint
- **UI**: VERIFIED to exist, but **UNVERIFIED by any test** — zero `.spec` files for `StaffingTargetsPanel.tsx`, `useStaffingTargetsData.ts`, or `MinistryLeaderDashboard.tsx`
- **API/DB/RBAC**: VERIFIED
- **RLS**: VERIFIED (Ministry module)
- **Tests**: **MISSING** at the UI layer
- **Live verification**: not run
- **Blocker/gap**: a real, working UI feature with zero regression coverage
- **Priority**: P2

### Worker Availability
- **Persona**: Worker/Member/Basonta Leader (SELF)
- **Impl status**: COMPLETE at API layer, **no UI anywhere** (deliberately deferred, "a different page's job")
- **UI**: MISSING (by design)
- **API/DB/RBAC**: VERIFIED
- **Tests**: VERIFIED at API layer
- **Priority**: P3

### Group Leadership Resolution
- **Persona**: system-internal (used by Visitor Intake, Insights leaderboard)
- **Impl status**: COMPLETE, real query, Bacenta-only by design (Basonta leadership resolves via `OWN_GROUP` equality, no lookup needed)
- **Tests**: VERIFIED
- **Priority**: P3 (infrastructure, not a persona-facing workflow)

---

## 5. STEWARDSHIP

### Record Financial Transaction
- **Persona**: Bacenta Leader (OWN_GROUP), Treasurer/Member (SELF) — Resident/Assistant Pastor explicitly DENYd (BR-STW-01)
- **Impl status**: COMPLETE
- **UI**: VERIFIED (inline form, `StewardshipPage.tsx`)
- **API/DB**: VERIFIED (append-only event model)
- **RBAC**: VERIFIED, including the explicit DENY rows
- **RLS**: **VERIFIED live, and the flagged bug confirmed + fixed this session.** `financial-transaction.repository.ts`'s `createWithEvent()` opened its own nested `this.prisma.$transaction(...)` — confirmed live (real 500 reproduced against Postgres before the fix, `unrecognized configuration parameter "app.current_branch_id"`) — the exact same defect as `GroupMembershipRepository.applyChange`. Fixed by removing the nested transaction.
- **Tests**: VERIFIED — repository spec rewritten to match the fixed implementation
- **Live verification**: **VERIFIED** — real transaction recorded end to end, no 500, correct persistence
- **Priority**: P3 (resolved this session)

### Verify Transaction
- **Persona**: Treasurer (BRANCH), with `DIFFERENT_ACTOR_THAN_RECORDER` record-level check
- **Impl status**: COMPLETE
- **UI/API/DB/RBAC**: VERIFIED
- **RLS**: **VERIFIED live, fixed this session.** `appendEvent()` (the shared state-transition method) had the identical defect, fixed the same way.
- **Tests**: VERIFIED
- **Live verification**: **VERIFIED** — a real transaction walked `RECORDED → FLAGGED → UNDER_INVESTIGATION → VERIFIED → RECONCILED` end to end (one transaction, five real state transitions, no 500 anywhere); BR-STW-04's same-actor denial re-confirmed live (recorder attempting to verify their own transaction still correctly 403s — the RLS fix did not weaken this)
- **Priority**: P3 (resolved this session)

### Flag / Escalate Transaction
- **Persona**: Treasurer
- **Impl status**: COMPLETE for manual flag/escalate. `Flagged → UnderInvestigation` **auto-transition does not exist** — worker sweep only signals, no "system actor" exists to auto-mutate (disclosed, architectural)
- **UI/API/DB/RBAC/RLS**: **VERIFIED live** — see Verify Transaction above; same fix, same live walkthrough
- **Tests**: VERIFIED
- **Priority**: P3 (resolved this session)

### Reconcile Transactions
- **Persona**: Treasurer
- **Impl status**: COMPLETE — bank-deposit-vs-verified-totals comparison is real, computed in-memory (no DB relation between the two tables, a disclosed design choice)
- **UI/API/DB/RBAC/RLS**: **VERIFIED live** — `reconcile()` calls the same fixed `transitionTo()`/`appendEvent()` path; confirmed as the final step of this session's live end-to-end transaction walkthrough
- **Tests**: VERIFIED
- **Priority**: P3 (resolved this session)

### Request / Approve / Reject / Pay Expense
- **Persona**: request — Resident Pastor(BRANCH)/Assistant Pastor(CLUSTER)/leader roles(OWN_GROUP)/Treasurer(BRANCH); approve — Resident Pastor(BRANCH)/Assistant Pastor(CLUSTER), `DIFFERENT_ACTOR_THAN_RECORDER`; pay — Treasurer(BRANCH)
- **Impl status**: COMPLETE
- **UI/API/DB/RBAC**: VERIFIED
- **RLS**: **VERIFIED live, and a real correction to this document's own prior claim.** An earlier pass in this matrix asserted Expense workflows were confirmed *not* to use the nested-`$transaction` pattern — that was **wrong**, based on an incomplete grep that checked `expense.repository.ts` alone and missed that `ExpenseService.request()`/`approve()`/`reject()`/`pay()`/`attachReceipt()` all call `FinancialTransactionRepository.createWithEvent()`/`appendEvent()` directly (Expense is a 1:1 extension of the same table). Expense was **equally affected** and is now fixed by the same change.
- **Tests**: VERIFIED
- **Live verification**: **VERIFIED** — a real Expense walked `REQUESTED → APPROVED → PAID` end to end (two different real actors, satisfying `DIFFERENT_ACTOR_THAN_RECORDER`), no 500, correct persistence on a fresh read
- **Priority**: P3 (resolved this session)

### Attach Receipt (file upload)
- **Persona**: expense requester
- **Impl status**: **COMPLETE — the roadmap's "no file storage infra exists" claim is now stale.** A local-filesystem-backed upload service, controller routes, and `ReceiptUploadPanel.tsx` (progress bar, preview) all exist and are wired
- **UI**: VERIFIED
- **API**: VERIFIED
- **DB**: VERIFIED (storage key recorded)
- **RBAC/RLS**: VERIFIED
- **Tests**: VERIFIED
- **Blocker/gap**: local disk storage is not durable/shared across ephemeral compute if ever deployed to Fargate — a real future blocker, not a current one (nothing is deployed yet)
- **Priority**: P3 for Release 1 (local dev works); P1 the day this ships to real multi-instance infrastructure

### Bank Deposit Confirmation
- **Persona**: Treasurer (confirm, BRANCH — the only role that can confirm at all, traced against `permission-matrix.ts`). Read (reconciliation view): Treasurer (BRANCH), Resident Pastor (BRANCH); Assistant Pastor holds a `CLUSTER` row but can never actually satisfy it — `BankDepositConfirmationListResourceContextGuard` always resolves the actor's own whole Branch, the same structural CLUSTER-vs-BRANCH gap already disclosed for `stewardship.transaction.read`'s equivalent list endpoint. Admin holds **no row at all** for this action — cannot even read the reconciliation view.
- **Bank Deposit semantics**: a `BankDepositConfirmation` is **not** a state on an existing entity — "confirm" is a **create**, a write-once record of a Treasurer's physical-slip confirmation for one Bacenta/week (`@@unique([groupId, weekStartDate])`). There is no `PATCH`/delete route anywhere on this controller and the repository's own doc comment confirms a duplicate confirm attempt 409s rather than updating — **confirmation is immutable/irreversible once recorded**, not a bug, by design. The reconciliation view (`GET /bank-deposit-confirmations/reconciliation?weekStartDate=`) merges this Branch's Verified-or-later Financial Transaction totals per Bacenta for the week against any existing confirmation for the same Bacenta/week — `matched` is only `true` when a confirmation exists and its amount equals the verified total exactly. Confirming a deposit **does not mutate the underlying Financial Transaction(s) at all** (confirmed live — the transaction's `currentState` was still `VERIFIED` after confirming), and (confirmed by reading the whole service) has **no downstream `EventBridgePublisherService` call at all** — unlike Follow-up Task's Complete action, this has zero AWS side effects.
- **Impl status**: COMPLETE and **VERIFIED live this session** — added a "Bank Deposit Reconciliation" section to the existing `StewardshipPage.tsx`, reusing its own established reveal-panel/queue conventions (this page previously had zero Bank Deposit surface at all, not even read-only).
- **UI**: VERIFIED (`StewardshipPage.tsx` — a week-starting date picker drives `GET .../reconciliation`; each unmatched row gets an inline "Confirm Deposit" form (amount + optional bank reference); a matched/confirmed row has no action, since there is genuinely nothing further to do to it). No client-side role gate — the backend's real response is what every caller sees.
- **API**: VERIFIED (`POST /bank-deposit-confirmations`) — a single-statement Prisma call in `BankDepositConfirmationRepository.create`, confirmed **not** affected by the nested-`$transaction`-escapes-branch-scope bug class fixed elsewhere this session.
- **DB**: VERIFIED — real Postgres insert; the `@@unique([groupId, weekStartDate])` constraint enforced live (see Persistence below).
- **RBAC**: VERIFIED live — Treasurer confirm succeeds (201); Resident Pastor confirm correctly 403s (read-only grant, no confirm authority).
- **RLS/tenant isolation**: **VERIFIED live** — a real Group in a real second Branch is completely unreachable to this Branch's Treasurer: the confirm attempt 404s (RLS blocks the row from resolving at all, the same "can't even see it" shape every other cross-Branch check this session has found, not merely an RBAC scope denial).
- **Persistence**: **VERIFIED live** — confirm (201) → fresh reconciliation read shows `matched: true` with the correct deposited amount/bank reference → a second, independent fresh read (simulating a Web Admin reload) shows the identical confirmed state, unchanged → a duplicate confirm attempt for the same Bacenta/week correctly 409s, proving the write-once/irreversible semantics live, not just from reading the code.
- **Downstream effects**: **Verified — genuinely none exist.** Confirming a deposit does not alter Financial Transaction state, does not create an audit event, and does not call EventBridge (all three confirmed by reading `BankDepositConfirmationService` end to end, and the Financial-Transaction-unchanged claim additionally confirmed live). This is disclosed as a real finding, not an oversight — this workflow correctly has fewer downstream effects than Follow-up Task Completion or Gathering Attendance.
- **AWS side effects**: **none.** Identified before live execution (no `EventBridgePublisherService` call exists anywhere in this service) and confirmed live — zero AWS calls were made verifying this workflow, unlike the Follow-up Task Completion milestone.
- **Tests**: VERIFIED — 8 new UI tests (no-fetch-until-week-chosen, row rendering with match-state badges, confirm success incl. field-level POST body assertion + refetch-shows-matched, confirm-disabled-for-invalid-amount via the shared amount parser, server-error inline message on a 409, cancel, retryable error state, empty state) + 3 new hook tests (`confirmBankDeposit` POST shape, 409 and 403 error propagation) — full suite 282/282 web-admin, 577/577 api passing.
- **Live Postgres verification**: **VERIFIED live this session** against real Postgres via `nx serve api` + dev-auth — reviewed the unmatched row → confirmed (201) → fresh read shows `matched: true` → simulated reload shows the same state → Resident Pastor confirm 403 → duplicate confirm 409 (irreversibility) → real cross-Branch Group confirm 404 (RLS) → confirmed the underlying Financial Transaction was untouched → all fixtures cleaned up (fresh reconciliation read for the week is empty again, no append-only-trigger blockers encountered — this fixture never touched `financial_transaction_events`, the one genuinely append-only table found earlier this session).
- **Blocker/gap**: none found. Admin cannot read the reconciliation view at all (no RBAC row exists) and Assistant Pastor's `CLUSTER` read row is structurally unreachable (same disclosed class of gap as Financial Transaction's own list endpoint) — both pre-existing backend facts, traced and disclosed here, not created or changed by this milestone.
- **Priority**: DONE (was P1)

### Pledge / Project Tracking
- **Persona**: would be Resident Pastor/Treasurer
- **Impl status**: MISSING at UI layer entirely — real backend controllers/services exist (progress aggregation included) but **zero Web Admin surface**, explicitly deferred (Horizon 2 per roadmap)
- **Priority**: P3 (Horizon 2 scope, correctly not built yet)

---

## 6. INSIGHTS / CHURCH PULSE

### Church Pulse Score Computation (Branch & Group scope)
- **Persona**: system-computed, read by every dashboard
- **Impl status**: COMPLETE — **but was silently broken until earlier today.** A weights-normalization bug (`toWeightsRecord`) made every Branch's Church Pulse score compute to a hardcoded 0, since no Branch has ever configured `church_pulse_weights` (no Configuration UI exists to set it — see §7). Fixed this session's predecessor commit (`9b3364a0`), with new unit coverage (`church-pulse-scoring.spec.ts`).
- **UI**: N/A (internal computation)
- **API**: VERIFIED (fix confirmed via passing tests)
- **DB**: VERIFIED, but **stale pre-fix rows still exist** in any environment seeded before the fix — they carry the old, wrong 0.00 score until the worker's `church-pulse-recompute` job runs again
- **RBAC/RLS**: N/A at this internal layer
- **Tests**: VERIFIED (new spec added same-day)
- **Live verification**: this session's own live check against dev seed data (earlier in this thread) predates the fix's deployment to that data — the 0.00 branch score observed there was very likely this exact bug, not a real signal absence. Worth a fresh live recompute check.
- **Blocker/gap**: no Configuration UI exists to ever set non-default weights (see §7) — acceptable per OQ-10's "equal-sixths placeholder," not a bug on its own
- **Priority**: P0 (was — silent, system-wide, undetectable-without-code-reading data corruption on the product's flagship metric). **Now fixed and tested; residual stale-data risk is P2.**

### Branch Dashboard Summary (Members/Attendance/Giving/Volunteers/Growth/Bacenta Leaderboard/Engagement Trend)
- **Persona**: Resident Pastor / Acting Resident Pastor (BRANCH)
- **Journey**: Resident Pastor opens Dashboard, sees real KPIs, growth chart, Bacenta leaderboard, engagement trend
- **Impl status**: COMPLETE — built and live-verified this session
- **UI**: VERIFIED (`ResidentPastorDashboard.tsx`, real values, honest empty/loading states, no silent demo fallback)
- **API**: VERIFIED (`GET /insights/branch-dashboard-summary`)
- **DB**: VERIFIED
- **RBAC**: VERIFIED (reuses `insights.branch_dashboard.read`, no new permission)
- **RLS**: **VERIFIED live** this session — cross-branch isolation confirmed for Volunteers, Bacenta Leaderboard, and Engagement Trend against a real second Branch
- **Downstream**: none
- **Tests**: VERIFIED (115 api suites / 577 tests include this; dedicated 30-test service spec)
- **Live verification**: VERIFIED (this session, full RBAC-denial + cross-branch-isolation pass)
- **Blocker/gap**: Follow-up Health, Upcoming Events, Prayer Focus, and the Branch Comparison strip remain demo-sourced (disclosed, not hidden)
- **Priority**: P3 (was the active workstream; now closed for its scoped fields)

### Pastoral Care Alerts (read/resolve)
- **Persona**: same scopes as `branch-dashboard`
- **Impl status**: COMPLETE
- **UI**: VERIFIED (`AlertPriorityCard.tsx`)
- **API/DB/RBAC**: VERIFIED
- **RLS**: UNVERIFIED live this session (not directly exercised)
- **Tests**: VERIFIED
- **Priority**: P3

### Single-Bacenta / Cluster Drill-down Dashboard
- **Persona**: Bacenta/Basonta Leader (`bacenta-dashboard`), Assistant Pastor (`cluster-dashboard`)
- **Impl status**: PARTIAL — real single-Bacenta endpoints exist; **true multi-Bacenta ranked cluster view does not exist** (disclosed, matches the Gatherings/People CLUSTER-scope limitation pattern found repeatedly this session)
- **UI**: VERIFIED for single-group drill-down (`ClusterInsightsView.tsx`)
- **API**: VERIFIED
- **Tests**: VERIFIED
- **Priority**: P2

### Cross-Persona Dashboards (Ministry Leader / Finance Officer / Branch Pastor / Council Administrator)
- **Persona label ↔ Role mapping, from the repository, not invented**: "Ministry Leader" = `BASONTA_LEADER`; "Finance Officer" = `TREASURER`; "Branch Pastor" = `ASSISTANT_PASTOR`; "Council Administrator" (dashboard) = `ADMIN` — **not** `COUNCIL_OVERSEER`, a deliberate, disclosed mismatch (`CouncilAdministratorDashboard.tsx`'s own doc comment: `COUNCIL_OVERSEER` holds **zero** ALLOW rows anywhere in `permission-matrix.ts`, "Council Overseer is a Horizon 3 role" per `roles.ts`). `DashboardPage.tsx`'s router is the single source of truth for all six mappings, traced directly, not assumed.
- **Verification method**: full trace (route → component → hook → endpoint → guard → RBAC → RLS) for all six routing branches, followed by live verification against real Postgres via `nx serve api` + dev-auth, including two real minimal fixtures (a second Bacenta pair to prove Assistant Pastor's CLUSTER positive/negative access, since the seed data ships zero Bacenta groups; a second Branch, same technique as prior milestones) and real before/after mutations (a real Group Membership, Gathering, Attendance Record, and Follow-up Task) to confirm dashboards genuinely reflect real writes, not just render without erroring.

**Persona-by-persona findings:**

- **RESIDENT_PASTOR** (`ResidentPastorDashboard.tsx`) — Church Pulse hero, all four KPIs (Members/Attendance/Giving/Volunteers), the growth chart, Bacenta Leaderboard, and Engagement Trend are all real (`GET /insights/branch-dashboard` + `GET /insights/branch-dashboard-summary`), live-verified including two real before/after deltas (a Group Membership assignment moved `volunteersCount` 0→1; an Attendance Record moved `attendanceTotal` 0→1, both reflected within one fetch of a real mutation). The "Branch Comparison" panel is demo data but **correctly, visibly labeled on-screen** ("BRANCH COMPARISON — HORIZON 3 PREVIEW"). **Found, not fixed**: the "Recent Activity" timeline silently interleaves real resolved Alerts with four fabricated `DEMO_RECENT_ACTIVITY` entries (a fake pledge, a fake staffing update, etc.), sorted together with **no on-screen indication whatsoever** that some rows are fabricated — unlike the Branch Comparison panel, a user cannot tell which rows are real. "Upcoming Events" and the Follow-up Health sub-metric are demo data with the same no-on-screen-label gap. This is a UX-honesty finding (Phase 12), not a functional break.
- **ASSISTANT_PASTOR** (`BranchPastorDashboard.tsx`) — **CONFIRMED DEFECT, live-verified, not fixed**: the "Ministries" card calls `GET /groups?type=MINISTRY`, which **structurally 403s for every `ASSISTANT_PASTOR`, unconditionally** — `GroupListResourceContextGuard`'s own doc comment already discloses why ("an ASSISTANT_PASTOR's CLUSTER scope cannot match a bare `{ branchId }` resource at all... this route correctly denies them"). `BranchPastorDashboard.tsx`'s own doc comment claims this card is "real, live data" backed by a grant that "works" — that claim is false as written; the card always shows an error. A new regression test (`DashboardPage.spec.tsx`) now pins this exact, confirmed-live behavior. Separately, **the seeded `dev-assistant-pastor` persona itself has an empty `scopeGroupIds` array** (no Bacenta assigned), so logging in via the standard dev-auth roster today shows nothing but a broken Church Pulse error card — the positive in-cluster path was only reachable this pass via a temporary real Bacenta-pair fixture (created, live-verified both positive in-cluster 200 and negative out-of-cluster 403 on `GET /insights/cluster-dashboard/:groupId`, then fully cleaned up). Church Pulse, Alerts, and the Follow-ups card (`GET /pastoral-care/follow-up-tasks?groupId=...`) are all genuinely real and correctly CLUSTER-scoped once a cluster exists — live-verified including a real Follow-up Task create → card count delta. "Upcoming Gatherings" and "Prayer requests" are demo data with no on-screen label (same Phase 12 class as Resident Pastor's).
- **TREASURER** (`FinanceOfficerDashboard.tsx`) — all four KPIs, the Offering Summary, and the Pending Expense Requests card are real, client-computed from `GET /financial-transactions`/`GET /expenses` (the same real endpoints `StewardshipPage` uses), live-verified against the exact raw transaction data. No Church Pulse card — **correct by design**, not an oversight: `TREASURER` holds zero Insights grants anywhere in `permission-matrix.ts`, live-confirmed (403 on `GET /insights/branch-dashboard`). "Monthly Trends" reuses the **identical static demo giving series** `ResidentPastorDashboard` uses (not scoped to this Branch's real Treasurer data at all) and "Financial Alerts" is demo data — neither is on-screen labeled.
- **BASONTA_LEADER** (`MinistryLeaderDashboard.tsx`) — Roster Size, Overcommitted, Upcoming Gatherings KPIs, the Staffing Targets panel, Volunteer Availability, and the Upcoming Gatherings list are all real and correctly OWN_GROUP-scoped, live-verified including two real before/after deltas (the same Group Membership assignment above moved Roster Size 0→1 and appeared correctly in this dashboard too; a real Gathering created by this persona appeared in the Upcoming Gatherings card) and a real negative test (this persona's roster endpoint correctly 403s against a different, out-of-group fixture Bacenta). No Church Pulse card — **correct by design**: `BASONTA_LEADER` holds zero Insights grants anywhere in the matrix (worth a product decision — no Basonta-level engagement visibility exists at all for this persona — but not a bug this dashboard introduced). "Ministry attendance" trend and "Recent ministry activity" are demo data, no on-screen label.
- **BACENTA_LEADER** — correctly routed to the "lives on mobile" `EmptyState` stub (`DashboardPage.tsx`), unchanged, PRD §16.2's own explicitly-named highest-priority mobile surface. No Web Admin dashboard exists to verify, by design — not evaluated further this pass since no dev-auth persona or Web Admin route exercises it; the underlying OWN_GROUP RBAC shape for this role's equivalent dashboard-read grant (`insights.bacenta_dashboard.read`) is structurally identical to `BASONTA_LEADER`'s already-verified OWN_GROUP pattern above.
- **COUNCIL_OVERSEER** — **CONFIRMED GAP / PRODUCT DECISION, not fixed**, re-confirmed live this pass exactly as previously disclosed: this role holds **zero** ALLOW rows anywhere in `permission-matrix.ts` — live-verified 403 on every single dashboard-relevant endpoint (`branch-dashboard`, `/people`, `/groups`, `/platform/configuration`, `/platform/audit-log`, `/financial-transactions`). `DashboardPage.tsx` correctly routes this role to the generic "coming soon" stub rather than a broken real dashboard — internally consistent, not a defect. The pre-existing, separately-disclosed inconsistency remains: `ConfigurationPage.tsx`'s own client-side `ALLOWED_ROLES` gate and `nav-items.ts` both still admit `COUNCIL_OVERSEER` into `/configuration`, where every real backend call 403s — a real UX dead-end for this specific role on that one page, not this dashboard.
- **ADMIN** (`CouncilAdministratorDashboard.tsx`) — Church Health, all three KPIs (Total Members/Staffing/Open Alerts), the read-only Alert Priority card, and Recent Activity (the real-only `RecentActivityCard`, not the demo-blended dashboard-only timeline Resident Pastor uses) are all real, live-verified. Multi-Branch Overview is demo data and **correctly, visibly labeled on-screen** ("Preview - Council-wide consolidation is Horizon 3 (PRD §7.3)..."). **A dashboard↔workflow inconsistency, live-confirmed, not new but re-confirmed here**: the dashboard's own "Configuration" Quick Action button links to `/configuration`, which immediately 403s for this exact persona (`ADMIN` holds `platform.configuration.create`/`.update` but no `.read` grant at all — the same gap the Branch Configuration workflow already disclosed).

**Dashboard ↔ completed-workflow consistency (Phase 11), live-tested with real mutations, not just traced**: Group membership change → Volunteers KPI and Ministry roster both updated ✓. Gathering created → Ministry Leader's Upcoming Gatherings updated ✓. Attendance recorded → Resident Pastor's Attendance KPI and growth series updated ✓. Follow-up created → Branch Pastor's Follow-ups card updated ✓. Giving/Configuration/Church-Pulse-weight consistency was already live-verified in the Branch Configuration milestone this session and not re-run here (unnecessary repetition of an already-proven mechanism).

- **UI**: VERIFIED for all six routing branches; one new regression test added (`DashboardPage.spec.tsx`) pinning the confirmed Ministries-card defect.
- **API**: VERIFIED — every endpoint every dashboard calls was live-exercised per persona, positive and negative.
- **RBAC**: VERIFIED live for all six roles, including the two zero-grant/structural-gap cases (`COUNCIL_OVERSEER`, `ASSISTANT_PASTOR`'s Ministries card).
- **RLS/tenant isolation**: **VERIFIED live** — a real second-Branch fixture's Resident Pastor saw only their own 1 member/0 volunteers/0 attendance, never Branch A's 8 members or the volunteer/attendance mutations just created there.
- **Tests**: 1 new regression test (`DashboardPage.spec.tsx`, the confirmed Ministries-card defect) — full suite **625/625 api**, **320/320 web-admin** (was 319), both clean; `pnpm typecheck`/`pnpm lint` clean.
- **Live Postgres verification**: **VERIFIED live this session**, extensively — see the persona-by-persona findings above for the full sequence (fixtures created, positive/negative access proven, before/after deltas proven, cross-Branch isolation proven, all fixtures fully cleaned up, confirmed via a direct row-count check back to exact baseline).
- **Confirmed defects (not fixed, per this milestone's own instruction)**: (1) Ministries card structurally broken for every `ASSISTANT_PASTOR` — contradicts its own doc comment. (2) The seeded `dev-assistant-pastor` persona has no cluster assigned, so the standard dev-auth roster never exercises this dashboard's real happy path without a manual fixture.
- **Product decisions required (not this milestone's call)**: (1) Should undisclosed demo sections (Recent Activity's blended real/fake rows, Upcoming Events, Prayer Requests, Financial Alerts, Monthly Trends, Ministry Attendance, Recent Ministry Activity) get an on-screen "preview"/"demo" label matching the Branch Comparison/Multi-Branch Overview precedent, or be removed, or be left as-is? (2) Should `ASSISTANT_PASTOR`'s Ministries card be removed, or should `people.group.read` gain a CLUSTER-reachable resource shape? (3) Should `BASONTA_LEADER` gain any Church Pulse/engagement visibility for their own Basonta? (4) The pre-existing `COUNCIL_OVERSEER`/Configuration nav mismatch, unchanged.
- **Priority**: **kept OPEN** — genuinely verified for five of six roles with only disclosed, non-blocking limitations, but the confirmed live Ministries-card defect for `ASSISTANT_PASTOR` and the seed-data gap mean this cannot honestly be marked DONE per this milestone's own explicit instruction ("do not mark DONE simply because every dashboard page renders"). Downgraded to **P2** — every dashboard renders correctly, every real data section is genuinely real and correctly scoped, and the one confirmed defect is a single card on one of six personas' dashboards, not a workflow-blocking break.

---

## 7. ADMINISTRATION

### Branch Configuration (Church Pulse weights, silent-drift thresholds, Poimen gate)
- **Persona**: **Traced against `permission-matrix.ts`, not assumed — this is not simply "Admin."** `ADMIN` holds `.create`/`.update` (BRANCH) but **no `.read` grant at all**; `RESIDENT_PASTOR` holds `.read` (BRANCH) but no write grant; `ASSISTANT_PASTOR` holds `.read` (CLUSTER) — structurally unreachable, the same class of gap already disclosed for Bank Deposit/Follow-up Task/Silent-Drift, since a Configuration resource has no `bacentaId` for CLUSTER to ever match. **A genuine, disclosed RBAC/product mismatch, not fixed here per this milestone's own instruction**: the pre-existing `ConfigurationPage.tsx`/`nav-items.ts` client gate (unchanged, both cite Design System v1.0 §3.1) admits `ADMIN`/`COUNCIL_OVERSEER` — but `COUNCIL_OVERSEER` holds **no RBAC row at all** for this action (confirmed live: every real call 403s), and `RESIDENT_PASTOR` (a real reader) is never even shown the nav item. Two separate, never-reconciled sources of truth (a UX taxonomy doc vs. the PRD §17.3 RBAC matrix), reported as found.
- **Configuration semantics**: `platform.configurations` is a per-Branch singleton (`branchId` unique). Of its five columns, **only three have a real, currently-active consumer** (traced, not assumed): `churchPulseWeights` (`toChurchPulseWeightsRecord`, consumed live by `PulseScoreService`'s compute-on-read path), `poimenGateEnabled` (`BranchConfigurationService` → `libs/rbac`'s `poimenGateIfEnabled` record-level check, gating a `BACENTA_LEADER` grant), `silentDriftConfig` (`SilentDriftSweepRepository.getThresholds`, the worker's nightly sweep). `gatheringTypes` (has a ready validator, `isConfiguredGatheringType`, that `GatheringService.create()` never calls) and `followupSlaDefaults` (no reader anywhere in `apps/api`/`apps/worker`, confirmed by repo-wide search) are genuinely stored-but-unused — **no Web Admin field was built for either**, per this milestone's own "don't build UI for a field with no consumer" instruction.
- **Impl status**: COMPLETE for the three fields with a real consumer, and **VERIFIED live this session** including two independent real downstream effects (not just a JSON row change). No controller existed before this milestone at all.
- **UI**: VERIFIED — `ConfigurationPage.tsx`'s stub replaced with a real Poimen-gate `Switch` (immediate-effect, matching that component's own documented semantics — PATCHes on toggle, no separate Save) and a batched "Church Pulse weights & Silent-Drift thresholds" edit form (Save/Cancel, matching every other milestone's reveal-panel convention). The pre-existing client-side `ALLOWED_ROLES` gate and `nav-items.ts` are unchanged (see the disclosed mismatch above) — no RBAC/nav semantics were added or weakened to make this UI work.
- **API**: VERIFIED — `GET/POST/PATCH /platform/configuration`, a new `ConfigurationModule` (the seventh bounded-context module, not folded into the infrastructure-only `PlatformModule`). `branchId` is derived server-side from `ActorContext` in every route (one shared guard, since a Configuration resource has no groupId/cluster dimension at all) — never a client-supplied field, confirmed by a guard unit test that deliberately smuggles a `branchId` in the request body and shows it is never read. Single-statement Prisma calls throughout, confirmed **not** affected by the nested-`$transaction`-escapes-branch-scope bug class found elsewhere this session.
- **DB**: VERIFIED — real Postgres read/insert/update against the pre-existing `platform.configurations` table; no schema/migration change needed.
- **RBAC**: VERIFIED live — Admin PATCH succeeds; Admin's own GET correctly 403s (the disclosed gap above, live-confirmed, not assumed); Resident Pastor GET succeeds; Resident Pastor PATCH correctly 403s.
- **RLS/tenant isolation**: **VERIFIED live** — a real second Branch's actor (crafted via the same manual-dev-token technique used earlier this session, since no fixed dev persona exists outside the seeded Branch) resolves to their *own* Branch's Configuration, correctly 404ing (they have none), never Branch A's real, populated row — structural proof, not just an assertion, since this route accepts no id/branchId parameter anywhere for a client to manipulate in the first place.
- **Persistence**: **VERIFIED live** — baseline read → PATCH one real field → API response confirms it → a *different* persona's independent fresh GET confirms the same persisted value (the closest analog to a page reload available at the API level) → original baseline explicitly restored and re-verified via a final fresh read at the end.
- **Downstream consumer verification**: **VERIFIED live, both fields with a state-changing consumer** (not merely "the JSON row changed"): (1) **Poimen gate** — with `poimenGateEnabled: true`, a real `BACENTA_LEADER` grant attempt for a real candidate with no Poimen enrollment correctly 403s with the real `POIMEN_GATE_IF_ENABLED` denial reason; with the gate reverted to `false`, the identical grant then succeeds (201) — proving the saved value drives real authorization behavior in both directions, live, not just at the code-reading level. (2) **Church Pulse weights** — with a real `giving.activity_recorded` Engagement Signal present, the Branch dashboard's compute-on-read `pulseScore.score` was `1.67` under default (empty) weights and became exactly `10` once `churchPulseWeights` was set to weight `FINANCIAL_GIVING` alone — matching `computeChurchPulseScore`'s own math exactly, proving the saved configuration is genuinely read on every dashboard request, not cached or ignored. `silentDriftConfig`'s consumer (the worker's nightly sweep) was **not** re-triggered this pass — already fully exercised in the prior Silent-Drift Detection milestone this session, and re-running it would repeat that milestone's own disclosed real-AWS-EventBridge-call risk unnecessarily; its read logic (`getThresholds`) was traced and confirmed unchanged.
- **AWS side effects**: **none.** Identified before execution: this module's own read/write path never calls `EventBridgePublisherService` (confirmed by reading the full service) — the only AWS-adjacent consumer among the three fields (Silent-Drift's worker sweep) was deliberately not re-invoked this pass for the reason above.
- **Tests**: VERIFIED — 16 new backend tests (repository create/update/findByBranch incl. P2002→ConflictException, service getForBranch/create/update incl. NotFoundException paths and the gatheringTypes/followupSlaDefaults omission from the response DTO, controller delegation, guard branchId-from-actor-only) + 11 new Web Admin tests (loading state, rendered real data, read-403-still-offers-Edit, Poimen switch immediate PATCH + refetch, Poimen switch denial message, edit form pre-fill + partial-field PATCH body assertion + refetched values, POST-not-PATCH when no Configuration exists yet, server error inline, cancel, blocked non-Admin/Council role, Council Overseer's real 403 surfaced) + 4 new hook tests — full suite 598/598 api (was 577 at session start), 306/306 web-admin (was 282) passing.
- **Live Postgres verification**: **VERIFIED live this session** against real Postgres via `nx serve api` + dev-auth (plus one manually-crafted dev token for a genuine second Branch) — baseline read → Admin's own GET 403 (disclosed gap) → PATCH `poimenGateEnabled: true` → 200 → independent fresh read confirms it → real downstream Poimen-gate denial → reverted to `false` → real downstream grant now succeeds → PATCH `churchPulseWeights` → real Branch-dashboard score shift `1.67 → 10` confirmed → baseline fully restored and re-verified → Resident Pastor PATCH 403 (unauthorized update) → real second-Branch actor's GET resolves to their own (nonexistent, 404) Configuration, never Branch A's → all fixtures cleaned up (verified via direct count, zero rows remain, no append-only-trigger blockers - `insights.engagement_signals` has no DB-level immutability trigger, confirmed by reading the migration, unlike `financial_transaction_events`).
- **Newly discovered gaps**: the RBAC/nav-vs-permission-matrix mismatch above (Council Overseer admitted client-side with no real grant; Resident Pastor never shown the nav item despite a real read grant; Admin - the only writer - has no read grant). Reported, not silently changed, per this milestone's own explicit instruction.
- **Priority**: DONE (was P1)

### Role Assignment Grant (Admin capability)
- See People §1 — API-only, no revoke. Cross-listed here since it's fundamentally an Administration capability.
- **Priority**: P1

### Council / Branch Management
- **Persona**: would be Council Administrator / platform operator
- **Impl status**: **MISSING entirely** — no controller, no UI, for either Councils or Branches. Only reachable via direct DB/seed script today
- **Priority**: P2 (workaround: seed scripts; acceptable for a single-Branch Release 1 deployment, per PRD's own single-reference-church framing)

### Audit Log
- **Persona**: **Traced against `permission-matrix.ts` and live-confirmed, not assumed.** RESIDENT_PASTOR (BRANCH) and ADMIN (BRANCH, full) both genuinely read this endpoint. TREASURER (BRANCH, server-filtered to `stewardship.*` actions only, per PRD §17.3's "Stewardship entries only") also reads it, live-confirmed to see exactly one row out of many when only one `stewardship.*` denial existed. **ASSISTANT_PASTOR (CLUSTER) and BACENTA_LEADER (OWN_GROUP) hold a real PRD-granted `.read` row each but are structurally unreachable** — `platform.audit_log` has no `bacentaId`/group column at all, so a Branch-wide resource context (the only shape this list endpoint can produce) can never satisfy either scope check. Live-confirmed for ASSISTANT_PASTOR (real 403: "Resource is outside the actor's CLUSTER scope"); BACENTA_LEADER has no fixed dev-roster persona to log in as, so this is traced via the identical `evaluateRoleAndScope`/`resourceInScope` code path, not independently live-executed for that specific role.
- **Scope of "Audit Log" for Release 1 (Phase 2 finding, not invented)**: FR-ADM-02 ("immutable audit log of state-transition events... single view, attributed+timestamped") is Release 1. **NFR-AUD-02 (append-only + cryptographic hash-chaining tamper-evidence) is explicitly Horizon 2, not Release 1** — the single most important scoping finding this milestone made. Blueprint §9.6 additionally names RBAC-denial logging ("every DENY... logged with actor/action/resource/rule") as a real, citable requirement that was previously completely unimplemented.
- **Write path — what was built**: the existing architecture already had a substantial write path (Engagement Signal → EventBridge → SQS → `apps/worker`'s `AuditConsumer` → `platform.audit_log`, covering ~6 real mutation-triggered event types) plus `AuthGuard`'s pre-existing auth-failure logging. The one genuine gap Blueprint §9.6 names — RBAC-denial logging — is now closed via the **existing, already-named integration point**: `AllExceptionsFilter` (its own pre-existing doc comment already called out "an `RbacGuard` denial" as a case it handles). No new interceptor, no second competing event architecture, no EventBridge call added. `libs/rbac` gained one small, additive export (`ECCLESIA_RBAC_ACTION_KEY`, stashed by `RbacGuard` alongside its existing decision) so the filter can name the attempted action even when no matrix row exists at all for a (role, action) pair — `AuthorizationDecision.matchedRule` is `undefined` in exactly that (most common) case.
- **Write path — what was NOT built, disclosed not invented**: ordinary successful business mutations (Financial Transaction verify/flag/escalate/reconcile, Expense lifecycle, Group CRUD, Gathering CRUD, Bank Deposit Confirmation, Branch Configuration writes, Role Assignment revoke, Follow-up Task escalate, etc.) are **not** logged by any mechanism this milestone touched — no Engagement Signal is published for most of them, and this milestone's own explicit instruction was "do not blindly add a global interceptor that records every request." This is the same class of gap the task asked to be surfaced, not silently patched. **A second, narrower gap, live-confirmed not just traced**: a handful of routes (`RoleAssignmentService.grant()` is the one example) call `evaluate()` imperatively instead of the declarative `@RequirePermission`+`RbacGuard` pipeline and throw their own `ForbiddenException` directly, never populating `ECCLESIA_RBAC_DECISION_KEY` — `AllExceptionsFilter`'s new write path cannot and does not capture these. Live-verified: a real USHER 403 attempting `POST /people/:id/role-assignments` produced zero new `platform.audit_log` rows, while the identical denial shape through the declarative pipeline (e.g. a Stewardship route) did.
- **Read path — what was built**: `GET /platform/audit-log` (new `AuditLogModule`, the eighth bounded-context module, kept separate from the infrastructure-only `PlatformModule` for the same reason `ConfigurationModule` is). No query parameters at all — `branchId` is always the actor's own Branch, server-resolved, never client-supplied (live-verified: an injected `?branchId=...` query param is silently ignored). Includes NULL-branch rows (`WHERE branch_id = actor.branchId OR branch_id IS NULL`) so the pre-existing auth-failure records stay visible, matching the RLS carve-out's own stated intent. No pagination (none was specified, and none was invented) — reverse-chronological, unbounded, matching every other list endpoint's own precedent in this codebase.
- **A real bug found and fixed during live verification** (not merely "tests passed"): the new RBAC-denial write initially threw and silently no-opped (best-effort swallow) for every real denial, because it looked up the denied actor's `platform.users` row via `AuditLogService.findUserIdByPersonId` **outside** `PrismaService.runInBranchScope` — `platform.users`' own RLS policy requires `app.current_branch_id` to already be a valid UUID, and outside any scope it defaults to `''`, which fails the policy's `::uuid` cast. Fixed by moving that lookup inside the same `runInBranchScope` call that wraps the actual `record()` write. Caught and fixed live, before this workflow was marked DONE — exactly the kind of defect this program's "verify live, don't trust that code exists" discipline exists to catch.
- **UI**: VERIFIED — new `AuditLogPage.tsx` (`/audit-log` route, wired in `app.tsx`), a single reverse-chronological `Table` (When/Action/Effect badge/Resource/Actor/Reason columns) with loading/empty/error states via the existing `Table`/`ErrorState` primitives. **No pre-emptive client-side role gate** — the page always calls the real endpoint and lets the backend's actual RBAC decision (200, empty list, or 403 rendered as a retryable `ErrorState`) drive what's shown, per this milestone's explicit "do not add client-side authorization gates that duplicate backend RBAC" instruction. **No nav entry was added** — Design System v1.0 §3.1's stated nav taxonomy does not name "Audit Log" as a top-level item at all, and inventing a placement for it would itself be an undocumented product decision; the route is directly reachable, only its sidebar entry is an open question, disclosed rather than guessed.
- **DB**: no migration needed — reuses the pre-existing `platform.audit_log` table and its RLS policy (including the `20260810000000_audit_log_null_branch_carve_out` fix, regression-tested below, not touched).
- **RBAC**: VERIFIED live for all three reachable roles (RESIDENT_PASTOR, TREASURER with the Stewardship-only filter, ADMIN full view) plus the structurally-unreachable ASSISTANT_PASTOR case above.
- **RLS/tenant isolation**: **VERIFIED live** — a real second Branch's actor (manually-crafted dev token, the same technique used for prior milestones' second-Branch tests, since no fixed dev persona exists outside the seeded Branch) sees only their own Branch's rows plus NULL-branch rows, never the first Branch's `platform.audit_log.read`/`stewardship.transaction.record` denials; symmetrically, the first Branch's Resident Pastor never sees the second Branch's denial either. Branch-id-manipulation resistance separately confirmed (query-string `branchId` silently ignored, per the UI/API note above).
- **Append-only integrity (Phase 9)**: **not enforced at the database level** — `ecclesia_app`'s blanket `GRANT SELECT, INSERT, UPDATE, DELETE` (the RLS-enforcement migration) covers `audit_log` like every other `platform` table; the one real append-only precedent in this codebase (`financial_transaction_events_no_update`/`_no_delete` triggers) does not extend here. **This is correct for Release 1, not a gap** — NFR-AUD-02 (the append-only/tamper-evidence requirement) is explicitly Horizon 2. Reported per this milestone's own instruction rather than silently building unrequested trigger-based enforcement.
- **Mutation resistance**: VERIFIED live — `PATCH`/`DELETE` against `/platform/audit-log` (with and without an id) all 404 at the Express routing layer; no mutation route exists on this controller at all.
- **Regression test (Phase 8, RED finding #3)**: **VERIFIED, not regressed.** Unauthenticated request → 401 (not 500); malformed-signature token → 401; both new `auth.token.verify` DENY rows remain readable via the very endpoint under test, still NULL-branch, still visible to every Branch's reader — the exact behavior the `20260810000000` migration exists to guarantee.
- **Tests**: 20 new/changed backend tests — 2 new `libs/rbac` tests (`RbacGuard` stashing the attempted action regardless of outcome, including when `matchedRule` is undefined), 5 new `AllExceptionsFilter` tests (writes a DENY row when a decision/action/context are present; no-ops with no decision; no-ops for an imperative denial lacking `ECCLESIA_RBAC_DECISION_KEY`; no-ops on ALLOW; swallows a write failure via `logger.warn`) plus the 4 pre-existing tests updated for the new 3-argument constructor, 2 new `AuditLogService.findUserIdByPersonId` tests, and 4 new read-path tests (repository query shape incl. the action-prefix filter, service role-based filtering, controller delegation, guard resolves the actor's own Branch only) — full suite **625/625 api** (was 616 before this workflow), **319/319 web-admin** (was 313 before this workflow, +6 new `AuditLogPage` tests), both passing; `pnpm typecheck`/`pnpm lint` clean across all 19 projects.
- **Live Postgres verification**: **VERIFIED live this session** against real Postgres via `nx serve api` + dev-auth (`apps/worker`'s `AuditConsumer` deliberately **not** started — see AWS side effects below) — RESIDENT_PASTOR GET 200 with real, pre-existing NULL-branch auth-failure rows in correct reverse-chronological order → unauthenticated GET 401 → malformed-token GET 401 (regression, not 500) → ASSISTANT_PASTOR's real CLUSTER-scope 403 → **the RLS scoping bug above found and fixed** → the same denial re-triggered and confirmed written (`actorUserId`/`branchId`/`reason` all correctly attributed) → TREASURER's `stewardship.%` filter confirmed both inclusive (one real row) and exclusive (auth/audit-log-read rows correctly hidden) → ADMIN's full unfiltered view (all 3 action types, 18 rows) → query-string `branchId` manipulation ignored → a real second Branch fixture (Branch/Person/User/RoleAssignment, raw SQL as the `ecclesia` superuser) used to confirm two-way cross-Branch isolation → PATCH/DELETE 404 (no mutation route exists) → the imperative-authorization gap live-confirmed (a real USHER role-assignment-grant 403 produced zero audit rows) → all fixture identity rows cleanly removed (`RoleAssignment` → `User` → `Person` → `Branch`, correct FK order); the resulting audit_log row was **not** force-deleted — `onDelete: SetNull` on `branch`/`actorUser` anonymized it in place (now indistinguishable from a legitimate NULL-branch record), consistent with never bypassing the append-only-in-spirit design merely to leave the table looking pristine.
- **AWS side effects**: **none triggered.** Identified before execution: this milestone's write path (`AllExceptionsFilter` → `AuditLogService`) never calls `EventBridgePublisherService` — confirmed by reading the full call chain. The pre-existing Engagement-Signal-derived write path (→ EventBridge → SQS → `apps/worker`) was traced and confirmed unchanged, but **deliberately not live-exercised** this pass — starting `apps/worker`'s real SQS consumer loop would be a materially larger real-AWS footprint than anything this milestone's own code touches, and was judged unnecessary to verify a write path this milestone did not modify.
- **Newly discovered gaps, all disclosed rather than silently patched**: (1) CLUSTER/OWN_GROUP audit-log read access is structurally unreachable — a schema (`groupId` column) or policy (grant BRANCH-wide access instead) decision, not this milestone's call. (2) Imperative-authorization denials (the `RoleAssignmentService.grant()` class) are not captured by the new write path — a per-service change, not a generic filter's job. (3) Most real business mutations still have no audit trail at all unless they happen to already publish an Engagement Signal — closing this fully would mean auditing every domain's write path individually, explicitly out of this milestone's scope per its own "do not blindly add a global interceptor" instruction.
- **Priority**: DONE (was P1)

### Authentication
- **Persona**: everyone
- **Impl status**: Development Authentication (dev-auth bypass) is COMPLETE and is the only mode ever actually exercised. Production Cognito path is fully coded but **never verified end-to-end** — no real Cognito User Pool has ever been provisioned with real values
- **UI**: VERIFIED (dev-auth picker)
- **API**: VERIFIED for dev-auth; UNVERIFIED for real Cognito
- **RBAC**: VERIFIED (both paths feed the identical `ActorContextResolverService`)
- **Tests**: VERIFIED (dev-auth); Cognito path tested only against mocks
- **Live verification**: VERIFIED repeatedly this session via dev-auth (this is exactly the sanctioned local-verification path)
- **Blocker/gap**: real Cognito is aspirational until deployed — acceptable for local Release-1 completion work, a hard blocker before any real production user logs in
- **Priority**: P2 for this program (dev-auth is sufficient for proving workflows locally); P0 before production launch

---

## 8. CROSS-DOMAIN WORKFLOWS

### RLS / Tenant Isolation (the RBAC → RLS request pipeline itself)
- **Impl status**: COMPLETE and **VERIFIED live, repeatedly, this session** — real non-owner `ecclesia_app` Postgres role, `SET LOCAL app.current_branch_id` via `BranchScopeInterceptor`, confirmed blocking cross-branch reads for Insights (Volunteers/Bacenta Leaderboard/Engagement Trend) and Gatherings (cross-cluster, cross-Bacenta, cross-Branch) with real seeded second-Branch data
- **Known critical bug, now fixed**: until earlier today (commit `56cd0765`), **every RBAC-guarded request 500'd** — NestJS runs Guards before Interceptors, so every resource-context guard queried RLS-protected tables before `app.current_branch_id` was ever set. Fixed by wrapping guard-phase queries in their own scoped transaction. Verified live in that commit's own message: `GET /people`, `/insights/branch-dashboard`, `/gatherings`, `/groups` all 500'd before, all return correctly now.
- **Priority**: P0 — **resolved**, but the fact that this shipped and went undetected until a dedicated audit pass is the single strongest argument in this whole matrix for "verify live, don't trust that code exists."

### Nested `$transaction()` calls silently escape RLS scope
- **Impl status**: **RESOLVED.** A second, distinct RLS-breaking bug class, found in one call site (Group Membership Assignment) and now confirmed + fixed in all three known call sites across two full audit sessions.
- **Mechanism**: `PrismaService.runInBranchScope` (opened once per request by `BranchScopeInterceptor`) deliberately never proxies Prisma's `$transaction` method — only model delegates (`.person`, `.groupMembership`, etc.) resolve to the ambient branch-scoped connection. Any repository method that opens its **own** `this.prisma.$transaction(async (tx) => ...)` therefore starts a second, independent Postgres transaction that never ran `SET LOCAL app.current_branch_id` — every statement inside it hits every RLS policy and fails with `unrecognized configuration parameter "app.current_branch_id"`, a real 500.
- **All three confirmed live and fixed**, same fix pattern each time (remove the nested `$transaction`; the statements already share `BranchScopeInterceptor`'s one request-wide transaction, so atomicity is unaffected):
  1. `GroupMembershipRepository.applyChange` (People — Group Membership Assignment). Fixed in the prior session.
  2. `FinancialTransactionRepository.createWithEvent`/`appendEvent` (Stewardship — Record/Verify/Flag/Escalate/Reconcile Transaction, **and Expense Request/Approve/Reject/Pay/Receipt**, which a prior pass of this document incorrectly claimed were unaffected — corrected this session after tracing `ExpenseService`'s actual calls). Fixed and live-verified this session with a full 5-state transaction walkthrough and a full 3-state Expense walkthrough.
  3. `RoleAssignmentRepository.createWithSuccession` (People — the Bacenta Leader succession-grant path only; the plain `create()` path was a false-positive candidate, traced and confirmed never affected). Fixed and live-verified this session.
- **Audit methodology note**: every fix in this class was found by tracing the actual repository code and reproducing the failure live against real Postgres before touching anything — not by pattern-matching alone. The one Expense correction above is the concrete proof that "grep for `$transaction`" alone is insufficient; call graphs matter (`ExpenseService` calls into `FinancialTransactionRepository`, a different module's repository).
- **Priority**: P3 — resolved. No further known call sites; `grep -rn '\$transaction' apps/api/src` was re-run this session and now only matches `PrismaService.runInBranchScope` itself (the sanctioned, correctly-scoped call) plus doc comments in the three fixed repositories explaining the historical bug — confirmed by a second, code-only grep that no actual `this.prisma.$transaction(...)` call remains anywhere else in `apps/api`.

### Engagement Signal → Church Pulse Pipeline
- **Impl status**: COMPLETE per `ECCLESIA_ROADMAP.md` (EventBridge publish from all 6 domain write paths → SQS → `insights-consumer` → `church-pulse-recompute`) — not independently re-verified this session
- **Priority**: P2 (UNVERIFIED by this session directly; trusted from roadmap + existing worker test suite)

### Visitor Intake → Follow-up Task Auto-Creation
- See Gatherings §2 — the one real, working cross-domain automation in the product.
- **Priority**: P3 (working)

### Dev-Auth → RBAC → RLS full request pipeline
- **Impl status**: COMPLETE, **VERIFIED live this session** multiple times end-to-end (login → token → guard → RBAC decision → RLS-scoped query → response), across Insights and Gatherings
- **Priority**: P3 (this is the program's proven verification methodology going forward)

### Multi-Role-Assignment Login Conflict
- Cross-listed from People §7 — affects any persona, not just People workflows.
- **Priority**: P2

---

## 9. PERSONA ACCEPTANCE (Web Admin)

For each Release-1 persona: can they log in and do their primary job on Web Admin, end to end?

| Persona | Login | Dashboard | Primary job(s) | Verdict |
|---|---|---|---|---|
| **Resident Pastor / Acting Resident Pastor** | VERIFIED | VERIFIED (real KPIs/leaderboard/trend, live-verified this session incl. real before/after deltas; Branch Comparison panel is demo but correctly on-screen-labeled "HORIZON 3 PREVIEW"; Recent Activity timeline silently blends real+fake rows with no on-screen label — disclosed, not fixed) | People directory ✓, Gatherings read ✓, Insights ✓, Bacenta/Basonta assignment ✓, **Role Assignment grant ✓ and revoke ✓ (revoke built and live-verified this session — the full grant→revoke lifecycle now works for the only role that can actually use it)**, **Group (Bacenta/Basonta) create/update ✓ (BRANCH-scoped, built and live-verified this session)**, **Branch-wide Silent-Drift view ✓ (built and live-verified this session, real drift-pattern data)**, **Branch Configuration read ✓ (built and live-verified this session — the only role that can actually read it, though cannot write it)**, **Audit Log read ✓ (full Branch view, built and live-verified this session)**. **Cannot create/update a Gathering, cannot create a Follow-up task (can only read/Complete/Escalate one) — both traced this session and confirmed by design (no `.create`/relevant `.update` grant exists for this role at all, oversight-only), not a UI gap.** | **PARTIAL** — the full Person onboarding chain (Visitor → Member → Role Assignment grant/revoke) now works end to end from Web Admin for this persona; several other core write workflows remain UI-missing |
| **Assistant Pastor (Branch Pastor)** | VERIFIED | **RED (confirmed defect, live this session)** — Church Pulse/Alerts/Follow-ups are real and correctly CLUSTER-scoped (positive+negative live-verified via a temporary Bacenta-pair fixture), but the **Ministries card structurally 403s for every Assistant Pastor** (`GET /groups?type=MINISTRY` cannot satisfy CLUSTER scope for a bare list query — a genuine defect, not fixed, now regression-tested), and the **seeded dev-auth persona has no cluster assigned at all**, so the standard roster shows a broken dashboard by default | Gatherings read ✓ (fixed this session), **Gathering create/update ✓ (CLUSTER-scoped, built this session)**, **Follow-up task create/update ✓ (CLUSTER-scoped, built and live-verified this session, incl. cross-cluster and cross-Branch denial)**, **Group update ✓ (CLUSTER-scoped, live-verified both the positive and out-of-cluster-denial case this session — no Group create grant at all, traced and confirmed by design)** — **Basonta directory 403s** (same root cause, unfixed). **Audit Log read: holds a real PRD-granted CLUSTER-scope row but is structurally unreachable (live-confirmed 403 this session — no `bacentaId`/group column exists on `platform.audit_log` for CLUSTER to ever match), same root-cause class as the Basonta directory break.** | **PARTIAL**, one known reproducible break |
| **Bacenta Leader (Shepherd)** | VERIFIED | N/A — mobile-only by design | Mobile: attendance, follow-ups, offering — all built | **VERIFIED on its intended surface** (mobile, out of this program's Web Admin focus) |
| **Basonta Leader (Ministry Leader)** | VERIFIED | VERIFIED (Roster/Overcommitted/Gatherings KPIs and Staffing Targets all real and correctly OWN_GROUP-scoped, live-verified this session incl. two real before/after deltas and a real cross-group negative test; no Church Pulse card at all — correct by design, this role holds zero Insights grants; Ministry Attendance trend and Recent Ministry Activity are demo, no on-screen label) | Gatherings read ✓ (fixed this session), **Gathering create/update ✓ (OWN_GROUP-scoped, built and live-verified this session, incl. cross-group denial)**, **Group update ✓ (OWN_GROUP-scoped, own Basonta only; no create grant, by design)**, roster ✓, staffing targets ✓ (untested) — **no Follow-up queue access at all** | **PARTIAL** |
| **Treasurer (Finance Officer)** | VERIFIED | VERIFIED (all four KPIs, Offering Summary, and Pending Expense Requests are real and correctly BRANCH-scoped, live-verified against raw transaction data this session; no Church Pulse card — correct by design, zero Insights grants, live-confirmed 403; Monthly Trends reuses the Resident Pastor dashboard's static demo series unscoped to real Treasurer data, and Financial Alerts is demo — neither on-screen labeled) | Full transaction lifecycle (Record/Verify/Flag/Escalate/Reconcile) ✓ **and** Expense lifecycle (Request/Approve/Pay) ✓, both live-verified end to end this session after a real RLS bug was found and fixed in the shared repository backing both, **and Bank Deposit Confirmation ✓ (built and live-verified this session, incl. cross-Branch denial and write-once/irreversible semantics)**, **and Audit Log read ✓ (Stewardship-entries-only view per PRD §17.3, built and live-verified this session — confirmed both inclusive and exclusive)** | **COMPLETE** — every core Treasurer job this document names now provably works against real Postgres |
| **Usher** | VERIFIED | N/A — mobile-only by design | Mobile: attendance capture, visitor intake — built | **VERIFIED on its intended surface** |
| **Admin** | VERIFIED | VERIFIED (Church Health, all three KPIs, read-only Alerts, and Recent Activity — the real-only component, not the demo-blended one — are all real and correctly BRANCH-scoped, live-verified this session; Multi-Branch Overview is demo but correctly on-screen-labeled Horizon 3 preview; the dashboard's own "Configuration" Quick Action leads to a real 403 for this exact persona — the already-disclosed Branch Configuration read-gap, re-confirmed here as a dashboard↔workflow inconsistency) | People create ✓, most domain reads ✓, **Gathering create/update ✓ (BRANCH-scoped, the only role that can create a Branch-wide Gathering, built and live-verified this session)**, **Group (Bacenta/Basonta) create/update ✓ (BRANCH-scoped, built and live-verified this session, incl. real cross-Branch RLS denial)**, **Branch Configuration create/update ✓ (built and live-verified this session, incl. two real downstream effects — but cannot read their own saved Configuration back, a real disclosed RBAC gap, not fixed)**, **Audit Log read ✓ (full unfiltered Branch view, built and live-verified this session)** — **cannot manage Councils/Branches. Cannot create a Follow-up task at all (read-only grant; traced and confirmed by design, not a UI gap).** | **WEAKEST persona overall** — the role with the most named responsibility has the least real functionality behind it, though this session closed real gaps in that story |
| **Council Overseer** | VERIFIED (role exists) | **VERIFIED, resolved this session**: correctly routed to the generic "coming soon" stub, never `CouncilAdministratorDashboard` (that component is genuinely `ADMIN`-only, confirmed by `DashboardPage.tsx`'s router). Live-confirmed this role holds **zero** ALLOW rows anywhere in `permission-matrix.ts` — every dashboard-relevant endpoint 403s (branch-dashboard, /people, /groups, /platform/configuration, /platform/audit-log, /financial-transactions). The stub routing is therefore correct and self-consistent, not a gap. | — | **CONFIRMED GAP / PRODUCT DECISION**: this role is real (Role enum, seeded persona) but has zero real capability anywhere in Web Admin (Horizon 3 by design, per `roles.ts`'s own doc comment) — not a bug, a scoping fact. The separate, pre-existing `ConfigurationPage.tsx`/`nav-items.ts` mismatch (admits this role into `/configuration`, where it 403s) remains unfixed. |
| **Worker / Member / Visitor** | VERIFIED | "coming soon" stub (correct — not this persona's primary surface) | N/A on Web Admin by design | **as designed** |

---

## Summary Counts

- **P0 (all 5 resolved)**: RLS guard-ordering 500 bug (prior session), Church Pulse silent-zero-score bug (prior session), and all three nested-`$transaction` RLS-escape defects — Group Membership Assignment (prior session), Stewardship's `financial-transaction.repository.ts` covering Record/Verify/Flag/Escalate/Reconcile Transaction **and** Expense Request/Approve/Reject/Pay/Receipt (this session), and People's `role-assignment.repository.ts` covering the Bacenta Leader succession-grant path (this session). Every one confirmed live against real Postgres before and after its fix, not assumed. **No open P0s remain in this matrix.**
- **P1 (critical, workflow currently unusable)**: **0 — no open P1s remain in this matrix.** Cross-Persona Dashboards, the last remaining P1, is now genuinely live-verified for all six personas (five fully working, one — `ASSISTANT_PASTOR`'s Ministries card — with a confirmed, disclosed, single-card defect) and downgraded to P2, per this milestone's own "do not mark DONE simply because every page renders" instruction — it is not marked DONE, but it is no longer a workflow-blocking P1 either. *(Role Assignment grant+revoke, Group Membership Assignment, Lifecycle Stage Transition, Gathering Create/Update, Follow-up Task manual creation, Group (Bacenta/Basonta) CRUD, Bank Deposit Confirmation, Silent-Drift Detection's Branch-wide view, Branch Configuration, and Audit Log are all closed — the full Person onboarding journey, the Gathering scheduling journey, the Follow-up task lifecycle, Group creation/management, the Treasurer's full core job (now including their own audit trail), Resident Pastor/Admin's Branch-wide pastoral oversight, Branch Configuration's two live-consumed settings, the complete Role Assignment lifecycle, RBAC-denial audit logging (Blueprint §9.6), and all six persona dashboards now all work end to end or have a specifically named, bounded limitation.)*
- **P2 (meaningful limitation, workaround exists)**: New Person duplicate queue, Multi-Role-Assignment login, Basonta Directory for Assistant Pastor, Role Assignment grant unreachable for Assistant Pastor (CLUSTER, structural, found this session), Follow-up escalation-target search scope, Silent-drift auto-creation, Pastoral Notes UI, Staffing Targets tests, Single-Bacenta cluster view, Council/Branch management, GatheringSeries UI, Engagement Signal pipeline (still unverified live), Audit Log's CLUSTER/OWN_GROUP structural gap for Assistant Pastor/Bacenta Leader (no `groupId` column on `platform.audit_log`), Audit Log's imperative-authorization-denial blind spot (`RoleAssignmentService.grant()` class), Audit Log's lack of coverage for most real business mutations absent a published Engagement Signal, **Cross-Persona Dashboards** (the Ministries card's structural CLUSTER-scope break for Assistant Pastor, the seeded dev persona's empty cluster, and the undisclosed real/demo blend on several persona dashboards' secondary sections — see that entry's own "Product decisions required" list).
- **P3**: everything working and either verified or low-stakes if not.
