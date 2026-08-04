# Stewardship page — design notes

Fourth domain page, following the exact sequence People → Pastoral Care →
Ministry → Gatherings → Stewardship already established. See each of those
pages' own `*_PAGE_DESIGN_NOTES.md` for the reused conventions (the
`useAsyncData<T>` hook, `apiGet`/`apiPatch`/`apiPost` wrappers, the
hand-built router, the `GroupNameText`/`PersonNameText` id→name resolver
pattern) — this document covers what's specific to Stewardship.

## 1. Scope

PRD §16.5 describes two Finance Team surfaces: a "Financial Transaction
verification queue" and an "Expense approval queue." Both map directly
onto the two list endpoints this sprint's backend gap-filling step
produced/extended (`GET /financial-transactions` already existed;
`GET /expenses` was added this sprint — see
`apps/api/src/modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md`'s
"Resolved" section). One page, two `Card` sections, mirroring how
`FollowUpTaskQueuePage` is a single queue and `GatheringsListPage` is a
single list — the two-section layout here is closer to a lighter version
of `DashboardPage`'s multi-card composition than to any single prior
domain page.

## 2. Who actually sees data back

Neither list endpoint's resource-context guard varies by role —
`FinancialTransactionListResourceContextGuard` and
`ExpenseListResourceContextGuard` both always resolve
`{ branchId: actor.branchId }` (see their own doc comments in
`apps/api/src/modules/stewardship/guards/`). Scope is therefore decided
entirely by `RbacGuard`'s permission-matrix check against that fixed
Branch-wide resource:

- `RESIDENT_PASTOR` (`stewardship.transaction.read`/`stewardship.expense.read`,
  both `BRANCH`) and `TREASURER` (both `BRANCH`) — see data back.
- `ASSISTANT_PASTOR` (`CLUSTER` on both actions), `BACENTA_LEADER`
  (`OWN_GROUP` on both), `BASONTA_LEADER` (`OWN_GROUP` on
  `stewardship.expense.read` only) — hold a `.read` grant, but no scope
  that dominates a Branch-wide resource (`evaluate.ts`'s
  `resourceInScope()`), so they 403. This is the same disclosed, not-this-
  sprint gap already on record in `STEWARDSHIP_DESIGN_NOTES.md`'s "what
  this milestone deliberately does not build" section (a Bacenta Leader's
  own queue view needs an `OWN_GROUP`-filterable list endpoint that
  doesn't exist yet).
- `ADMIN` — holds no Stewardship permission rows at all (see this
  sprint's `[Design Decision]` in `STEWARDSHIP_DESIGN_NOTES.md`, not
  fixed this sprint on purpose).

Consequence: unlike every prior domain page, there is no
`resolveDefaultXQuery(actor)` pure function here — there is no
groupId/CLUSTER parameter for one to derive from a role, only the
`state` filter, which is plain client-side UI state, not
role-derived. The page renders the same query for every role and lets
the backend's 403 (surfaced as `ErrorState`) decide visibility, the same
"don't pre-empt the backend" precedent Gatherings' ASSISTANT_PASTOR/
BASONTA_LEADER gap already established.

## 3. `apiPost` added to the API client

Every prior page's mutations were either `POST` to a collection endpoint
(`create`-shaped, not needed here) or `PATCH` with no body
(`completeFollowUpTask`). `FinancialTransactionController`/
`ExpenseController`'s transition endpoints (`verify`/`flag`/`escalate`/
`reconcile`/`approve`/`reject`/`pay`) are all `POST`, some with a body
(`flag`/`reject` take `{ reason }`), some without. `apiPost<T>` was added
to `apps/web-admin/src/app/lib/api-client.ts` as an exact mirror of the
existing `apiPatch<T>`, only the HTTP method differs.

## 4. Action set built vs. deferred

Built (all Branch-scoped queue actions with no picker dependency):
Verify, Flag (with mandatory reason), Escalate, Reconcile on Financial
Transactions; Approve, Reject (with mandatory reason), Pay on Expenses.
Every action button is gated on the row's own `currentState` matching the
one legal source state for that transition (`FinancialTransactionService`/
`ExpenseService`'s own `checkInboundTransactionTransition`/
`checkOutboundTransactionTransition` are the source of truth; the UI gate
is a convenience, not a security boundary — the backend still enforces
the state machine either way).

