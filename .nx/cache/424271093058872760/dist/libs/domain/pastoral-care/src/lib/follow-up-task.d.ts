/**
 * Follow-up task workflow rules: FR-PC-03 (automatic creation), FR-PC-04
 * (assignment + SLA + escalation), BR-PC-03/BR-PC-04.
 *
 * Lifecycle-stage values are accepted as plain strings, not imported from
 * `libs/domain/people`'s `LifecycleStage` type - `libs/domain/pastoral-care`
 * may depend only on `libs/contracts` (this library's own README,
 * Blueprint §6.2/§6.4 module-boundary rule), and Prisma's generated
 * `LifecycleStage` enum is an `apps/api`-layer concern. Same duplication
 * tradeoff `libs/domain/people/lifecycle-stage.ts`'s own doc comment
 * already documents for its own enum.
 */
/**
 * FR-PC-03: "The system shall automatically create a Follow-up task when
 * a Person's lifecycle_stage enters FirstTimeGuest or when a Follow-up
 * task's outcome requires re-engagement (Lapsed -> FollowUp)." Two
 * distinct triggers, each carrying its own SLA default (OQ-06).
 */
export type FollowUpTaskTrigger = 'FIRST_TIME_GUEST' | 'LAPSED_REENGAGEMENT';
/**
 * `toStage`/`fromStage` are whatever `libs/domain/people`'s
 * `LifecycleStage` values the caller already validated a transition
 * against - this function only pattern-matches the two specific
 * transitions FR-PC-03 names, it does not itself validate that the
 * transition is legal (that's `checkLifecycleTransition`'s job, already
 * run by the time a caller reaches this point).
 */
export declare function determineFollowUpTaskTrigger(toStage: string, fromStage?: string): FollowUpTaskTrigger | null;
/**
 * **Resolved OQ-06 (PRD §24):** "default SLA is 3 days for First-Time
 * Guest follow-up, 14 days for Lapsed re-engagement, both
 * Branch-configurable." These are the shipped defaults - a Branch's own
 * `platform.configurations.followup_sla_defaults` JSON value (shape
 * unpinned in `db/schema.prisma`, per NFR-MAINT-01) overrides them; see
 * `computeFollowUpTaskDueAt`'s `slaDaysOverride` parameter.
 */
export declare const DEFAULT_FOLLOW_UP_SLA_DAYS: Record<FollowUpTaskTrigger, number>;
/**
 * FR-PC-04's SLA window, expressed as a concrete due date computed from
 * when the task was created. `slaDaysOverride` is the caller's own
 * Branch-configured value (`Configuration.followupSlaDefaults`) when one
 * exists; falls back to `DEFAULT_FOLLOW_UP_SLA_DAYS` (OQ-06's shipped
 * default) when it does not.
 */
export declare function computeFollowUpTaskDueAt(trigger: FollowUpTaskTrigger, createdAt: Date, slaDaysOverride?: number): Date;
export interface FollowUpTaskSlaInput {
    /** `db/schema.prisma`'s `FollowUpTaskStatus` - duplicated as a string
     * union for the same module-boundary reason as `LifecycleStage` above. */
    status: 'OPEN' | 'ESCALATED' | 'COMPLETED';
    dueAt: Date | null;
    now: Date;
}
/**
 * FR-PC-04 / BR-PC-04: "An unactioned Follow-up task past its configured
 * SLA window escalates ... ". `COMPLETED` and already-`ESCALATED` tasks
 * are never (re-)escalated by this check - escalation is a one-time state
 * transition (`OPEN -> ESCALATED`, `db/schema.prisma`'s
 * `FollowUpTaskStatus`), not a recurring alert. A task with no `dueAt`
 * set has nothing to breach and is never escalated by this rule.
 */
export declare function isFollowUpTaskPastSla(input: FollowUpTaskSlaInput): boolean;
//# sourceMappingURL=follow-up-task.d.ts.map