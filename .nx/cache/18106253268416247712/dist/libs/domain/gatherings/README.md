# libs/domain/gatherings

Framework-agnostic business logic for Gatherings (PRD §13.4):

- `gathering-status.ts` - the `GatheringStatus` state machine
  (`[INFERRED]` forward-only, since no PRD text describes its
  transitions) and `isConfiguredGatheringType()` (FR-GTH-01: gathering
  types are Branch-configurable, not a fixed enum).
- `attendance-completeness.ts` - FR-GTH-05's "no attendance recorded past
  the configured window" check: `evaluateAttendanceCompleteness()`.

Depends only on `@ecclesia/contracts` (Blueprint eslint.config.mjs
depConstraints) - same rule as every other `libs/domain/*` library.

**What this library deliberately does not do.** No recurrence-expansion
function (turning a `GatheringSeries.recurrenceRule` into concrete dated
instances) exists here - the PRD requires recurring series to exist
(§12.4) but never specifies `recurrenceRule`'s format or an expansion
algorithm. See `apps/api/src/modules/gatherings/GATHERINGS_DESIGN_NOTES.md`
for how this milestone handles that gap (instances are created
explicitly, not auto-generated).

**Status:** real domain logic (Gatherings domain-modeling milestone).
