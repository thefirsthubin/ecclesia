/**
 * The Member Journey lifecycle-stage state machine (PRD §12.5, BR-PPL-03,
 * FR-PPL-03). "A transition not shown is, by default, disallowed and must
 * be explicitly rejected by the system, not silently permitted" (PRD
 * §12.1) - this module is the literal enforcement of that sentence.
 *
 * The seven states and every edge below are transcribed exactly from PRD
 * §12.5's `stateDiagram-v2` (including the two edge-case rows in that
 * section's table, which the diagram itself already encodes as ordinary
 * transitions - `Lapsed -> FollowUp` and `SixWeeksParticipation ->
 * AssignedToBacenta`). `[*] -> Visitor` (the diagram's start pseudostate)
 * is the only way a Person's lifecycle stage comes into existence, at
 * `Person` creation (FR-PPL-01) - it is not modeled as a *transition*
 * here, since there is no prior stage to transition from.
 */
/** Mirrors `db/schema.prisma`'s `LifecycleStage` enum exactly. Duplicated
 * rather than imported because `libs/domain/people` may depend only on
 * `libs/contracts` (Blueprint §6.2/§6.4) and Prisma's generated client is
 * an `apps/api`-layer concern - see this library's README. */
export declare const LIFECYCLE_STAGES: readonly ["VISITOR", "FIRST_TIME_GUEST", "FOLLOW_UP", "LAPSED", "ASSIGNED_TO_BACENTA", "SIX_WEEKS_PARTICIPATION", "MEMBER"];
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
export declare function isLifecycleStage(value: string): value is LifecycleStage;
export interface LifecycleTransitionCheck {
    allowed: boolean;
    reason: string;
}
/**
 * FR-PPL-03's literal acceptance criterion: "An attempt to set
 * lifecycle_stage directly from Visitor to Member (skipping intermediate
 * stages) is rejected by the system with an explicit error, not silently
 * accepted." Every caller mutating `lifecycle_stage` must go through this
 * check - see `libs/domain/people/README.md`.
 */
export declare function checkLifecycleTransition(from: LifecycleStage, to: LifecycleStage): LifecycleTransitionCheck;
/**
 * `FOLLOW_UP -> ASSIGNED_TO_BACENTA` is deliberately excluded from the
 * plain lifecycle-transition endpoint (`apps/api`'s
 * `PersonLifecycleController`) - PRD §19.1 Workflow step 6 describes this
 * specific transition as inseparable from opening the `GROUP_MEMBERSHIP`
 * record ("system transitions lifecycle_stage to AssignedToBacenta and
 * opens a GROUP_MEMBERSHIP record"), not two independent actions. The
 * People module's `GroupMembershipService` performs this transition
 * itself, atomically with creating the membership, when it applies. This
 * function tells API-layer callers when that redirection applies.
 */
export declare function requiresGroupMembershipToTransition(from: LifecycleStage, to: LifecycleStage): boolean;
//# sourceMappingURL=lifecycle-stage.d.ts.map