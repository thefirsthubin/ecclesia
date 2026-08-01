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
export declare const GATHERING_STATUSES: readonly ["SCHEDULED", "CANCELLED", "COMPLETED"];
export type GatheringStatus = (typeof GATHERING_STATUSES)[number];
export declare function isGatheringStatus(value: string): value is GatheringStatus;
export interface GatheringStatusTransitionCheck {
    allowed: boolean;
    reason: string;
}
export declare function checkGatheringStatusTransition(from: GatheringStatus, to: GatheringStatus): GatheringStatusTransitionCheck;
/**
 * §12.4's Implementation note: "a `Gathering` table with a `type`
 * discriminator column... not as ten separate tables." Gathering types
 * are Branch-configurable (`Configuration.gatheringTypes`, a `String[]`,
 * not a fixed enum - FR-GTH-01/US-D4: "configure a new Gathering type...
 * without engineering support"), so validity is checked against a
 * Branch's own configured list, not a hard-coded union.
 */
export declare function isConfiguredGatheringType(type: string, configuredTypes: readonly string[]): boolean;
//# sourceMappingURL=gathering-status.d.ts.map