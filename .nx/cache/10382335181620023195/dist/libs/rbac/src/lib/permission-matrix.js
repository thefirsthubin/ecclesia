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
    // [Bug fix, People Web Admin sprint] RESIDENT_PASTOR/ASSISTANT_PASTOR
    // both hold `people.role_assignment.grant`/`.update` above, but had no
    // `.read` row at all - only ADMIN did. A role that can grant/update a
    // Role Assignment being unable to read the ones it already granted (or
    // any other in its own scope) is inconsistent with every other
    // grant+read pairing in this matrix (e.g. `people.group_membership.update`
    // above), and blocks PRD §16.1's "Person profile view... role history"
    // surface for the very personas §16.1 names it for ("All operator
    // roles"). Scopes mirror the existing `.grant`/`.update` rows exactly.
    { role: 'RESIDENT_PASTOR', action: 'people.role_assignment.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.role_assignment.read', effect: 'ALLOW', scope: 'CLUSTER' },
    // FR-PPL-07 covers Role Assignment history symmetrically with Group
    // Membership history (same requirement, same sentence) - a Worker/
    // Member can view their own role history, same SELF-scope pattern
    // `people.person.read` and the new `people.group_membership.read` rows
    // both already grant these two roles.
    { role: 'WORKER', action: 'people.role_assignment.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'people.role_assignment.read', effect: 'ALLOW', scope: 'SELF' },
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
    // --- FR-PPL-07: Bacenta/Basonta membership history (read) ------------
    // See `libs/rbac/src/lib/actions.ts`'s `people.group_membership.read`
    // doc comment - §17.3 has no row for this, FR-PPL-07 requires it.
    // Scopes mirror the `.update` rows immediately above exactly (the same
    // actor set that can change a Person's group membership can view its
    // history for Persons in their own scope).
    { role: 'RESIDENT_PASTOR', action: 'people.group_membership.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'people.group_membership.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'people.group_membership.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'people.group_membership.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'ADMIN', action: 'people.group_membership.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'WORKER', action: 'people.group_membership.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'people.group_membership.read', effect: 'ALLOW', scope: 'SELF' },
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
    {
        role: 'BACENTA_LEADER',
        action: 'gatherings.gathering.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: '[Bug fix, Shepherd Dashboard sprint] a Shepherd could create/update their own Bacenta Meetings but had no matching read grant, so GET /gatherings/:id and the new GET /gatherings list endpoint were unreachable for this role until now',
    },
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
    {
        role: 'BACENTA_LEADER',
        action: 'gatherings.attendance.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: '[Bug fix, Shepherd Dashboard sprint] same gap as gatherings.gathering.read above - a Shepherd could record attendance but not read it back, blocking the dashboard\'s Attendance Summary card',
    },
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
    // [INFERRED - no PRD §17.3 row explicitly grants these] Treasurer and
    // Bacenta Leader read access to Financial Transactions. FR-STW-03's own
    // acceptance criterion ("Given a Recorded transaction matches my
    // count... I tap Verify") presupposes a Treasurer can already see the
    // verification queue, and a Bacenta Leader recording an offering
    // (`stewardship.transaction.record`, OWN_GROUP, above) has an obvious
    // need to see what they themselves already recorded - neither
    // capability is buildable without a `.read` grant, even though §17.3's
    // table only lists these two roles against `.record`/`.verify`, not
    // `.read` explicitly. See STEWARDSHIP_DESIGN_NOTES.md.
    { role: 'TREASURER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'BACENTA_LEADER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
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
    // FR-STW-09: "cannot reach Approved without action from a Person other
    // than the requester" - the same separation-of-duties shape as
    // BR-STW-04's transaction verification, so this reuses
    // `DIFFERENT_ACTOR_THAN_RECORDER` rather than inventing a parallel
    // record-level check: `ExpenseResourceContextGuard` populates
    // `resource.recordedByPersonId` with the Expense's own
    // `requestedByPersonId` (see STEWARDSHIP_DESIGN_NOTES.md), and the check
    // itself is already generically named/implemented as "actor differs
    // from whoever performed the prior step," not literally
    // transaction-specific.
    {
        role: 'RESIDENT_PASTOR',
        action: 'stewardship.expense.approve',
        effect: 'ALLOW',
        scope: 'BRANCH',
        recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
        reason: 'FR-STW-09 - approver must not be the requester',
    },
    {
        role: 'ASSISTANT_PASTOR',
        action: 'stewardship.expense.approve',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        recordLevelCheck: 'DIFFERENT_ACTOR_THAN_RECORDER',
        reason: 'PRD §17.3 - only if delegated by the Resident Pastor; FR-STW-09 - approver must not be the requester',
    },
    // --- Expense: pay / receipt (both [INFERRED], see actions.ts) ----------
    { role: 'TREASURER', action: 'stewardship.expense.pay', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'TREASURER', action: 'stewardship.expense.receipt', effect: 'ALLOW', scope: 'BRANCH', reason: 'Treasurer may also submit and self-fulfil an expense request' },
    // [INFERRED - no PRD §17.3 row covers this] Expense: read. Mirrors
    // `.request`'s own role/scope shape - whoever may request an expense
    // has an obvious need to see their own submission's status, and the
    // approver roles need to see the request queue before approving.
    { role: 'RESIDENT_PASTOR', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'BASONTA_LEADER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'TREASURER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Project / Pledge (both [INFERRED], H2, see actions.ts) -------------
    { role: 'RESIDENT_PASTOR', action: 'stewardship.project.create', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'RESIDENT_PASTOR', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'TREASURER', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'MEMBER', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH', reason: 'A Project is a Branch-visible fundraising goal, not a private record' },
    { role: 'MEMBER', action: 'stewardship.pledge.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'RESIDENT_PASTOR', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'TREASURER', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'TREASURER',
        action: 'stewardship.pledge.fulfill',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'Linking a Pledge to its fulfilling transaction is a Finance Team record-keeping action, mirroring stewardship.transaction.reconcile',
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
        role: 'ASSISTANT_PASTOR',
        action: 'pastoral_care.followup_task.read',
        effect: 'ALLOW',
        scope: 'CLUSTER',
        reason: "[Bug fix, Pastoral Care Web Admin sprint] create/update existed for this role but read did not - the exact same class of gap the Shepherd Dashboard sprint fixed for BACENTA_LEADER two rows below. PRD §16.2's own Key Surfaces table names 'Assistant Pastor (escalations)' as a primary persona of the Follow-up task queue - that persona could create and update a task but never GET it back (single or list).",
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
    {
        role: 'BACENTA_LEADER',
        action: 'pastoral_care.followup_task.read',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: '[Bug fix, Shepherd Dashboard sprint] create/update existed for this role but read did not, so a Shepherd could never GET a Follow-up task (single or list) they themselves created or were assigned - the exact gap the dashboard\'s Priority card surfaced',
    },
    { role: 'ADMIN', action: 'pastoral_care.followup_task.read', effect: 'ALLOW', scope: 'BRANCH' },
    // --- Silent-drift flag: read (FR-PC-05, §15.8) - [INFERRED], see actions.ts ---
    { role: 'RESIDENT_PASTOR', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'ADMIN', action: 'pastoral_care.silent_drift_flag.read', effect: 'ALLOW', scope: 'BRANCH' },
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
    // --- Insights: Alert inbox (FR-INS-03/05) - same scoped-leadership shape
    // as the three dashboard-read rows above; see actions.ts's doc comment
    // on `insights.alert.read`/`insights.alert.resolve`. ---------------------
    { role: 'RESIDENT_PASTOR', action: 'insights.alert.read', effect: 'ALLOW', scope: 'BRANCH' },
    { role: 'ASSISTANT_PASTOR', action: 'insights.alert.read', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'insights.alert.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'ADMIN', action: 'insights.alert.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'RESIDENT_PASTOR',
        action: 'insights.alert.resolve',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: 'FR-INS-05 - the responding user is recorded regardless of who resolves it',
    },
    { role: 'ASSISTANT_PASTOR', action: 'insights.alert.resolve', effect: 'ALLOW', scope: 'CLUSTER' },
    { role: 'BACENTA_LEADER', action: 'insights.alert.resolve', effect: 'ALLOW', scope: 'OWN_GROUP' },
    // --- Ministry: staffing targets (FR-MIN-02/03, [INFERRED]) -------------------
    // No ASSISTANT_PASTOR CLUSTER row here, deliberately - `evaluate.ts`'s
    // CLUSTER case tests `resource.bacentaId` membership only;
    // `GroupScopeService` populates `basontaId` (not `bacentaId`) for a
    // MINISTRY-type Group, so a CLUSTER row on any Basonta-scoped action
    // could never actually match. See MINISTRY_DESIGN_NOTES.md.
    {
        role: 'BASONTA_LEADER',
        action: 'ministry.staffing_target.create',
        effect: 'ALLOW',
        scope: 'OWN_GROUP',
        reason: 'FR-MIN-02 - also covers re-setting an existing target (upsert)',
    },
    { role: 'BASONTA_LEADER', action: 'ministry.staffing_target.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'RESIDENT_PASTOR', action: 'ministry.staffing_target.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ADMIN',
        action: 'ministry.staffing_target.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '[Bug fix, Ministry Web Admin sprint] every other domain\'s BRANCH-scoped read action (people.person.read, pastoral_care.followup_task.read, ...) grants ADMIN the same BRANCH row RESIDENT_PASTOR holds - no ministry.* action had one at all before this sprint, an oversight rather than a deliberate exclusion (nothing in MINISTRY_DESIGN_NOTES.md argues ADMIN should be denied this).',
    },
    // --- Ministry: worker availability self-service (§16.3 H2, [INFERRED]) -------
    // §16.3's own key-surfaces table names "Worker/Member" as this
    // surface's persona - a Basonta Leader can also personally serve, so
    // they hold the same SELF grant as any other server.
    { role: 'WORKER', action: 'ministry.worker_availability.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'WORKER', action: 'ministry.worker_availability.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'ministry.worker_availability.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'MEMBER', action: 'ministry.worker_availability.read', effect: 'ALLOW', scope: 'SELF' },
    { role: 'BASONTA_LEADER', action: 'ministry.worker_availability.create', effect: 'ALLOW', scope: 'SELF' },
    { role: 'BASONTA_LEADER', action: 'ministry.worker_availability.read', effect: 'ALLOW', scope: 'SELF' },
    // --- Ministry: roster view + overcommitment flag (FR-MIN-01/04, [INFERRED]) --
    { role: 'BASONTA_LEADER', action: 'ministry.roster.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'RESIDENT_PASTOR', action: 'ministry.roster.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ADMIN',
        action: 'ministry.roster.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '[Bug fix, Ministry Web Admin sprint] see ministry.staffing_target.read\'s ADMIN row just above for the full reasoning - same class of gap, same fix.',
    },
    { role: 'BASONTA_LEADER', action: 'ministry.roster.overcommitment.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
    { role: 'RESIDENT_PASTOR', action: 'ministry.roster.overcommitment.read', effect: 'ALLOW', scope: 'BRANCH' },
    {
        role: 'ADMIN',
        action: 'ministry.roster.overcommitment.read',
        effect: 'ALLOW',
        scope: 'BRANCH',
        reason: '[Bug fix, Ministry Web Admin sprint] same class of gap as the two ADMIN rows above.',
    },
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