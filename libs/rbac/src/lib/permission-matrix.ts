import type { PermissionRule } from './types';

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
 *
 * `[Multi-Tenant Foundation, Phase 1 - Resident Pastor Council visibility]`
 * User-approved policy, applied mechanically and consistently rather than
 * per-row guesswork: **every existing RESIDENT_PASTOR row whose action is
 * a `.read` (read-only visibility) widens from BRANCH to COUNCIL scope**
 * (Council-wide leadership oversight - "the Resident Pastor is the
 * leadership head of the Council"), **except**:
 *
 * - `pastoral_care.notes.read` - explicitly excluded by name. Pastoral
 *   notes are the one data class NFR-PRIV-01 already treats as sensitive
 *   regardless of a role's general seniority (see `ADMIN`'s own DENY rows
 *   on this same action below) - Council leadership authority does not
 *   automatically imply unrestricted access to every Branch's private
 *   pastoral records. Stays BRANCH.
 * - `platform.configuration.read` - a Branch's technical/operational
 *   configuration (gathering types, Poimen gate flag, SLA defaults), not
 *   leadership oversight data - the same domain `ADMIN`/"Branch
 *   Administrator" already owns exclusively for `.create`/`.update`.
 *   Judged closer to administrative detail than "leadership visibility";
 *   flagged as a real judgment call, not a mechanical read/write split,
 *   in the Phase 1 Resident Pastor policy report. Stays BRANCH.
 * - `gatherings.visitor_intake.read` - left unchanged not on a
 *   sensitivity judgment but because this specific grant is already dead:
 *   no `GET` endpoint anywhere in this codebase reads it back (see the
 *   Usher role milestone's own comment on this same action, below), so
 *   widening it would have no observable effect. Reported as such rather
 *   than silently touched.
 *
 * Every **non**-`.read` RESIDENT_PASTOR row (create/update/grant/approve/
 * resolve/request/receipt - administrative or operational management
 * authority, as opposed to passive oversight) is left at BRANCH,
 * unwidened - most concretely `people.role_assignment.grant`/
 * `.grant_shepherd`/`.update` (Council-wide role administration belongs to
 * Council Administrator, per the approved policy's own explicit framing:
 * "Resident Pastor should have leadership visibility without becoming the
 * technical administrator of every account and role assignment") and
 * every `stewardship.*` action other than the domain's own `.read` rows
 * (Council Treasurer's administrative/verification authority is not
 * inherited just because Resident Pastor now sees Council-wide financial
 * *information* - "oversight, not Treasurer authority"). `people.person.
 * update`/`people.group_membership.update`/`people.group.update` are
 * unwidened by direct extension of this same read/write split, even
 * though only role-granting was named explicitly - editing another
 * Branch's own records is the same class of "technical administrator"
 * authority the policy reserves for Council Administrator, not merely
 * visibility.
 *
 * Every widened row below carries its own short `reason` note pointing
 * back to this policy rather than re-deriving the justification per row.
 */
const BASE_MATRIX: PermissionRule[] = [
  // --- Person: create/edit profile ---------------------------------
  {
    role: 'RESIDENT_PASTOR',
    action: 'people.person.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level people/member visibility - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
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
  {
    role: 'USHER',
    action: 'people.person.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      "[Usher role milestone] USHER_ROLE_PROPOSAL.md §3's Open Question, resolved: BRANCH scope so the attendance-capture screen can search the whole congregation at a Branch-wide Gathering (§16.4: \"pre-populated roster... not a blank form,\" naming Ushers alongside Shepherds for this exact screen) - not OWN_GROUP, since an Usher leads no single Bacenta/Basonta to scope to. `libs/rbac` has no field-level restriction mechanism (checked - no PersonSummary/name-only DTO exists anywhere in this codebase, and the PRD's own \"R (name only)\" note on Treasurer's row above was never actually implemented as one either), so this grant returns the full PersonResponseDto same as every other people.person.read row - the mitigation is client-side only: apps/mobile's Usher Attendance screen deliberately renders/requests just name + lifecycle stage, never phone/email/address/dateOfBirth/guardianPersonId, even though the API response carries them. Documented as a known, disclosed limitation in USHER_ROLE_DESIGN_NOTES.md, not a solved one - true enforcement needs a future field-level RBAC/DTO-narrowing mechanism this milestone does not build.",
  },
  { role: 'WORKER', action: 'people.person.read', effect: 'ALLOW', scope: 'SELF' },
  { role: 'MEMBER', action: 'people.person.read', effect: 'ALLOW', scope: 'SELF' },
  { role: 'MEMBER', action: 'people.person.update', effect: 'ALLOW', scope: 'SELF' },
  { role: 'ADMIN', action: 'people.person.create', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'ADMIN', action: 'people.person.read', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'ADMIN', action: 'people.person.update', effect: 'ALLOW', scope: 'BRANCH' },

  // --- Person: assign lifecycle stage -------------------------------
  {
    role: 'RESIDENT_PASTOR',
    action: 'people.person.lifecycle_stage.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level people/member visibility - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'people.role_assignment.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Read-only role-history visibility widened per this file\'s own Resident Pastor Council-visibility policy comment above - the paired .grant/.grant_shepherd/.update rows stay BRANCH (Council-wide role administration belongs to Council Administrator).',
  },
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'people.group_membership.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level people/member visibility - see this file\'s own Resident Pastor Council-visibility policy comment above. The paired .update row stays BRANCH.',
  },
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'people.group.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level people/member visibility (which Bacentas/Basontas exist across the Council) - see this file\'s own Resident Pastor Council-visibility policy comment above. The paired .create/.update rows stay BRANCH (organizational restructuring is Council Administrator\'s domain).',
  },
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
  {
    role: 'USHER',
    action: 'people.group.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      "[Usher role milestone] Not in the original USHER_ROLE_PROPOSAL.md §3 grant table - found while building the Visitor Intake screen, whose bacentaPreferenceGroupId field (US-A2) needs a way to list Bacentas to let a guest name one. GroupListResourceContextGuard's own doc comment already scopes GET /groups list to exactly this shape (\"the intended audience for a branch-wide listing\") - BRANCH, not OWN_GROUP, since an Usher leads no single Bacenta. See USHER_ROLE_DESIGN_NOTES.md for the full disclosure of this addition beyond the approved proposal.",
  },

  // --- Gathering: create/configure -----------------------------------
  {
    role: 'RESIDENT_PASTOR',
    action: 'gatherings.gathering.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council attendance/insights visibility - see this file\'s own Resident Pastor Council-visibility policy comment above; widened alongside gatherings.attendance.read below so a Council-wide attendance view has the Gathering itself to attribute records to.',
  },
  { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'CLUSTER' },
  {
    role: 'ASSISTANT_PASTOR',
    action: 'gatherings.gathering.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: '[Bug fix, Branch Pastor Gatherings Access] same class of gap the Shepherd Dashboard sprint already fixed for BACENTA_LEADER below - ASSISTANT_PASTOR held create/update here but no read at all, so the Web Admin Gatherings page 403\'d despite the nav item being visible to this role. ' +
      '[Widened CLUSTER -> BRANCH, Branch Pastor Dashboard sprint] A Branch-wide Gathering (e.g. Sunday Service, `ownerGroupId: null`) has no `bacentaId` - `evaluate.ts`\'s CLUSTER scope check is structurally unable to match a resource with no `bacentaId` (by design, see that file\'s own doc comment), so a CLUSTER-scoped Branch Pastor could read every Bacenta Meeting in their cluster but never the Branch-wide Sunday Service Gathering itself, blocking any Sunday-attendance-by-Bacenta view. Widened to BRANCH, the same scope RESIDENT_PASTOR/ADMIN/USHER already hold for this exact action - USHER\'s own grant is annotated for this identical "find the Branch-wide Sunday Service" reason. A real scope expansion (Branch Pastor can now read any Gathering in the Branch, not only their own cluster\'s) - user-approved, not inferred unilaterally.',
  },
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
  {
    role: 'BASONTA_LEADER',
    action: 'gatherings.gathering.read',
    effect: 'ALLOW',
    scope: 'OWN_GROUP',
    reason: '[Bug fix, Mobile Personas sprint] the exact same gap the Shepherd Dashboard sprint already fixed for BACENTA_LEADER above (create/update existed, read did not) - a Basonta Leader could create/update their own Ministry Events but never GET one back, single or list, blocking the Ministry Leader mobile persona\'s Events tab entirely. See MOBILE_PERSONAS_DESIGN_NOTES.md.',
  },
  { role: 'ADMIN', action: 'gatherings.gathering.create', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'ADMIN', action: 'gatherings.gathering.update', effect: 'ALLOW', scope: 'BRANCH' },
  {
    role: 'ADMIN',
    action: 'gatherings.gathering.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      '[Bug fix, Gatherings Web Admin sprint] same class of gap the Shepherd Dashboard sprint already fixed for BACENTA_LEADER above - ADMIN held create/update here but no read at all, an oversight rather than a deliberate exclusion.',
  },
  {
    role: 'USHER',
    action: 'gatherings.gathering.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      '[Usher role milestone] USHER_ROLE_PROPOSAL.md §3 - to find today\'s Gathering(s) (typically a Branch-wide Sunday Service, ownerGroupId null) to record against. No create/update grant - an Usher never configures the Gathering itself, that stays Assistant Pastor/Bacenta Leader/Basonta Leader/Admin\'s job.',
  },

  // --- Attendance: record ---------------------------------------------
  {
    role: 'RESIDENT_PASTOR',
    action: 'gatherings.attendance.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council attendance/insights visibility, explicitly named in the approved policy - see this file\'s own Resident Pastor Council-visibility policy comment above. Carries individual-level PII (who was PRESENT/ABSENT/EXCUSED) the same way the existing ASSISTANT_PASTOR CLUSTER->BRANCH widening above already disclosed for this action - a materially larger widening than a metadata-only read, approved explicitly, not inferred.',
  },
  {
    role: 'ASSISTANT_PASTOR',
    action: 'gatherings.attendance.create',
    effect: 'ALLOW',
    scope: 'CLUSTER',
    reason: 'PRD §17.3 - any Gathering within their cluster',
  },
  {
    role: 'ASSISTANT_PASTOR',
    action: 'gatherings.attendance.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: '[Bug fix, Branch Pastor Dashboard sprint] a Branch Pastor could record attendance (`.create` above) at CLUSTER scope but had no matching `.read` grant at any scope, so attendance could never be read back for the Branch Pastor Dashboard\'s Bacenta-by-Bacenta attendance view. ASSISTANT_PASTOR was the one role of the four attendance-recording roles missing this pairing (BACENTA_LEADER/BASONTA_LEADER/ADMIN/USHER all already had it). ' +
      '[Widened CLUSTER -> BRANCH, same sprint] Discovered live, against real seed data: the Branch-wide Sunday Service Gathering (`ownerGroupId: null`) has no `bacentaId`, and CLUSTER scope\'s evaluator is structurally unable to match a resource with no `bacentaId` (`evaluate.ts`, same reasoning as the `gatherings.gathering.read` widening above) - so a CLUSTER grant could record Sunday attendance but never read it back either, only Bacenta Meeting attendance. Widened to BRANCH, matching RESIDENT_PASTOR\'s existing grant for this identical action. This is a materially larger widening than the metadata-only `gatherings.gathering.read` change - attendance records carry individual-level PII (which named Person was PRESENT/ABSENT/EXCUSED) - so a Branch Pastor can now read attendance for every Gathering in the Branch, including other clusters\' Bacenta meetings, not just their own. User-approved with that tradeoff explicitly stated, not inferred unilaterally.',
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
    role: 'BASONTA_LEADER',
    action: 'gatherings.attendance.read',
    effect: 'ALLOW',
    scope: 'OWN_GROUP',
    reason: '[Bug fix, Mobile Personas sprint] same class of gap as gatherings.gathering.read above - a Basonta Leader could record attendance for their own Ministry Events but not read it back.',
  },
  {
    role: 'ADMIN',
    action: 'gatherings.attendance.create',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: 'PRD §17.3 - support cases only',
  },
  {
    role: 'ADMIN',
    action: 'gatherings.attendance.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      '[Bug fix, Gatherings Web Admin sprint] same class of gap as gatherings.gathering.read\'s ADMIN row above - needed so the web-admin Gathering calendar can show per-Gathering attendance-completeness status (GET .../attendance-records/completeness) for an Admin, not just Resident Pastor.',
  },
  {
    role: 'USHER',
    action: 'gatherings.attendance.create',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: '[Usher role milestone] USHER_ROLE_PROPOSAL.md §1/§5 - the role\'s core responsibility.',
  },
  {
    role: 'USHER',
    action: 'gatherings.attendance.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      '[Usher role milestone] Granted alongside .create from the start, not a follow-up bug fix like the BACENTA_LEADER/BASONTA_LEADER rows above - so the Usher Attendance screen\'s own "N recorded" progress indicator works from day one.',
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
  {
    role: 'USHER',
    action: 'gatherings.visitor_intake.create',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      "[Usher role milestone] USHER_ROLE_PROPOSAL.md §1/§6 - the role's other core responsibility (US-A1). Not .read - no GET endpoint exists for this action anywhere in this codebase (only RESIDENT_PASTOR's row above holds it, unused), so it would be a dead grant.",
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
    // `[Milestone C: Portal Read Models + Analytics]` Phase 1 decision #7
    // - Basonta Leader gains the exact parity with Bacenta Leader this
    // milestone's own audit flagged as a confirmed, real asymmetry (no
    // data-model gap - `FinancialTransaction.sourceGroupId` already
    // supports a MINISTRY-type group identically to a PASTORAL_CARE one;
    // only this permission-matrix row was missing). Every other scope
    // restriction on this action is unchanged - Basonta Leader still
    // cannot verify/reconcile, same as Bacenta Leader below.
    role: 'BASONTA_LEADER',
    action: 'stewardship.transaction.record',
    effect: 'ALLOW',
    scope: 'OWN_GROUP',
    reason: '[Milestone C] Parity with BACENTA_LEADER - a Basonta meeting\'s own giving can now be recorded by its own leader, the same authority a Bacenta Leader already had for their own group.',
  },
  {
    role: 'TREASURER',
    action: 'stewardship.transaction.record',
    effect: 'ALLOW',
    scope: 'SELF',
    reason: 'PRD §17.3 - individual Mobile Money entries only (Horizon 2). [Milestone C] Deliberately NOT widened beyond SELF - Phase 1 decision #6: Treasurer stays SELF-scoped for recording; Bacenta/Basonta leaders remain responsible for their own group\'s giving.',
  },
  {
    role: 'MEMBER',
    action: 'stewardship.transaction.record',
    effect: 'ALLOW',
    scope: 'SELF',
    reason: 'PRD §17.3 - own Mobile Money giving only (Horizon 2)',
  },

  // --- Financial Transaction: verify ("Verified") ---------------------
  {
    role: 'RESIDENT_PASTOR',
    action: 'stewardship.transaction.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-wide financial READ/visibility - oversight, not Treasurer authority, per the approved Resident Pastor policy (see this file\'s own comment above). stewardship.transaction.record stays an explicit hard DENY (BR-STW-01, unaffected by this change) and every other stewardship.* action stays BRANCH - this widening covers .read rows only.',
  },
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
  {
    // `[Milestone C: Portal Read Models + Analytics]` Phase 1 decision #8
    // - Branch Administrator gains read-only financial visibility only.
    // Deliberately just this one action: no `.record`/`.verify`/
    // `.reconcile`/expense-approval/expense-payment grant accompanies it -
    // ADMIN still cannot touch money, only see it, so the existing
    // Treasurer/Admin separation-of-duties boundary this milestone's own
    // audit confirmed (ADMIN previously held zero stewardship.* rows of
    // any kind) is narrowed by exactly one read grant, not dissolved.
    role: 'ADMIN',
    action: 'stewardship.transaction.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: '[Milestone C] Visibility only, per Phase 1 decision #8 - explicitly not a separation-of-duties bypass. No accompanying .record/.verify/.reconcile grant.',
  },
  {
    // [Multi-Tenant Foundation, Phase 1] COUNCIL_TREASURER's one and only
    // permission-matrix row this phase - deliberately minimal, the same
    // restraint this phase's own instructions apply to COUNCIL_OVERSEER
    // ("prepare it to receive real Council-scoped permissions later... do
    // not invent its complete permission matrix in this phase"). record/
    // verify/reconcile/expense/pledge authority for this role are all
    // undecided, not built here. This single row exists specifically to
    // make the mandatory Phase 1 security regression test meaningful (a
    // real ALLOW rule to exercise, not just a scope-mechanism unit test) -
    // see council-scope-isolation.spec.ts.
    role: 'COUNCIL_TREASURER',
    action: 'stewardship.transaction.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason:
      "[Multi-Tenant Foundation, Phase 1] Council Treasurer's locked scope: \"Financial oversight across all branches belonging to the user's Council.\" Minimal single-row grant - see this rule's own inline comment.",
  },
  { role: 'BACENTA_LEADER', action: 'stewardship.transaction.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  {
    // `[Milestone C]` Phase 1 decision #7's read half - pairs with the
    // `.record` grant above. Same OWN_GROUP scope, same "can record must
    // never verify" boundary as BACENTA_LEADER immediately below.
    role: 'BASONTA_LEADER',
    action: 'stewardship.transaction.read',
    effect: 'ALLOW',
    scope: 'OWN_GROUP',
    reason: '[Milestone C] Parity with BACENTA_LEADER.',
  },
  {
    role: 'BACENTA_LEADER',
    action: 'stewardship.transaction.verify',
    effect: 'DENY',
    reason: 'PRD §17.3 / BR-STW-04 - a role that can record must never verify, even another group’s entries',
  },
  {
    // `[Milestone C]` Same BR-STW-04 boundary, applied symmetrically now
    // that Basonta Leader can also record.
    role: 'BASONTA_LEADER',
    action: 'stewardship.transaction.verify',
    effect: 'DENY',
    reason: '[Milestone C] PRD §17.3 / BR-STW-04 - a role that can record must never verify, mirroring BACENTA_LEADER.',
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'stewardship.expense.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-wide financial visibility (read only) - see this file\'s own Resident Pastor Council-visibility policy comment above. .approve stays BRANCH (management authority, requires DIFFERENT_ACTOR_THAN_RECORDER against the requester).',
  },
  { role: 'ASSISTANT_PASTOR', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'BACENTA_LEADER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'TREASURER', action: 'stewardship.expense.read', effect: 'ALLOW', scope: 'BRANCH' },

  // --- Project / Pledge (both [INFERRED], H2, see actions.ts) -------------
  { role: 'RESIDENT_PASTOR', action: 'stewardship.project.create', effect: 'ALLOW', scope: 'BRANCH' },
  {
    role: 'RESIDENT_PASTOR',
    action: 'stewardship.project.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-wide financial visibility (read only) - see this file\'s own Resident Pastor Council-visibility policy comment above. .create stays BRANCH (initiating a new fundraising Project is administrative/operational authority, not passive oversight).',
  },
  { role: 'ASSISTANT_PASTOR', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'TREASURER', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'MEMBER', action: 'stewardship.project.read', effect: 'ALLOW', scope: 'BRANCH', reason: 'A Project is a Branch-visible fundraising goal, not a private record' },
  { role: 'MEMBER', action: 'stewardship.pledge.create', effect: 'ALLOW', scope: 'SELF' },
  { role: 'MEMBER', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'SELF' },
  {
    role: 'RESIDENT_PASTOR',
    action: 'stewardship.pledge.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-wide financial visibility (read only) - see this file\'s own Resident Pastor Council-visibility policy comment above. Note: Pledge rows carry named-individual giving-commitment amounts, a real (if PRD-consistent) widening of what data crosses Branch lines - flagged, not hidden.',
  },
  { role: 'TREASURER', action: 'stewardship.pledge.read', effect: 'ALLOW', scope: 'BRANCH' },
  {
    role: 'TREASURER',
    action: 'stewardship.pledge.fulfill',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: 'Linking a Pledge to its fulfilling transaction is a Finance Team record-keeping action, mirroring stewardship.transaction.reconcile',
  },

  // --- Bank Deposit Confirmation (both [INFERRED], see actions.ts) --------
  {
    role: 'TREASURER',
    action: 'stewardship.bank_deposit.confirm',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: 'Recording a bank deposit confirmation is a Finance Team record-keeping action, mirroring stewardship.transaction.reconcile',
  },
  { role: 'TREASURER', action: 'stewardship.bank_deposit.read', effect: 'ALLOW', scope: 'BRANCH' },
  {
    role: 'RESIDENT_PASTOR',
    action: 'stewardship.bank_deposit.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-wide financial visibility (read only) - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
  {
    role: 'ASSISTANT_PASTOR',
    action: 'stewardship.bank_deposit.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: "[Bug fix, Branch Pastor Dashboard sprint] was CLUSTER, which could never succeed - GET /bank-deposit-confirmations/reconciliation (BankDepositConfirmationListResourceContextGuard) always resolves a bare { branchId } resource, no bacentaId, and CLUSTER scope's own evaluator (evaluate.ts) is structurally unable to match a resource with no bacentaId (same reasoning as the gatherings.gathering.read widening two sections up). Discovered live: real dev-seed data + a real API call 403'd where a mocked test had passed. Widened to BRANCH, matching TREASURER/RESIDENT_PASTOR's existing grant for this identical action - user-approved, not inferred unilaterally.",
  },
  // No BACENTA_LEADER row: the weekly reconciliation view is a
  // Branch-wide aggregate (BankDepositConfirmationListResourceContextGuard
  // always resolves { branchId: actor.branchId }), the same disclosed
  // limitation stewardship.transaction.read's own list endpoint already
  // has - an OWN_GROUP-scoped grant cannot satisfy a BRANCH-scoped
  // resource. See STEWARDSHIP_DESIGN_NOTES.md.

  // --- Follow-up task: create/assign --------------------------------------
  {
    role: 'RESIDENT_PASTOR',
    action: 'pastoral_care.followup_task.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level pastoral oversight - structured follow-up workflow status, not raw pastoral-note content - see this file\'s own Resident Pastor Council-visibility policy comment above. .update stays BRANCH (managing/reassigning a specific task is operational authority, not oversight).',
  },
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
    reason:
      "[Bug fix, Pastoral Care Web Admin sprint] create/update existed for this role but read did not - the exact same class of gap the Shepherd Dashboard sprint fixed for BACENTA_LEADER two rows below. PRD §16.2's own Key Surfaces table names 'Assistant Pastor (escalations)' as a primary persona of the Follow-up task queue - that persona could create and update a task but never GET it back (single or list).",
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'pastoral_care.silent_drift_flag.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level pastoral oversight - an aggregate early-warning signal, not raw pastoral-note content - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
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

  // --- `[Milestone B: People + Pastoral + Outreach Foundation]` Prayer
  // notes: the private pastoral domain (MILESTONE_B_DESIGN_NOTES.md Part
  // 5/6's approved Option C). Deliberately narrower than
  // `pastoral_care.notes.*` immediately above: no BACENTA_LEADER row at
  // all (the approved decision explicitly excludes Bacenta/Basonta
  // Leaders from this tier, unlike the general PastoralNote model). Scope
  // here only gates "can this actor read/create prayer notes for a
  // Person in their organizational scope at all" - the additionally
  // stronger author-only restriction (approved: even Resident Pastor and
  // Assistant Pastor do not see each other's notes) is enforced at the
  // query layer (`PrayerNoteService`/`PrayerNoteRepository`), which this
  // matrix cannot express (no "author only" Scope value exists). ---
  {
    role: 'RESIDENT_PASTOR',
    action: 'pastoral_care.prayer_note.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: '[Milestone B] Same organizational scope as pastoral_care.notes.read - the stronger author-only restriction is enforced separately, at the query layer.',
  },
  { role: 'RESIDENT_PASTOR', action: 'pastoral_care.prayer_note.create', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'RESIDENT_PASTOR', action: 'pastoral_care.prayer_note.update', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.prayer_note.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.prayer_note.create', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.prayer_note.update', effect: 'ALLOW', scope: 'CLUSTER' },
  {
    role: 'ADMIN',
    action: 'pastoral_care.prayer_note.read',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.read - configuration authority does not imply pastoral-content access.',
  },
  {
    role: 'ADMIN',
    action: 'pastoral_care.prayer_note.create',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.create.',
  },
  {
    role: 'ADMIN',
    action: 'pastoral_care.prayer_note.update',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.create.',
  },

  // --- `[Milestone B]` Counselling - same private-pastoral-domain
  // pattern as prayer notes above, but NOT author-only (organizational
  // BRANCH/CLUSTER scope only - see CounsellingSession's own schema
  // doc comment). ---
  { role: 'RESIDENT_PASTOR', action: 'pastoral_care.counselling.read', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'RESIDENT_PASTOR', action: 'pastoral_care.counselling.create', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'RESIDENT_PASTOR', action: 'pastoral_care.counselling.update', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.counselling.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.counselling.create', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.counselling.update', effect: 'ALLOW', scope: 'CLUSTER' },
  {
    role: 'ADMIN',
    action: 'pastoral_care.counselling.read',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.read.',
  },
  {
    role: 'ADMIN',
    action: 'pastoral_care.counselling.create',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.create.',
  },
  {
    role: 'ADMIN',
    action: 'pastoral_care.counselling.update',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.create.',
  },

  // --- `[Milestone B]` Member interactions - pastor-only for this
  // milestone (approved decision: "keep them pastor-only for Milestone
  // B, revisit leader visibility later" - deliberately no BACENTA_LEADER/
  // BASONTA_LEADER row, unlike this file's own pastoral_care.followup_task.*
  // rows a few sections above). ---
  { role: 'RESIDENT_PASTOR', action: 'pastoral_care.interaction.read', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'RESIDENT_PASTOR', action: 'pastoral_care.interaction.create', effect: 'ALLOW', scope: 'BRANCH' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.interaction.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'pastoral_care.interaction.create', effect: 'ALLOW', scope: 'CLUSTER' },
  {
    role: 'ADMIN',
    action: 'pastoral_care.interaction.read',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.read.',
  },
  {
    role: 'ADMIN',
    action: 'pastoral_care.interaction.create',
    effect: 'DENY',
    reason: '[Milestone B] Same NFR-PRIV-01 reasoning as pastoral_care.notes.create.',
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'pastoral_care.poimen_enrollment.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level pastoral oversight (read only) - see this file\'s own Resident Pastor Council-visibility policy comment above. .create/.update stay BRANCH - Poimen completion gates a Shepherd role grant (BR-PPL-06), and role-granting authority itself stays BRANCH per the same policy\'s explicit role-assignment decision.',
  },
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'insights.branch_dashboard.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council attendance/insights visibility - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
  {
    role: 'ASSISTANT_PASTOR',
    action: 'insights.branch_dashboard.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: 'PRD §17.3 - summary only',
  },
  { role: 'ADMIN', action: 'insights.branch_dashboard.read', effect: 'ALLOW', scope: 'BRANCH' },

  // --- Insights: cluster-level dashboard ---------------------------------------
  {
    role: 'RESIDENT_PASTOR',
    action: 'insights.cluster_dashboard.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council attendance/insights visibility - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
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
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] PRD §17.3 drill-down, widened per this file\'s own Resident Pastor Council-visibility policy comment above - drill-down now reaches any Bacenta in the Council, not only the actor\'s own Branch.',
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'insights.alert.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council attendance/insights visibility - see this file\'s own Resident Pastor Council-visibility policy comment above. .resolve stays BRANCH (resolving is a management action, not passive oversight).',
  },
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'ministry.staffing_target.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level leadership visibility into ministry staffing - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
  {
    role: 'ADMIN',
    action: 'ministry.staffing_target.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason:
      '[Bug fix, Ministry Web Admin sprint] every other domain\'s BRANCH-scoped read action (people.person.read, pastoral_care.followup_task.read, ...) grants ADMIN the same BRANCH row RESIDENT_PASTOR holds - no ministry.* action had one at all before this sprint, an oversight rather than a deliberate exclusion (nothing in MINISTRY_DESIGN_NOTES.md argues ADMIN should be denied this).',
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'ministry.roster.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level leadership visibility into ministry rosters - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
  {
    role: 'ADMIN',
    action: 'ministry.roster.read',
    effect: 'ALLOW',
    scope: 'BRANCH',
    reason: '[Bug fix, Ministry Web Admin sprint] see ministry.staffing_target.read\'s ADMIN row just above for the full reasoning - same class of gap, same fix.',
  },
  { role: 'BASONTA_LEADER', action: 'ministry.roster.overcommitment.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  {
    role: 'RESIDENT_PASTOR',
    action: 'ministry.roster.overcommitment.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level leadership visibility into ministry overcommitment flags - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
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
  {
    role: 'RESIDENT_PASTOR',
    action: 'platform.audit_log.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Multi-Tenant Foundation, Phase 1] Council-level accountability/oversight visibility - see this file\'s own Resident Pastor Council-visibility policy comment above.',
  },
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

  // --- [Multi-Tenant Foundation, Phase 1] Tenant administration -----------
  // SYSTEM_ADMINISTRATOR's one and only row this phase - "give it ONLY the
  // minimum platform-level authority necessary to establish the role."
  // Explicitly does NOT hold any people.*/stewardship.*/pastoral_care.*
  // row - not as an explicit DENY (this role isn't senior enough in the
  // church hierarchy for a reader to plausibly assume it has access the
  // way ADMIN's pastoral_care.notes DENY rows guard against - it's simply
  // a different axis entirely, an unassigned action, matching how e.g.
  // WORKER holds no stewardship.* row without needing one), but by never
  // appearing as the `role` in any rule for those domains anywhere in this
  // file. platform.configuration.*/platform.audit_log.read (the other two
  // existing platform.* actions) are also deliberately NOT granted here -
  // both are Branch-scoped church-operational concerns (gathering types,
  // Poimen gate, Branch audit trail), not the "tenants/platform
  // configuration/system settings" this role's own locked scope names.
  {
    role: 'SYSTEM_ADMINISTRATOR',
    action: 'platform.tenant.read',
    effect: 'ALLOW',
    scope: 'GLOBAL',
    reason:
      "[Multi-Tenant Foundation, Phase 1] GLOBAL is used here deliberately, not as a shortcut - Tenant is the platform's own administrative resource, not customer (church) data, so there is no Tenant/Council boundary for this specific action to violate the way there would be for e.g. stewardship.transaction.read. This is the one legitimate use of GLOBAL this phase's own instructions anticipate (\"do not use GLOBAL as tenant access\" refers to granting access to customer data across tenants, which this is not) - every other action in this matrix keeps GLOBAL unused.",
  },
  // `[Milestone C: Portal Read Models + Analytics]` Phase 1 decision #10:
  // SYSTEM_ADMINISTRATOR deliberately receives no new rows this
  // milestone. Church-operational financial/pastoral/people/attendance
  // access was explicitly ruled out even where a dashboard would want it
  // - see this milestone's own final report for what remains
  // unimplemented as a result (system-health/user-management/audit
  // capabilities this role's own locked scope names but no existing
  // backend model yet supports safely).

  // --- `[Milestone C: Portal Read Models + Analytics]` Council
  // Administrator (`COUNCIL_OVERSEER`) - Phase 1 decision #9. The first
  // real grants this role has ever held (previously zero rows, "Horizon
  // 3... included for completeness"). Deliberately minimal and read-only:
  // organizational oversight across the Council's own Branches, never
  // pastoral-private data (no `pastoral_care.*` row of any kind), never a
  // financial or branch-operational mutation (no `.record`/`.verify`/
  // `.reconcile`/`.create`/`.update` anywhere below). Every scope is
  // COUNCIL, the same set-membership-against-`councilBranchIds` mechanism
  // RESIDENT_PASTOR's own widened rows already use - no new scope
  // mechanism, no new RLS policy. ---
  {
    role: 'COUNCIL_OVERSEER',
    action: 'people.person.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Milestone C] Organizational oversight - membership visibility across the Council, read-only.',
  },
  {
    role: 'COUNCIL_OVERSEER',
    action: 'gatherings.gathering.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Milestone C] Needed to identify/attribute Gatherings behind an attendance breakdown - metadata only, no attendance PII by itself.',
  },
  {
    role: 'COUNCIL_OVERSEER',
    action: 'gatherings.attendance.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Milestone C] Organizational oversight - attendance visibility across the Council, read-only. Carries individual-level PII, the same disclosed widening RESIDENT_PASTOR\'s own equivalent grant already accepted.',
  },
  {
    role: 'COUNCIL_OVERSEER',
    action: 'stewardship.transaction.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Milestone C] Organizational oversight - giving visibility across the Council, read-only. No .record/.verify/.reconcile - this is not Treasurer authority.',
  },
  {
    role: 'COUNCIL_OVERSEER',
    action: 'insights.branch_dashboard.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Milestone C] Branch-overview/growth-trend dashboards, read-only, across the Council.',
  },

  // --- `[Milestone B: People + Pastoral + Outreach Foundation]` Outreach
  // (MILESTONE_B_DESIGN_NOTES.md Part 4/11). Organizational data, not
  // pastoral-sensitive (Part 13's privacy matrix) - unlike the private
  // pastoral domain below, no explicit ADMIN DENY is needed here; ADMIN
  // simply holds no grant at all yet (not proposed by the approved
  // design - a future decision, not an oversight). RESIDENT_PASTOR is
  // read-only (Council-level oversight of the outreach pipeline overall,
  // matching this file's own Resident Pastor Council-visibility policy),
  // never `.create` - Outreach itself is a Bacenta/Basonta/Cluster-level
  // activity Resident Pastor oversees, not personally performs. ---
  {
    role: 'RESIDENT_PASTOR',
    action: 'outreach.event.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Milestone B] Council-level oversight of the outreach pipeline, read-only - see this file\'s own Resident Pastor Council-visibility policy comment.',
  },
  { role: 'RESIDENT_PASTOR', action: 'outreach.contact.read', effect: 'ALLOW', scope: 'COUNCIL' },
  { role: 'ASSISTANT_PASTOR', action: 'outreach.event.create', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'outreach.event.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'outreach.contact.create', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'outreach.contact.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'outreach.contact.update', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'BACENTA_LEADER', action: 'outreach.event.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BACENTA_LEADER', action: 'outreach.event.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BACENTA_LEADER', action: 'outreach.contact.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BACENTA_LEADER', action: 'outreach.contact.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BACENTA_LEADER', action: 'outreach.contact.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'outreach.event.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'outreach.event.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'outreach.contact.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'outreach.contact.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'outreach.contact.update', effect: 'ALLOW', scope: 'OWN_GROUP' },

  // --- `[Milestone C: Portal Read Models + Analytics]` Potential (Phase
  // 1 decision #4). Same role/scope shape as `outreach.*` immediately
  // above, deliberately: a Potential is organizational, Bacenta/Basonta/
  // Cluster-level cultivation activity, not pastoral-sensitive content -
  // RESIDENT_PASTOR gets read-only Council oversight, never `.create`
  // (the same "oversees, does not personally perform" reasoning already
  // applied to Outreach); ADMIN holds no grant at all, also mirroring
  // Outreach's own precedent (organizational data an Admin has no
  // established need to touch, not a deliberate privacy exclusion). ---
  {
    role: 'RESIDENT_PASTOR',
    action: 'people.potential.read',
    effect: 'ALLOW',
    scope: 'COUNCIL',
    reason: '[Milestone C] Council-level oversight of the Potential pipeline, read-only - mirrors outreach.event.read\'s own reasoning.',
  },
  { role: 'ASSISTANT_PASTOR', action: 'people.potential.create', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'people.potential.read', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'ASSISTANT_PASTOR', action: 'people.potential.update', effect: 'ALLOW', scope: 'CLUSTER' },
  { role: 'BACENTA_LEADER', action: 'people.potential.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BACENTA_LEADER', action: 'people.potential.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BACENTA_LEADER', action: 'people.potential.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'people.potential.create', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'people.potential.read', effect: 'ALLOW', scope: 'OWN_GROUP' },
  { role: 'BASONTA_LEADER', action: 'people.potential.update', effect: 'ALLOW', scope: 'OWN_GROUP' },
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
const ACTING_RESIDENT_PASTOR_RULES: PermissionRule[] = BASE_MATRIX.filter(
  (rule) => rule.role === 'RESIDENT_PASTOR',
).map((rule) => ({
  ...rule,
  role: 'ACTING_RESIDENT_PASTOR',
  reason: rule.reason
    ? `${rule.reason} (interim authority, Blueprint §8.6)`
    : 'Interim Resident Pastor authority (Blueprint §8.6)',
}));

export const PERMISSION_MATRIX: PermissionRule[] = [...BASE_MATRIX, ...ACTING_RESIDENT_PASTOR_RULES];
