# Attendance Capture — Design Notes

## 0. Scope: Mobile Application Shell + Attendance Capture, one sprint

The Shepherd Dashboard sprint (`../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`)
explicitly scoped out three things: real navigation, a real sign-in flow, and
every screen beyond the dashboard itself. Building Attendance Capture "for
real" — reachable from the dashboard's own "Take Attendance" quick action,
authenticated as a real Shepherd, writing real attendance records — requires
all three closed at once, not attendance capture bolted onto a single
hardcoded screen. This sprint closes them together, mirroring how
`apps/web-admin` got its own "Application Shell" sprint
(`apps/web-admin/src/app/APPLICATION_SHELL_DESIGN_NOTES.md`) before any
domain page was built on top of it:

1. **Navigation** — `../../navigation/Navigator.tsx`, a minimal
   dependency-free in-memory stack (`NavigationProvider`/`useNavigate`/
   `useGoBack`/`useCurrentScreen`). No `react-navigation` (or anything else)
   exists in this workspace's `package.json`, and this sandbox has no
   package-registry network access to add one — same constraint, same
   response, as `apps/web-admin`'s own hand-built router.
2. **Auth** — `../../auth/AuthContext.tsx` + `../Login/LoginScreen.tsx`,
   **Development-Auth-only**. Blueprint §8.3's Shepherd phone-number + OTP
   method has never been built anywhere in this codebase; this sprint does
   not build it either. What exists is the same `/auth/dev/*` routes
   `apps/web-admin` already uses in development, reused here with a picker
   screen instead of `apps/web-admin`'s own. Pointed at an API running in
   Cognito mode, this app shows an explanatory `EmptyState`, not a broken or
   fake form — see `AuthContext.tsx`'s top comment.
3. **Attendance Capture itself** — this screen.

## 1. Requirement

