/**
 * `db/schema.prisma`'s `GatheringStatus` (`SCHEDULED`/`CANCELLED`/
 * `COMPLETED`) is itself `[PRD-DERIVED]`, not `[BLUEPRINT-EXACT]` -
 * PRD §12.4 names a `status` field without enumerating its values
 * (`db/DESIGN_NOTES.md` Open Question #6, already resolved with this
 * minimal 3-value set). No PRD text describes a transition diagram for
 * it either, so [INFERRED] this module treats it as forward-only from
 * `SCHEDULED` to one terminal state - the only reading consistent with
 * "cancelled" and "completed" both being outcomes of a scheduled
 * Gathering, and with §12.4's edge case (a recurring instance "can be
 * individually cancelled or reassigned") describing a one-way action, not
 * a reversible toggle.
 */

export const GATHERING_STATUSES = ['SCHEDULED', 'CANCELLED', 'COMPLETED'] as const;
export type GatheringStatus = (typeof GATHERING_STATUSES)[number];

export function isGatheringStatus(value: string): value is GatheringStatus {
  return (GATHERING_STATUSES as readonly string[]).includes(value);
}

const TRANSITIONS: Record<GatheringStatus, readonly GatheringStatus[]> = {
  SCHEDULED: ['CANCELLED', 'COMPLETED'],
  CANCELLED: [],
  COMPLETED: [],
};

export interface GatheringStatusTransitionCheck {
  allowed: boolean;
  reason: string;
}

export function checkGatheringStatusTransition(
  from: GatheringStatus,
  to: GatheringStatus,
): GatheringStatusTransitionCheck {
  if (from === to) {
    return { allowed: false, reason: `'${from}' is already the current status; not a transition` };
  }
  const allowedNext = TRANSITIONS[from];
  if (!allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `[INFERRED forward-only model]: '${from}' -> '${to}' is not a modeled transition (allowed: ${
        allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal status'
      })`,
    };
  }
  return { allowed: true, reason: `'${from}' -> '${to}' is a modeled Gathering status transition` };
}

/**
 * §12.4's Implementation note: "a `Gathering` table with a `type`
 * discriminator column... not as ten separate tables." Gathering types
 * are Branch-configurable (`Configuration.gatheringTypes`, a `String[]`,
 * not a fixed enum - FR-GTH-01/US-D4: "configure a new Gathering type...
 * without engineering support"), so validity is checked against a
 * Branch's own configured list, not a hard-coded union.
 */
export function isConfiguredGatheringType(type: string, configuredTypes: readonly string[]): boolean {
  return configuredTypes.includes(type);
}
