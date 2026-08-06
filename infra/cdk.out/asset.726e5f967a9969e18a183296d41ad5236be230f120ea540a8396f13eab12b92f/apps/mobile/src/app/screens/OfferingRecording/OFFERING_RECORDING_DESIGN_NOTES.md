# Offering Recording screen (Mobile) — Design Notes

Sprint: `[Stewardship gaps sprint]` follow-on. Closes the second of the two
NFR-PERF-01-named Shepherd critical actions — `QuickActionsRow`'s "Record
Offering" quick action was a stub from the Shepherd Dashboard sprint
onward (see `ShepherdDashboardScreen.tsx`'s own doc comment history);
Attendance Capture (the first) was built in the Mobile Application Shell
sprint. This follows that screen's own conventions closely — read
`ATTENDANCE_CAPTURE_DESIGN_NOTES.md` first; this doc assumes and doesn't
re-explain its `Navigator`/`useSession`/`api-client` conventions.

## 1. What this screen builds

PRD §16.5's "Offering recording screen" — the Shepherd-persona entry
point into Stewardship's inbound Financial Transaction flow, scoped to
PRD §9.2's Release 1 list: "Offering/Tithe/Special Offering recording at
Bacenta level."

## 2. Backend — zero new endpoints needed

`POST /financial-transactions` (`recordFinancialTransactionSchema`,
`apps/api/src/modules/stewardship`) already existed, fully built, with
`BACENTA_LEADER` already holding `stewardship.transaction.record` at
`OWN_GROUP` scope (`permission-matrix.ts`) — the same "endpoint and RBAC
already exist, this is a frontend-only sprint" shape the People Web
Admin sprint's `RecordPicker`/Escalate follow-on already established for
the Pastoral Care queue. No RBAC gap, no schema gap.

## 3. `sourceGroupId` is not optional in practice for this screen

The schema marks `sourceGroupId` optional (an individual Mobile Money
gift with no Group has none), but `useOfferingRecordingData.ts` **always**
sends `session.bacentaGroupId` as `sourceGroupId`. This is a real
correctness requirement, not a style choice:
`FinancialTransactionCreateResourceContextGuard` resolves the resource as
`{ ownerId: actor.personId }` (a personal, `SELF`-scoped gift) whenever
`sourceGroupId` is absent — and `BACENTA_LEADER` holds no `SELF`-scoped
row on `stewardship.transaction.record` at all, only `OWN_GROUP`. Omitting
`sourceGroupId` from this screen's request would 403 every single
submission. Sending it is also the semantically correct choice regardless
— PRD §12.7 frames a Bacenta-collected offering's `source` as the Group,
not an individual — so there is no tension between "what the guard
requires" and "what the data should say."

**No Group picker needed** — unlike Stewardship's own Web Admin Record
Transaction form (still deferred, see `STEWARDSHIP_PAGE_DESIGN_NOTES.md`
§4), this persona only ever has one Bacenta to record for
(`session.bacentaGroupId`), so there is nothing to pick.

## 4. `giverPersonId` is never sent

Same reasoning `recordFinancialTransactionSchema`'s own doc comment
gives: the server resolves `giverPersonId` itself from the acting actor
(only relevant for the `SELF`-scoped path this screen never takes anyway,
since `sourceGroupId` is always present here). This screen has no field
for it.

## 5. `amountMinor` — string arithmetic, not a JS `number`

`useOfferingRecordingData.ts`'s `parseAmountToMinorUnits()` converts a
typed major-unit amount ("50.5") into the integer-minor-unit decimal
string the schema requires ("5050") via string manipulation only — the
exact same float-precision reasoning `stewardship.schemas.ts`'s own doc
comment gives for why `amountMinor` is a decimal string on the wire at
all. Covered by its own unit test suite
(`useOfferingRecordingData.spec.ts`), the same "test the pure function
directly" discipline `Pagination`'s `buildPageTokens` used in `libs/ui/web`.

`currency` is never sent — the schema already defaults it to `GHS`
server-side (`currencySchema.default('GHS')`), matching the reference
deployment; no currency selector exists in this screen, deliberately (a
multi-currency Bacenta is not a Release 1 concern).

## 6. Type/Channel selection: `RadioGroup`, not `Select`

Three Type options (Offering/Tithe/Special Offering) and two Channel
options (Cash/Mobile Money) — both small, fixed, always-visible sets, a
better mobile fit than opening a picker/modal for a two-or-three-item
choice (the same "known-small-set → radio, not a dropdown" judgment this
screen makes independently of, but consistently with, `libs/ui`'s own
`RadioGroup` vs. `Select` split).

## 7. Confirmation, not auto-navigate-away

Unlike Attendance Capture's one-shot batch save (which `goBack()`s
immediately on success), a successful submission here shows an inline
confirmation with two explicit actions: **Record another** (resets the
form, stays on this screen — a Shepherd may record a Bacenta Meeting's
cash offering and a separate Mobile Money tithe in the same sitting) and
**Done** (returns to the Dashboard). `[Design Decision]` — the PRD does
not specify this exact interaction; it follows directly from Offering
recording being a genuinely repeatable action within one visit to this
screen, which Attendance Capture's single-roster-per-visit shape is not.

## 8. What was actually built

**Route** (`Navigator.tsx`/`App.tsx`): `'offering-recording'` added to
`ScreenName`; `ShepherdDashboardScreen`'s `onRecordOffering` now calls
`navigate('offering-recording')` instead of being a no-op stub.

**Components** (`apps/mobile/src/app/screens/OfferingRecording/`):
- `OfferingRecordingScreen.tsx` — the form + confirmation states.
- `hooks/useOfferingRecordingData.ts` — `parseAmountToMinorUnits`,
  `OFFERING_TYPE_OPTIONS`, `CHANNEL_OPTIONS`, and the submit
  orchestration.

**No new `libs/ui/native` primitives needed** — `Button`, `EmptyState`,
`Heading`, `Input`, `RadioGroup`, `Text` all already existed.

## 9. Deferred / explicitly out of scope

- No offline queueing — same disclosed limitation Attendance Capture
  already carries (this app has no offline-first storage layer yet
  despite the PRD's mobile offline-first design intent).
- No local transaction history/receipt list on this screen — a Shepherd
  cannot see what they've already recorded today without going through
  Web Admin's own Stewardship verification queue (`BACENTA_LEADER` does
  hold `stewardship.transaction.read` at `OWN_GROUP` scope server-side,
  so this is a frontend gap, not an authorization one, if a future sprint
  wants to add it).
- Pledge/Donation recording is out of scope for this screen — Release 1's
  own PRD §9.2 list names only Offering/Tithe/Special Offering for
  Bacenta-level recording.

## 10. Known sandbox limitation

Same as every prior mobile sprint: `jest` cannot execute in this
sandbox (`@swc/core` native binding failure) — every spec here was
written to the same standard as this app's other executable specs, but
has only been statically type-checked (`tsc --noEmit`) here, not run.
Needs the user's own `pnpm lint && pnpm test`.
