"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FOLLOW_UP_SLA_DAYS = void 0;
exports.determineFollowUpTaskTrigger = determineFollowUpTaskTrigger;
exports.computeFollowUpTaskDueAt = computeFollowUpTaskDueAt;
exports.isFollowUpTaskPastSla = isFollowUpTaskPastSla;
/**
 * `toStage`/`fromStage` are whatever `libs/domain/people`'s
 * `LifecycleStage` values the caller already validated a transition
 * against - this function only pattern-matches the two specific
 * transitions FR-PC-03 names, it does not itself validate that the
 * transition is legal (that's `checkLifecycleTransition`'s job, already
 * run by the time a caller reaches this point).
 */
function determineFollowUpTaskTrigger(toStage, fromStage) {
    if (toStage === 'FIRST_TIME_GUEST') {
        return 'FIRST_TIME_GUEST';
    }
    if (fromStage === 'LAPSED' && toStage === 'FOLLOW_UP') {
        return 'LAPSED_REENGAGEMENT';
    }
    return null;
}
/**
 * **Resolved OQ-06 (PRD §24):** "default SLA is 3 days for First-Time
 * Guest follow-up, 14 days for Lapsed re-engagement, both
 * Branch-configurable." These are the shipped defaults - a Branch's own
 * `platform.configurations.followup_sla_defaults` JSON value (shape
 * unpinned in `db/schema.prisma`, per NFR-MAINT-01) overrides them; see
 * `computeFollowUpTaskDueAt`'s `slaDaysOverride` parameter.
 */
exports.DEFAULT_FOLLOW_UP_SLA_DAYS = {
    FIRST_TIME_GUEST: 3,
    LAPSED_REENGAGEMENT: 14,
};
/**
 * FR-PC-04's SLA window, expressed as a concrete due date computed from
 * when the task was created. `slaDaysOverride` is the caller's own
 * Branch-configured value (`Configuration.followupSlaDefaults`) when one
 * exists; falls back to `DEFAULT_FOLLOW_UP_SLA_DAYS` (OQ-06's shipped
 * default) when it does not.
 */
function computeFollowUpTaskDueAt(trigger, createdAt, slaDaysOverride) {
    const slaDays = slaDaysOverride ?? exports.DEFAULT_FOLLOW_UP_SLA_DAYS[trigger];
    const dueAt = new Date(createdAt.getTime());
    dueAt.setUTCDate(dueAt.getUTCDate() + slaDays);
    return dueAt;
}
/**
 * FR-PC-04 / BR-PC-04: "An unactioned Follow-up task past its configured
 * SLA window escalates ... ". `COMPLETED` and already-`ESCALATED` tasks
 * are never (re-)escalated by this check - escalation is a one-time state
 * transition (`OPEN -> ESCALATED`, `db/schema.prisma`'s
 * `FollowUpTaskStatus`), not a recurring alert. A task with no `dueAt`
 * set has nothing to breach and is never escalated by this rule.
 */
function isFollowUpTaskPastSla(input) {
    if (input.status !== 'OPEN' || !input.dueAt) {
        return false;
    }
    return input.now.getTime() > input.dueAt.getTime();
}
//# sourceMappingURL=follow-up-task.js.map