`[Design Decision]` Deferred, consistent with the "defer anything needing
a not-yet-built picker" precedent (Pastoral Care's Escalate, Ministry's
Staffing Target view, Gatherings' Group filter):

- **Attach receipt** (`POST /expenses/:id/receipt`). Restricted server-side
  to the original requester (`ExpenseService.attachReceipt`), not the
  approver/Treasurer audience this page is built for — and needs a file
  upload flow that doesn't exist anywhere in this codebase yet
  (`STEWARDSHIP_DESIGN_NOTES.md` already discloses no file-upload
  mechanism exists). Out of scope for this page entirely, not just this
  pass.
- **Project / Pledge surfaces** (FR-STW-08/H2). Not part of the list-
  endpoint gap this sprint's backend step closed, and
  `STEWARDSHIP_DESIGN_NOTES.md` already discloses Project progress
  aggregation as a deferred, low-risk follow-up. No `libs/contracts` list
  endpoint exists for either resource yet, so there is nothing this page
  could list even if it tried.

## 5. Reason field UX

No `Modal` component exists in `libs/ui/web` (confirmed via the same
inventory check every prior sprint has run — `Avatar`, `Badge`,
`Breadcrumbs`, `Button`, `Card`, `Divider`, `EmptyState`, `ErrorState`,
`Heading`, `Icon`, `Input`, `NotificationBell`, `Sidebar`, `Skeleton`,
`Spinner`, `Text`, `ThemeProvider`, `TopBar`, `UserMenu` — no new
primitive needed this sprint either). Flag/Reject reveal an inline
`Input` + Submit/Cancel `Button` pair directly under the row being acted
on (tracked by a single `reasonDraftKey` piece of page state, one draft
open at a time) rather than a dialog — the same "no Modal, build inline"
constraint every prior sprint operated under.

## 6. Currency formatting

