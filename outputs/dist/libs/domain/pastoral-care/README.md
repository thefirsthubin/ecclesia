# libs/domain/pastoral-care

Framework-agnostic business logic for Pastoral Care (PRD §13.2):

- `silent-drift.ts` - PRD §15.8's decision tree (BR-PC-02, FR-PC-05):
  `evaluateSilentDrift()`.
- `follow-up-task.ts` - FR-PC-03 (automatic Follow-up task creation
  triggers), FR-PC-04/BR-PC-04 (SLA defaults, overdue/escalation check):
  `determineFollowUpTaskTrigger()`, `computeFollowUpTaskDueAt()`,
  `isFollowUpTaskPastSla()`.
- `poimen-enrollment.ts` - FR-PC-06 (Poimen training status progression):
  `checkPoimenStatusTransition()`.

Depends only on `@ecclesia/contracts` (Blueprint eslint.config.mjs
depConstraints) - same rule as every other `libs/domain/*` library. Enum
values (`LifecycleStage`, `FollowUpTaskStatus`, `PoimenStatus`) are
duplicated as local string unions rather than imported from
`libs/domain/people` or `@prisma/client`, for the same reason
`libs/domain/people/lifecycle-stage.ts`'s own doc comment gives for its
enum.

**What this library deliberately does not do.** Silent-drift evaluation
takes attendance *counts* as plain numeric inputs, not raw attendance
records - the actual `gatherings.attendance_records` data source does not
exist yet (the Gatherings domain is unbuilt). The real nightly sweep
(§19.3's trigger) that computes those counts and calls
`evaluateSilentDrift()` per active Member is deferred until Gatherings
exists; see `apps/api/src/modules/pastoral-care/PASTORAL_CARE_DESIGN_NOTES.md`.
Likewise, *who* a Follow-up task escalates to (BR-PC-04: "typically
Shepherd -> Assistant Pastor") is an organizational-hierarchy lookup
against real Role Assignment data, not a pure function - that resolution
lives in the Pastoral Care module's service layer, not here.

**Status:** real domain logic (Pastoral Care domain-modeling milestone).
