# People Intake Workflow — Design Notes

Milestone: "completing the People Intake workflow" — the New Person
creation flow `PEOPLE_PAGE_DESIGN_NOTES.md` §9 had flagged as belonging in
its own sprint. Brief: Create Person, duplicate candidate detection, 409
duplicate resolution flow, merge experience, candidate review, loading /
empty / error states, success feedback. Explicit constraints: no database
schema change, no change to duplicate detection rules, no removal of
existing APIs. Same disclosure discipline as every prior milestone: every
choice below is a direct citation or an explicit `[Design Decision]`.

## 1. What already existed (backend)

Per the milestone brief, "the backend already exists." Confirmed by
reading it rather than assuming:

- `POST /people` (`PersonController.create`, RBAC action
  `people.person.create`) — `PersonService.create` runs FR-PPL-02
  duplicate detection (`findDuplicateCandidates`, `libs/domain/people`)
  unless `overrideDuplicateCheck` is `true`. A match throws
  `ConflictException({ message, candidates })` — Nest's `HttpException.createBody`
  returns an object argument as-is (no `statusCode` injected), so the wire
  body is exactly `{ message: string, candidates: DuplicateMatch[] }`,
  `DuplicateMatch` being `{ candidateId, matchedOn, reason }` — the same
  shape `duplicateCandidateResponseSchema` describes in
  `libs/contracts/src/lib/people.schemas.ts`.
- `GET /people/:id` (`PersonController.getById`) — used to resolve each
  candidate's full profile for review (a 409 only carries ids/reasons,
  not full records).
- Exactly one permission-matrix row grants `people.person.create`:
  `{ role: 'ADMIN', scope: 'BRANCH' }` (`libs/rbac/src/lib/permission-matrix.ts`).
  No other role can ever succeed at this call.

None of this needed to change — no schema change, no detection-rule
change, `PersonController`/`PersonService` untouched. Only `apps/web-admin`
changed.

## 2. `[Design Decision]` "Merge experience" is candidate review, not a database merge

The brief lists "Merge experience" as a deliverable. A repo-wide search
before writing any code confirmed **no merge endpoint exists anywhere in
this backend** — no `PATCH`/`POST` on `PersonController` or any other
controller that combines two Person records, no `mergePerson`-shaped
method on `PersonService` or `PersonRepository`. Building one would mean
deciding how to reconcile two Persons' Group memberships, Role
Assignments, Financial Transactions, Follow-up Tasks, and more — a real
design problem this milestone's own "Do NOT change database schema" /
"Do NOT remove existing APIs" constraints don't obviously permit solving
safely in one pass, and the brief gave no spec for the reconciliation
rules.

What was built instead: on a 409, `NewPersonForm` presents each duplicate
candidate (`DuplicateMatch.matchedOn`/`reason`) with its full profile
(`GET /people/:id`) and two resolutions:

- **View this person** — navigates to the existing record's profile page
  and abandons the draft. The existing Person is treated as canonical;
  no new record is created. This *is* the merge outcome in the case that
  matters most (the two records really are the same person) — the
  "surviving" record is simply the one that already existed, with no data
  migration needed because nothing new was ever written.
- **Create anyway** — resubmits `POST /people` with
  `overrideDuplicateCheck: true` (FR-PPL-02's own resubmission contract,
  already built into `createPersonSchema` before this milestone), for the
  case where the match is a false positive.

If a literal record-merge (reassigning a duplicate's history onto a
canonical record and deleting it) is needed later, that's a new backend
capability, not a frontend gap — flagged here rather than silently
narrowed.

## 3. Frontend changes

**`apps/web-admin/src/app/lib/api-client.ts`** — `ApiError` gained an
optional `body: unknown` field, populated by a new `readErrorBody()`
helper (best-effort `response.json()`, swallowing parse failures) in
`apiGet`/`apiPatch`/`apiPost`. Nothing before this milestone ever needed
to read a structured error body — every prior 4xx/5xx just showed
`error.message` (`"Request to ... failed with status ..."`). `body` is
`unknown` deliberately: `ApiError` is generic across every endpoint in
this app, so narrowing it (e.g. to `{ candidates: DuplicateCandidateResponseDto[] }`)
is each call site's own job — `NewPersonForm.extractDuplicateCandidates`
does exactly that for `POST /people`, defensively (missing/malformed
`candidates` → `[]`, not a thrown error).

**`apps/web-admin/src/app/pages/People/usePeopleData.ts`** — three
additions, all following this file's existing conventions:
- `createPerson(accessToken, input)` — imperative `apiPost`, mirrors
  `recordTransaction`/`requestExpense` (`useStewardshipData.ts`).
- `fetchPersonById(accessToken, personId)` — imperative `apiGet`, used to
  resolve each duplicate candidate's full profile in parallel (an
  a-priori-unknown-length, possibly-empty id set doesn't fit
  `useAsyncData`'s fixed-deps shape the way `usePersonDetail` does for a
  single, known id).
- `searchPeopleForGuardian(accessToken, query)` — `RecordPicker`'s
  `onSearch` for the form's optional Guardian field
  (`createPersonSchema.guardianPersonId`). A direct copy of Pastoral
  Care's `searchPeopleForEscalation` (same `GET /people?search=` endpoint,
  same `RecordOption` mapping, same disclosed "scoped to the acting
  user's own `people.person.read` grant" limitation) — kept as a
  per-page duplicate rather than extracted into a shared helper, this
  codebase's established "small per-page glue, not worth extracting"
  precedent (`parseAmountToMinorUnits`'s own doc comment gives the same
  reasoning).