`formatAmountMinor(amountMinor, currency)` in `useStewardshipData.ts`
divides by 100 and formats with `toLocaleString`. `[Design Decision]`
this assumes a 2-decimal ISO 4217 currency, true for GHS (the only value
`currencySchema`'s default and this deployment ever produce) but not a
general solution — a 0- or 3-decimal currency would need a currency-aware
divisor table. Not built since nothing in this codebase produces a
non-GHS `amountMinor` today.

## 7. Data fetching

`useTransactionQueue`/`useExpenseQueue` (both in `useStewardshipData.ts`)
follow the exact `useAsyncData<T>` pattern every prior page's list hook
uses. `PersonNameText` (recorder/requester) and `GroupNameText`
(`sourceGroupId`) are reused via direct cross-folder import from
`PastoralCare`/`People` respectively — the same reuse-not-duplicate
pattern already flagged in `MINISTRY_PAGE_DESIGN_NOTES.md` as a good
future refactor target (promote both to a shared location; not done this
sprint either, to avoid a drive-by refactor unrelated to this page's own
scope).

## 8. Record Transaction / Request Expense (`[Stewardship gaps sprint]`)

Both create-shaped endpoints §4 originally deferred, now built — and both
turned out to need less than the original framing assumed.

**Record Transaction never needed a Group picker.** The original plan was
a Bacenta/Basonta `RecordPicker` for `sourceGroupId`, matching Pastoral
Care's Escalate. Checking the actual endpoint this sprint found that
plan was wrong on two counts: `GET /groups` has no `search` query param
at all (`listGroupsQuerySchema` only accepts `type`), and
`GroupListResourceContextGuard` always resolves a Branch-wide resource
regardless of role — meaning `BACENTA_LEADER` can't call `GET /groups`
in the first place (only `RESIDENT_PASTOR`/`ADMIN` can, per that guard's
own doc comment). A picker was never buildable against today's backend.

More importantly, it was never *necessary*: `sourceGroupId` matters to
exactly one role. `RESIDENT_PASTOR`/`ASSISTANT_PASTOR` are denied
`stewardship.transaction.record` outright (BR-STW-01 — pastors don't
handle cash); `TREASURER`/`MEMBER` hold it at `SELF` scope, where
supplying `sourceGroupId` at all would be wrong (it would attribute the
gift to a Group, not the individual); only `BACENTA_LEADER` holds
`OWN_GROUP`, and `FinancialTransactionCreateResourceContextGuard`
resolves that scope from `sourceGroupId` itself — so a Bacenta Leader
must always send their own Bacenta's id, never anyone else's. They
already know it: `GET /auth/me`'s `bacentaId` field, the same fact
`apps/mobile`'s Offering Recording screen already uses via
`session.bacentaGroupId` rather than any picker. `StewardshipPage`
derives `sourceGroupId` from `state.actor.bacentaId` when
`state.actor.role === 'BACENTA_LEADER'`, and omits it entirely
otherwise — no search UI, no new backend work.

**Type options differ from mobile's on purpose.** Mobile's Offering
Recording screen offers only Offering/Tithe/Special Offering (its
Bacenta-Shepherd audience's actual job, PRD §9.2). This page is the
general Stewardship surface every eligible role uses — including a
Treasurer recording a personal Pledge payment or Donation — so all five
non-`EXPENSE` `FinancialTransactionTypeDto` values are offered
(`RECORD_TRANSACTION_TYPE_OPTIONS`).

**Request Expense confirmed it had no picker dependency at all**, as §4
already suspected: `requestExpenseSchema` is `amountMinor`/`currency`/
`description`/`category`, no Group or Person reference anywhere.
`category` is free text (no enum in the schema), so the form is a plain
`Input`, not a `Select`.

**Shared amount parsing, duplicated not extracted.** `parseAmountToMinorUnits`
in `useStewardshipData.ts` is a direct copy of `apps/mobile`'s own
function of the same name (`OfferingRecording/hooks/useOfferingRecordingData.ts`)
— the same "small per-app glue, not worth a shared lib" precedent already
applied to `apiPost`/`apiPatch` and `ROLE_LABELS` elsewhere in this
codebase.

**UI pattern**: both forms are an inline `+ Record`/`+ Request` reveal
above their respective queue's filter chips — a `Card` with the form,
Submit (disabled until valid)/Cancel — the same collapsible-inline
pattern Flag/Reject/Escalate already used on this page, since `libs/ui/web`
still has no `Modal`. Neither button is hidden for a role that will 403
on submit (`RESIDENT_PASTOR` on Record Transaction, `ADMIN` on either) —
consistent with this page's existing "don't pre-empt the backend"
precedent for queue visibility (§2).

## 9. Known sandbox limitation

Same as every prior sprint: no `pnpm`/`eslint`/`jest` execution in this
environment. `tsc --noEmit` against `tsconfig.app.json` (the tsconfig
that actually covers `StewardshipPage.tsx`/`useStewardshipData.ts`)
could not be completed here either — four consecutive attempts each hit
this sandbox's 45-second per-command ceiling with zero output, the same
disclosed pattern `FOLLOW_UP_QUEUE_DESIGN_NOTES.md` §10 recorded for
`apps/mobile`'s own tsconfig previously (not a general sandbox outage —
`tsconfig.spec.json` *did* complete, but hit an unrelated, pre-existing
`TS5095` module/moduleResolution config error in the base tsconfig this
sprint never touched, not a type error in any file this sprint changed).
Every new type here was written to mirror already-verified-clean
patterns — `RECORD_TRANSACTION_TYPE_OPTIONS`/`CHANNEL_OPTIONS` follow
`OFFERING_TYPE_OPTIONS`/`CHANNEL_OPTIONS`'s exact shape from `apps/mobile`'s
already-checked `useOfferingRecordingData.ts`, and `parseAmountToMinorUnits`
is a byte-identical copy of that same already-verified function — and
reviewed by hand, but genuinely needs the user's own `npx tsc --noEmit`/
`pnpm build`, in addition to `pnpm lint && pnpm test`, before being
trusted.
