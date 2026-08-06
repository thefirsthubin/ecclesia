# libs/domain/ministry

Framework-agnostic business logic for Ministry (PRD §13.3): Basonta
staffing-adequacy calculation, worker overcommitment detection.

## Contents

- **`staffing-adequacy.ts`** - FR-MIN-03's "rostered workers vs. staffing
  target" ratio. `computeStaffingAdequacy(targetCount, rosteredCount)` is
  a pure function of two counts the caller already has - "rostered" means
  an active Basonta `GroupMembership` (People's own data), not a
  per-Gathering roster-assignment entity, which does not exist in
  `db/schema.prisma`'s `ministry` schema. See the file's own doc comment.

- **`overcommitment.ts`** - FR-MIN-04's possible-overcommitment flag.
  `DEFAULT_OVERCOMMITMENT_THRESHOLD` (4, `[PRD-DERIVED]` from the "4+"
  acceptance-criterion example) and `evaluateOvercommitment()`. Modeled
  against a Person's count of *concurrent active Basonta memberships*, a
  disclosed proxy for the acceptance criterion's literal "concurrent
  Gathering commitments in one week" - true Gathering-level overlap
  needs a schema addition outside this milestone's scope. See the file's
  own doc comment and
  `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.

**Status:** real domain logic (Sprint: Ministry domain), building and
testing cleanly.