PRD FR-GTH-03 ("record attendance for a Gathering"), FR-GTH-05 (attendance
completeness), NFR-PERF-01 ("attendance capture completes in under 60 seconds
for up to 30 attendees"). Reached from `ShepherdDashboardScreen`'s
"Take Attendance" quick action (Design System §4.3's named critical action).

## 2. No new backend endpoints — a correction to this sprint's own early research

An early pass over the backend (this sprint's own research step) concluded a
new roster-listing endpoint would be needed, since `GET /ministry/groups/:id/roster`
exists but is gated to `BASONTA_LEADER`/`RESIDENT_PASTOR`/`ADMIN`, not
`BACENTA_LEADER`. That conclusion was wrong, caught by reading the People
module directly rather than trusting the first-pass summary: `GET /people?groupId=`
(People Web Admin sprint) already returns the full `PersonResponseDto[]` —
names included — for any group, and `BACENTA_LEADER` already holds
`people.person.read` at `OWN_GROUP` scope (`libs/rbac/src/lib/permission-matrix.ts`
line 31). Recorded here for traceability, matching this codebase's established
practice of correcting a prior step's documentation in place rather than
silently proceeding on it.

With that corrected, every endpoint this screen needs already existed,
unmodified, before this sprint:

| Purpose | Endpoint | RBAC (`BACENTA_LEADER`) |
| --- | --- | --- |
| Find today's Bacenta Meeting | `GET /gatherings?ownerGroupId=&from=&to=` | `gatherings.gathering.read`, OWN_GROUP |
| Roster with names | `GET /people?groupId=` | `people.person.read`, OWN_GROUP |
| Existing attendance (pre-populate) | `GET /gatherings/:id/attendance-records` | `gatherings.attendance.read`, OWN_GROUP |
| Record/correct attendance | `POST /gatherings/:id/attendance-records` | `gatherings.attendance.create`, OWN_GROUP |

No bulk-record endpoint was added either. `AttendanceRecordRepository.upsert()`
is keyed on Prisma's `@@unique([gatheringId, personId])` — recording again for
the same pair is a correction, not a duplicate — so N parallel single-record
`POST`s (`Promise.all`, one per row the Shepherd actually changed) are both
correct and simpler than inventing a bulk DTO/contract/RBAC action for what
the existing endpoint already supports.

## 3. "Today's meeting" — a scoping decision, not a PRD-specified rule

Nothing in the PRD names how a Shepherd picks *which* Gathering to record
attendance for from this screen. `[Design Decision]`: the screen queries
`GET /gatherings?ownerGroupId=<bacentaGroupId>` for the current local calendar
day (midnight to midnight) and uses the first result. If a Bacenta ever has
more than one Gathering scheduled the same day, this picks whichever the
`ownerGroupId`-scoped query returns first — a real, disclosed edge case this
sprint does not resolve (no Gathering-picker UI exists). If none is scheduled
today, the screen shows an `EmptyState` rather than guessing at a past/future
one.

## 4. Component tree

```
AttendanceCaptureScreen
├─ Button (Back, iconLeft="arrowLeft") — navigates back via useGoBack()
├─ [loading]  Skeleton × 6
├─ [error]    ErrorState (onRetry)
├─ [no-gathering] EmptyState
└─ [ready]
   ├─ Heading + gathering date/venue + "N of M recorded" summary
   ├─ RosterRow × N (screen-local)
   │  ├─ Avatar + Text (name)
   │  └─ AttendanceStatusToggle (screen-local)
   └─ Button (Save attendance) — disabled until a row changes
```

`RosterRow` and `AttendanceStatusToggle` are screen-local, not new
`@ecclesia/ui-native` base components — the Shepherd Dashboard sprint's
"no new base component" precedent (`@ecclesia/ui-native` is a fixed 12:
Text, Heading, Button, Card, Badge, Avatar, Input, Divider, Spinner,
Skeleton, EmptyState, ErrorState) holds here too. `AttendanceStatusToggle`
is a hand-built 3-option radio group (Design System v1.0 §7.5: radio =
single-select, small set) rather than the DS's `switch` control, because
its changes are staged locally and committed together by one Save action,
not written immediately per tap.

## 5. Save semantics (NFR-PERF-01)

Every tap on `AttendanceStatusToggle` updates local state only
(`useAttendanceCaptureData`'s `pendingStatuses`) — no network call per tap.
"Save attendance" fires one `POST` per **changed** row in parallel
(`Promise.all`), not per every row in the roster, so re-saving after a partial
failure only retries what didn't succeed. This is what keeps a 30-person
roster's capture time bounded by the Shepherd's own tapping speed rather than
by N sequential round-trips — the concrete mechanism behind NFR-PERF-01's
60-second target, though this sprint does not include a timed usability test
that verifies 60 seconds specifically.

Partial failure: if some of the N parallel `POST`s reject, `pendingStatuses`
is deliberately **not** cleared, so the rows that did fail stay staged and
"Save attendance" can simply be pressed again — see `useAttendanceCaptureData.ts`'s
`save()` for the exact handling.

## 6. Known limitations (disclosed, not silently missing)

- **No offline support.** Every read and write is a live network call; there
  is no queue/retry-when-reconnected behavior. The PRD's mobile
  "offline-first" ambition (referenced narratively, not specified) is out of
  scope for this sprint, same as it was for the Shepherd Dashboard.
- **No in-app deep-linking or Android hardware back-button interception** —
  `Navigator.tsx`'s own disclosed limitation, inherited here.
- **Auth state does not survive an app restart.** No `AsyncStorage`/
  `SecureStore` dependency exists in this workspace and none could be added
  (no package-registry network access in this sandbox) — every cold start
  returns to the login screen. See `AuthContext.tsx`'s top comment.
- **Only one Gathering per day is supported** by this screen's own
  Gathering-selection logic (§3 above) — no picker exists for a Bacenta with
  more than one Gathering scheduled the same day.
- ~~No Offering recording screen.~~ `[Stewardship gaps sprint]` Built —
  see `../OfferingRecording/OFFERING_RECORDING_DESIGN_NOTES.md`.
  `QuickActionsRow`'s "Record Offering" button now navigates there.

## 7. Validation

`npx tsc --noEmit` clean across `apps/mobile/tsconfig.app.json` and
`apps/mobile/tsconfig.spec.json` in-sandbox. `eslint` and `jest` could not be
run in this sandbox (`eslint` shells out to a `pnpm`-based config resolver
that isn't installed here; `jest`'s `@swc/core` native binding fails to load
here — both pre-existing, disclosed sandbox limitations from earlier
sprints). Needs the user's real machine for `pnpm lint`/`pnpm test`/
`pnpm build`, and a running `apps/api` + Postgres stack (with
`pnpm db:seed:dev` run, and a Person seeded into a Bacenta with at least one
Gathering scheduled today) to exercise this screen against real data.
