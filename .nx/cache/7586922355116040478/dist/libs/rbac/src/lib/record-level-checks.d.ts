import type { ActorContext, BranchConfiguration, RecordLevelCheckId, ResourceContext } from './types';
/**
 * A record-level policy function (Blueprint §9.1, §9.4): evaluated only
 * after role + scope have already granted access, deciding whether this
 * *specific record* may still proceed. Returns a reason string either
 * way so `evaluate()` can explain a DENY as precisely as an ALLOW.
 */
export interface RecordLevelCheckResult {
    passed: boolean;
    reason: string;
}
export type RecordLevelCheckFn = (actor: ActorContext, resource: ResourceContext, branchConfig: BranchConfiguration) => RecordLevelCheckResult;
/**
 * Registry mapping a `RecordLevelCheckId` (as referenced from
 * `permission-matrix.ts`) to its implementation. Adding a new
 * record-level rule means writing one function and one entry here, per
 * Blueprint §9.4's explicit design goal - not a new guard class.
 */
export declare const RECORD_LEVEL_CHECKS: Record<RecordLevelCheckId, RecordLevelCheckFn>;
//# sourceMappingURL=record-level-checks.d.ts.map