**`apps/web-admin/src/app/pages/People/NewPersonForm.tsx`** (new) — the
form + the 409 candidate-review `Modal`, in one component (props:
`onCreated`, `onCancel`):
- Fields: firstName/lastName (required), phone/email/dateOfBirth/address
  (optional, all `createPersonSchema` fields except `overrideDuplicateCheck`,
  which the component manages itself), Guardian (optional `RecordPicker`).
  No client-side Zod validation — this codebase's established rule
  (`libs/contracts` schemas are TS-typing-only on the frontend, runtime
  validation is the backend's job); only a plain "both name fields are
  non-empty" check gates the submit button, the same shape Stewardship's
  amount/description checks use.
- Submit → `createPerson(..., { overrideDuplicateCheck: false })`. Success
  → `useToast().show({ status: 'success', ... })`, resets, calls
  `onCreated`. A 409 → parses `candidates` off `ApiError.body`, opens the
  review `Modal`, kicks off one `fetchPersonById` per candidate in
  parallel. Any other failure → inline `submitError` text, the same
  pattern every other form in this app uses (Stewardship's Record/Request
  forms, Pastoral Care's Flag/Reject reason drafts).
- Review `Modal`: per candidate, a `Skeleton` while its detail loads, an
  `ErrorState` with retry if the detail fetch fails, or the resolved
  name/contact + a "View this person" button once loaded. Footer:
  "Cancel" (closes the review, leaves the form open to edit) and "Create
  anyway" (`overrideDuplicateCheck: true`).
- **First real consumer of `Modal` and `Toast`** (`libs/ui/web`) — both
  were built in an earlier UI-primitives sprint but never used by any
  page. `Modal`'s own doc comment ("a focused sub-task or confirmation
  that must complete or cancel before returning to the parent screen")
  describes the candidate-review step exactly. `Toast` is mounted at the
  app root for the first time (`app.tsx`, nested inside `ThemeProvider`,
  outside `AuthProvider`) to satisfy the brief's explicit "Success
  feedback" deliverable — every earlier sprint's success case was silent
  (the form just closed and the list refetched); this is the first flow
  where a notification that outlives the triggering form's own lifetime
  (it closes immediately on success) is genuinely useful.

**`apps/web-admin/src/app/pages/People/PeopleListPage.tsx`** — a
"+ New Person" button, gated to `state.actor.role === 'ADMIN'`
(`CAN_CREATE_PERSON_ROLES`). `[Design Decision]` This *departs* from
Stewardship's "always show the button, let the backend's 403 decide"
precedent — deliberately, not an oversight. That precedent fit
Stewardship because several roles' eligibility for Record/Request actions
is genuinely data- or state-dependent. Here, exactly one permission-matrix
row exists for `people.person.create`, period — showing the button to any
other role would be guaranteed-failing UI noise, not a deferred
authorization decision. The same reasoning `ConfigurationPage` already
used for its own single-role-only surface (`ALLOWED_ROLES`).

## 4. Loading / empty / error states — where each one lives

The brief lists these as flat deliverables rather than tying them to a
specific surface, so here's where each actually shows up:

- **Loading**: the submit button's own `loading` state (`Button`'s
  built-in spinner) during create; a `Skeleton` per candidate row while
  its `GET /people/:id` is in flight.
- **Empty**: `RecordPicker`'s own built-in "No matches" message for the
  Guardian search (already built into that component, not new). The
  candidate-review list itself can't be empty by construction — a 409 is
  only thrown when `matches.length > 0` (`PersonService.create`), so a
  literal "0 candidates, modal open" state doesn't occur.
- **Error**: inline `submitError` text for any non-409 create failure
  (network error, 500, a 403 slipping through client-side gating); an
  `ErrorState` with retry per candidate if its detail fetch fails.
- **Success**: the `Toast` described in §3.

## 5. Tests

- `apps/web-admin/src/app/lib/api-client.spec.ts` (new — no test file
  existed for this module before) — `ApiError.body` capture on
  `apiGet`/`apiPatch`/`apiPost`, including the exact FR-PPL-02 409 shape.
- `usePeopleData.spec.ts` — `createPerson` (request shape, 409
  passthrough), `fetchPersonById`.
- `NewPersonForm.spec.tsx` (new) — submit-button gating, direct-create
  success + `onCreated`, 409 → review modal + candidate detail loading,
  "Create anyway" resubmission with `overrideDuplicateCheck: true`,
  "View this person" navigation + form cancellation, non-duplicate error
  display, candidate-detail-fetch error display.
- `PeopleListPage.spec.tsx` — button visibility for ADMIN vs. a role with
  no `people.person.create` grant, and that clicking it reveals the form.

## 6. Known sandbox limitation

Same as every prior milestone: no `pnpm`/`tsc`/`eslint`/`jest` execution
in this sandbox (confirmed again this milestone — `pnpm` itself isn't
installed, `tsc`/`eslint` time out even on small scopes because
type-aware linting builds the whole program regardless of file count,
Jest can't run at all here due to a persistent `@swc/core` binding
failure). This milestone's code has been statically reviewed only (brace
balance, cross-file import/usage checks, manual review against the exact
component APIs read from source) — needs a real
`pnpm lint && pnpm test && pnpm build` pass on the user's machine before
being considered done.
