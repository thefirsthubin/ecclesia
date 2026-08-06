# Follow-up Queue screen (Mobile) — Design Notes

Sprint: `[Stewardship gaps sprint]` follow-on, immediately after Offering
Recording. Closes the third and last item in Design System §3.2's
Shepherd bottom-tab-bar spec (Dashboard · Attendance · Follow-ups ·
Offering · Profile) that had a real destination screen worth building —
"Profile" has no distinct data/actions of its own yet to justify one, and
there is still no real bottom tab bar in this app (see §9).

## 1. What this screen builds

PRD §16.2's Follow-up task queue, mobile-side — the same surface
`apps/web-admin`'s `FollowUpTaskQueuePage` already built, ported to this
persona's own screen rather than sending a Shepherd to Web Admin for it
(Design System §3.3 already places this persona primarily on mobile).
List (sorted by SLA urgency, server-side), **Complete**, and **Escalate**
— full parity with the web page, not a reduced subset, because by the
time this screen was built both actions' backend/RBAC/UI-component
prerequisites already existed (unlike the web page's own history, where
Escalate was deferred to a later pass for lack of a Person picker).

## 2. Reuses the Dashboard's own data hook — no duplicate fetch

`useOpenFollowUpTasks()` (`ShepherdDashboard/hooks/useShepherdDashboardData.ts`)
already fetches `GET /pastoral-care/groups/:groupId/follow-up-tasks?status=OPEN,ESCALATED`
for `PriorityCard`'s own capped preview. This screen imports and reuses
it unmodified rather than writing a second, near-identical hook — the
same "don't re-solve a solved problem" discipline `Drawer`/`Select`
followed for `Modal` in `libs/ui`. `PersonNameText` (also
`ShepherdDashboard`'s own component) is reused the same way for subject-
name resolution.

## 3. Backend — zero new endpoints, zero new RBAC rows

- `PATCH /follow-up-tasks/:id/complete` — already existed (Shepherd
  Dashboard sprint's own Priority card reads the same underlying data;
  the mutation itself is new to mobile, not new to the API).
- `PATCH /follow-up-tasks/:id/escalate` — already existed, built for
  `apps/web-admin`'s own Escalate action in the immediately-prior sprint.
- `BACENTA_LEADER` already holds `pastoral_care.followup_task.update` at
  `OWN_GROUP` scope for both actions (`permission-matrix.ts`) — the same
  grant the web page's Escalate action already relies on.

This app's **first `PATCH` support** — `apiPatch` added to
`app/lib/api-client.ts`, mirroring `apps/web-admin`'s own `apiPatch`
exactly (same header/error-handling shape as this file's existing
`apiGet`/`apiPost`).

## 4. Escalate reuses `@ecclesia/ui-native`'s `RecordPicker` — and its disclosed limitation

Same component `apps/web-admin`'s Escalate action uses (`libs/ui/{web,native}/src/lib/RecordPicker`),
same inline-reveal-then-explicit-submit interaction shape: pressing
**Escalate** reveals a `RecordPicker` for that row plus **Submit
escalation** (disabled until a target is chosen) and **Cancel** — not an
auto-submit-on-select.

`searchPeopleForEscalation` (`hooks/useFollowUpActions.ts`) reuses `GET
/people?search=`, the same endpoint `AttendanceCaptureScreen`'s roster
fetch and the web page's own search already use. **Carries forward the
same disclosed limitation the web version has**, unchanged: the search is
scoped by the *acting* Shepherd's own `people.person.read` grant
(`OWN_GROUP`) — they can only find an escalation target inside their own
Bacenta, not the Assistant Pastor above them an escalation is usually
meant for. See `apps/web-admin/.../PastoralCare/PASTORAL_CARE_PAGE_DESIGN_NOTES.md`
§4/§9 for the full reasoning; this screen does not attempt to re-solve it
independently.

## 5. Reached from `PriorityCard`, not `QuickActionsRow`

`QuickActionsRow` stays scoped to NFR-PERF-01's two named, time-boxed
critical actions (Take Attendance, Record Offering) — a Follow-up queue
is a list to *review*, not a single sub-60-second action, so adding it as
a third quick-action button would dilute that row's own framing rather
than genuinely belong there.

Instead, `PriorityCard` gained a new optional `onViewFollowUps` prop and
a **"View Follow-up queue"** button, wired by `ShepherdDashboardScreen` to
`navigate('follow-up-queue')`. This is the "see all" affordance Design
System §4.2 always specified for a capped Priority-zone list ("never more
than 5-7 items visible without a 'see all'") but that `PriorityCard` never
had a real destination to send it to until this screen existed. It only
covers Follow-up tasks, not Silent-drift flags — see §9.

## 6. Row layout mirrors the Web Admin queue, in RN idioms

Subject name (`PersonNameText`) + status `Badge` (`Escalated` / `Overdue`
/ `Open`, same precedence as the web page) + due date + Escalate/Complete
actions — a plain `View`+`Divider` list, not `Table` (a fixed-column
data-grid component doesn't fit a small, card-style mobile list the way
it fits Web Admin's wider layout).

## 7. What was actually built

**Route** (`Navigator.tsx`/`App.tsx`): `'follow-up-queue'` added to
`ScreenName`.

**Components** (`apps/mobile/src/app/screens/FollowUpQueue/`):
- `FollowUpQueueScreen.tsx` — the queue, Complete, and inline Escalate.
- `hooks/useFollowUpActions.ts` — `completeFollowUpTask`,
  `escalateFollowUpTask`, `searchPeopleForEscalation`.

**Modified**: `ShepherdDashboard/components/PriorityCard.tsx` (new
`onViewFollowUps` prop + button), `ShepherdDashboardScreen.tsx` (wires
it), `app/lib/api-client.ts` (`apiPatch`, this app's first).

**No new `libs/ui/native` primitives needed** — `Badge`, `Button`,
`Divider`, `EmptyState`, `ErrorState`, `Heading`, `RecordPicker`,
`Skeleton`, `Text` all already existed.

## 8. Deferred / explicitly out of scope

- Silent-drift flags have no full-screen destination — `PriorityCard`
  still only shows its capped preview for those; a dedicated screen (and
  a BRANCH-wide-vs-Group-scoped listing gap the web page's own design
  notes already flag) is a separate, not-yet-scoped piece of work.
- No manual Follow-up task creation on mobile — same read-plus-actions
  scope the web page itself still carries.
- No offline queueing — same disclosed limitation every mutation-capable
  mobile screen in this app carries (Attendance Capture, Offering
  Recording).

## 9. Still no real bottom tab bar

`libs/ui/native`'s `BottomNav` component exists (built in the
Navigation/Data/Layout UI-library tier) but is not wired into
`apps/mobile` — this app still navigates via the Dashboard's own quick
actions and cards (`QuickActionsRow`, `PriorityCard`'s new button), not a
persistent tab bar matching Design System §3.2's spec literally. With
Dashboard, Attendance, Offering, and now Follow-ups all real screens, the
remaining gap is genuinely just the tab bar chrome itself, not any
missing screen content — a reasonable, scoped follow-up whenever it's
prioritized.

## 10. Known sandbox limitation

Same as every prior mobile sprint: `jest` cannot execute in this
sandbox (`@swc/core` native binding failure). **Additionally, unlike
every prior mobile sprint, `tsc --noEmit` against `apps/mobile/tsconfig.app.json`
itself could not be completed in this sandbox either** — six consecutive
attempts each hit the sandbox's 45-second per-command ceiling with zero
output; `libs/ui/native`'s own `tsconfig.lib.json` checked clean in the
same session immediately afterward, so this isn't a general sandbox
outage, just this specific project's check taking longer than this
sandbox's budget allows today. Every type here was written to mirror an
already-verified-clean pattern (see §§2-4 above) and reviewed by hand,
but genuinely needs the user's own `npx tsc --noEmit`/`pnpm build`, in
addition to `pnpm lint && pnpm test`, before being trusted.
