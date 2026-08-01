"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_MATRIX = void 0;
/**
 * The PRD §17.3 permission matrix, transcribed exhaustively into
 * structured, version-controlled data (Blueprint §9.3): "the PRD table
 * and the enforced behavior share one source of truth in intent, even
 * though they physically live in two documents."
 *
 * Organized in the same row order as PRD §17.3 itself, one comment block
 * per row, so a reviewer can check this file against that table
 * cell-by-cell. Where a cell contains multiple letters (e.g. "R, U
 * (Branch)"), it becomes multiple rules here (Blueprint §9.3's own
 * `stewardship.transaction.verify`/`record` split is the precedent).
 * Cells marked "—" (not applicable) produce no rule at all - PRD §17.3's
 * legend is explicit that this is a different, weaker statement than an
 * "X" (explicit deny), and an absent rule is exactly how `evaluate()`
 * treats "not applicable": neither an ALLOW nor a DENY match.
 *
 * Where the PRD table gives a scope in parentheses, that scope is used
 * directly. Where it does not (a handful of cells, e.g. "Expense:
 * request"), the role's own defined scope of authority from PRD §17.2's
 * role catalog is used instead, and that inference is called out in the
 * rule's `reason`.
 */
const BASE_MATRIX = [
    // --- Person: create/edit profile ---------------------------------
    { role: 'RESIDENT_PASTOR', action: 'people.person.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'people.person.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.person.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'people.person.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'people.person.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BACENTA_LEADER', action: 'people.person.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'people.person.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'TREASURER',
        action: 'people.person.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - name only, for transaction attribution',
    },
    { role: 'WORKER', action: 'people.person.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'people.person.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'people.person.update', effect: 'ALLOW', scope: 'SELF' },
    { role: 'ADMIN', action: 'people.person.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'people.person.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'people.person.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Person: assign lifecycle stage -------------------------------
    { role: 'RESIDENT_PASTOR', action: 'people.person.lifecycle_stage.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'people.person.lifecycle_stage.update',
        effect: 'ALLOW',
        scope: 'CLUSTER',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'people.person.lifecycle_stage.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    { role: 'ADMIN', action: 'people.person.lifecycle_stage.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Role Assignment: grant Shepherd/Worker/etc. ------------------
    // The one row with a record-level policy check attached (Blueprint
    // §9.3's own worked example): granting the Shepherd (Bacenta Leader)
    // role is Poimen-gated per PRD §24 OQ-02's resolution; granting any
    // other role is not.
    {
        role: 'RESIDENT_PASTOR',
        action: 'people.role_assignment.grant_shepherd',
        effect: 'ALLOW',
        scope: 'BRANCH',
        recordLevelCheck: 'POIMEN_GATE_IF_ENABLED',
        reason: 'BR-PPL-06 / FR-PC-06 - Poimen gating is a per-Branch/Council configuration flag, not a fixed rule',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'people.role_assignment.grant_shepherd',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        recordLevelCheck: 'POIMEN_GATE_IF_ENABLED',
        reason: 'BR-PPL-06 / FR-PC-06 - same Poimen gate applies regardless of which senior role performs the grant',
    },
    { role: 'RESIDENT_PASTOR', action: 'people.role_assignment.grant', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'people.role_assignment.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.role_assignment.grant', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'people.role_assignment.update', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'ADMIN',
        action: 'people.role_assignment.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - read only, no grant authority',
    },
    // --- Bacenta/Basonta: reassign member -----------------------------
    { role: 'RESIDENT_PASTOR', action: 'people.group_membership.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.group_membership.update', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'BACENTA_LEADER',
        action: 'people.group_membership.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'PRD §17.3 - own Bacenta, own members only',
    },
    {
        role: 'BASONTA_LEADER',
        action: 'people.group_membership.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    {
        role: 'ADMIN',
        action: 'people.group_membership.update',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - admin correction only',
    },
    // --- [INFERRED, no PRD §17.3 row] Group (Bacenta/Basonta): create/read/update ---
    // FR-PC-01/FR-MIN-01 require this capability to exist; §17.3's matrix
    // has no row for it. Modeled by extension from the adjacent "reassign
    // member" row's actor set, with one deliberate narrowing: ASSISTANT_PASTOR
    // is NOT granted create authority, because deciding which cluster a
    // brand-new Bacenta belongs to is itself an unresolved configuration
    // question (see db/DESIGN_NOTES.md Open Question #1) this matrix cannot
    // presume an answer to. See PASTORAL_CARE_DESIGN_NOTES.md.
    {
        role: 'RESIDENT_PASTOR',
        action: 'people.group.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '[INFERRED] FR-PC-01/FR-MIN-01 - no PRD §17.3 citation',
    },
    { role: 'RESIDENT_PASTOR', action: 'people.group.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'people.group.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.group.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'people.group.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'people.group.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BACENTA_LEADER', action: 'people.group.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'people.group.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'people.group.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'ADMIN',
        action: 'people.group.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '[INFERRED] FR-PC-01/FR-MIN-01 - no PRD §17.3 citation',
    },
    { role: 'ADMIN', action: 'people.group.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'people.group.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Gathering: create/configure -----------------------------------
    { role: 'RESIDENT_PASTOR', action: 'gatherings.gathering.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BACENTA_LEADER', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'ADMIN', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Attendance: record ---------------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'gatherings.attendance.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'gatherings.attendance.create',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - any Gathering within their cluster',
    },
    { role: 'BACENTA_LEADER', action: 'gatherings.attendance.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.attendance.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'ADMIN',
        action: 'gatherings.attendance.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - support cases only',
    },
    // --- [INFERRED - no PRD §17.3 row covers this] Digital visitor capture
    // (FR-GTH-04). Same role/scope shape as gatherings.attendance.create
    // immediately above - see GATHERINGS_DESIGN_NOTES.md.
    { role: 'RESIDENT_PASTOR', action: 'gatherings.visitor_intake.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'gatherings.visitor_intake.create', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'gatherings.visitor_intake.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'gatherings.visitor_intake.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        role: 'ADMIN',
        action: 'gatherings.visitor_intake.create',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 pattern - support cases only, mirroring gatherings.attendance.create',
    },
    // --- Financial Transaction: record ("Recorded") --------------------
    // BR-STW-01: pastors never handle cash, regardless of any other
    // privilege they hold - this is the canonical explicit-deny example
    // PRD §17.3's "Reading note" and Blueprint §9.1 both call out by name.
    {
        role: 'RESIDENT_PASTOR',
        action: 'stewardship.transaction.record',
        effect: 'DENY',
        reason: 'Pastors do not handle cash (PRD BR-STW-01)',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'stewardship.transaction.record',
        effect: 'DENY',
        reason: 'PRD BR-STW-01',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'stewardship.transaction.record',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: "PRD §17.3 - own Bacenta's offerings",
    },
    {
        role: 'TREASURER',
        action: 'stewardship.transaction.record',
        effect: 'ALLOW',
        scope: 'SELF',
        reason: 'PRD §17.3 - individual Mobile Money entries only (Horizon 2)',
    },
    {
        role: 'MEMBER',
        action: 'stewardship.transaction.record',
        effect: 'ALLOW',
        scope: 'SELF',
        reason: 'PRD §17.3 - own Mobile Money giving only (Horizon 2)',
    },
    // --- Financial Transaction: verify ("Verified") ---------------------
    { role: 'RESIDENT_PASTOR', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'BACENTA_LEADER',
        action: 'stewardship.transaction.verify',
        effect: 'DENY',
        reason: 'PRD §17.3 / BR-STW-04 - a role that can record must never verify, even another group’s entries',
    },
    {
        role: 'TREASURER',
        action: 'stewardship.transaction.verify',
        effect: 'ALLOW',
        scope: 'BRANCH',
        recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
        reason: 'PRD §17.4 / BR-STW-04 - not the same actor who recorded this transaction',
    },
    // --- Financial Transaction: reconcile --------------------------------
    {
        role: 'TREASURER',
        action: 'stewardship.transaction.reconcile',
        effect: 'ALLOW',
        scope: 'BRANCH',
    },
    // --- Expense: request -------------------------------------------------
    // PRD §17.3 gives no explicit scope for this row; each role's own
    // defined scope of authority (§17.2) is used.
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'TREASURER', action: 'stewardship.expense.request', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Expense: approve --------------------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.approve', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'stewardship.expense.approve',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - only if delegated by the Resident Pastor',
    },
    // --- Follow-up task: create/assign --------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.followup_task.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.followup_task.update', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'pastoral_care.followup_task.create',
        effect: 'ALLOW',
        scope: 'CLUSTER',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'pastoral_care.followup_task.update',
        effect: 'ALLOW',
        scope: 'CLUSTER',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.followup_task.create',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.followup_task.update',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
    },
    { role: 'ADMIN', action: 'pastoral_care.followup_task.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Pastoral notes: view/create ------------------------------------------
    {
        role: 'RESIDENT_PASTOR',
        action: 'pastoral_care.notes.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - sensitive; Branch-wide',
    },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.notes.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.notes.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.notes.create', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.notes.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'PRD §17.3 - own Bacenta only',
    },
    { role: 'BACENTA_LEADER', action: 'pastoral_care.notes.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
    {
        // Verbatim from Blueprint §9.3's own worked example.
        role: 'ADMIN',
        action: 'pastoral_care.notes.read',
        effect: 'DENY',
        reason: 'NFR-PRIV-01 - configuration authority does not imply pastoral-content access',
    },
    {
        role: 'ADMIN',
        action: 'pastoral_care.notes.create',
        effect: 'DENY',
        reason: 'NFR-PRIV-01 - configuration authority does not imply pastoral-content access',
    },
    // --- [INFERRED - no PRD §17.3 row covers this] Poimen enrollment ------------
    // tracking (FR-PC-06). §19.4's workflow narrative names "Resident Pastor
    // or Assistant Pastor" as the actors who enroll/graduate a Poimen, plus
    // "Admin (record-keeping support)" - modeled here the same way as every
    // other §17.3 row that names these same three actors for a comparable
    // capability: RESIDENT_PASTOR at BRANCH, ASSISTANT_PASTOR at CLUSTER
    // (matching pastoral_care.notes.* immediately above), ADMIN limited to
    // read/update (record-keeping support, not initiating enrollment) per
    // §19.4's own phrasing and the NFR-PRIV-01 pattern already established
    // for ADMIN in this matrix. See PASTORAL_CARE_DESIGN_NOTES.md.
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.poimen_enrollment.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.poimen_enrollment.update', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.poimen_enrollment.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.poimen_enrollment.create', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.poimen_enrollment.update', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.poimen_enrollment.read', effect: 'ALLOW', scope: 'CLUSTER' },
    {
        role: 'ADMIN',
        action: 'pastoral_care.poimen_enrollment.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '§19.4 - "Admin (record-keeping support)"',
    },
    { role: 'ADMIN', action: 'pastoral_care.poimen_enrollment.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Insights: Branch-level dashboard ---------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'insights.branch_dashboard.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'insights.branch_dashboard.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - summary only',
    },
    { role: 'ADMIN', action: 'insights.branch_dashboard.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Insights: cluster-level dashboard ---------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'insights.cluster_dashboard.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'insights.cluster_dashboard.read',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - own cluster',
    },
    // --- Insights: own-Bacenta dashboard ---------------------------------------
    {
        role: 'RESIDENT_PASTOR',
        action: 'insights.bacenta_dashboard.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - drill-down',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'insights.bacenta_dashboard.read',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - drill-down, own cluster',
    },
    { role: 'BACENTA_LEADER', action: 'insights.bacenta_dashboard.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    // --- Configuration: gathering/role/group types ---------------------------------
    { role: 'RESIDENT_PASTOR', action: 'platform.configuration.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'platform.configuration.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'ADMIN', action: 'platform.configuration.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ADMIN', action: 'platform.configuration.update', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Audit log: view -------------------------------------------------------------
    { role: 'RESIDENT_PASTOR', action: 'platform.audit_log.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: 'PRD §17.3 - cluster-relevant entries',
    },
    {
        role: 'BACENTA_LEADER',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'PRD §17.3 - own-Bacenta-relevant entries',
    },
    {
        role: 'TREASURER',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - Stewardship entries only',
    },
    {
        role: 'ADMIN',
        action: 'platform.audit_log.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'PRD §17.3 - full',
    },
];
/**
 * Blueprint §8.6: interim authority during a Resident Pastor succession
 * is an ordinary, time-bound Role Assignment holding a distinct
 * `ACTING_RESIDENT_PASTOR` role - deliberately reusing the Role
 * Assignment mechanism rather than inventing succession-specific data
 * structures or permission logic. Its authority is identical to
 * `RESIDENT_PASTOR`'s for the duration of the assignment, so its rules
 * are generated from that role's rules rather than hand-duplicated,
 * which would risk the two silently drifting apart.
 */
const ACTING_RESIDENT_PASTOR_RULES = BASE_MATRIX.filter((rule) => rule.role === 'RESIDENT_PASTOR').map((rule) => ({
    ...rule,
    role: 'ACTING_RESIDENT_PASTOR',
    reason: rule.reason
        ? `${rule.reason} (interim authority, Blueprint §8.6)`
        : 'Interim Resident Pastor authority (Blueprint §8.6)',
}));
exports.PERMISSION_MATRIX = [...BASE_MATRIX, ...ACTING_RESIDENT_PASTOR_RULES];
//# sourceMappingURL=permission-matrix.js.map