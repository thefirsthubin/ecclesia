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
export const LIFECYCLE_STAGES = [
  'VISITOR',
  'FIRST_TIME_GUEST',
  'FOLLOW_UP',
  'LAPSED',
  'ASSIGNED_TO_BACENTA',
  'SIX_WEEKS_PARTICIPATION',
  'MEMBER',
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export function isLifecycleStage(value: string): value is LifecycleStage {
  return (LIFECYCLE_STAGES as readonly string[]).includes(value);
}

/**
 * PRD §12.5's `stateDiagram-v2`, edge-for-edge:
 *
 * ```
 * Visitor -> FirstTimeGuest
 * FirstTimeGuest -> FollowUp
 * FollowUp -> AssignedToBacenta
 * FollowUp -> Lapsed
 * Lapsed -> FollowUp
 * AssignedToBacenta -> SixWeeksParticipation
 * SixWeeksParticipation -> Member
 * SixWeeksParticipation -> AssignedToBacenta
 * ```
 *
 * `Member` has no outbound edges ("terminates at Member", BR-PPL-03) -
 * per the Design Note in PRD §12.5, becoming a Worker/Shepherd/Assistant
 * Pastor/Resident Pastor/Treasurer is a Role Assignment layered on top of
 * the terminal `Member` stage, never a further `lifecycle_stage` value.
 */
const TRANSITIONS: Record<LifecycleStage, readonly LifecycleStage[]> = {
  VISITOR: ['FIRST_TIME_GUEST'],
  FIRST_TIME_GUEST: ['FOLLOW_UP'],
  FOLLOW_UP: ['ASSIGNED_TO_BACENTA', 'LAPSED'],
  LAPSED: ['FOLLOW_UP'],
  ASSIGNED_TO_BACENTA: ['SIX_WEEKS_PARTICIPATION'],
  SIX_WEEKS_PARTICIPATION: ['MEMBER', 'ASSIGNED_TO_BACENTA'],
  MEMBER: [],
};

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
export function checkLifecycleTransition(from: LifecycleStage, to: LifecycleStage): LifecycleTransitionCheck {
  if (from === to) {
    return { allowed: false, reason: `'${from}' is already the current lifecycle stage; not a transition` };
  }
  const allowedNext = TRANSITIONS[from];
  if (!allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `PRD §12.5 / BR-PPL-03: '${from}' -> '${to}' is not a modeled transition (allowed: ${
        allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal stage'
      })`,
    };
  }
  return { allowed: true, reason: `PRD §12.5: '${from}' -> '${to}' is a modeled transition` };
}

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
export function requiresGroupMembershipToTransition(from: LifecycleStage, to: LifecycleStage): boolean {
  return from === 'FOLLOW_UP' && to === 'ASSIGNED_TO_BACENTA';
}
