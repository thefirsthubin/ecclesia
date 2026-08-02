"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupMembershipResponseSchema = exports.groupResponseSchema = exports.updateGroupSchema = exports.createGroupSchema = exports.groupLifecycleStatusSchema = exports.GROUP_LIFECYCLE_STATUS_VALUES = exports.groupTypeSchema = exports.GROUP_TYPE_VALUES = exports.roleAssignmentResponseSchema = exports.createRoleAssignmentRequestSchema = exports.createGroupMembershipRequestSchema = exports.lifecycleTransitionRequestSchema = exports.duplicateCandidateResponseSchema = exports.personResponseSchema = exports.updatePersonSchema = exports.createPersonSchema = exports.roleSchema = exports.ROLE_VALUES = exports.lifecycleStageSchema = exports.LIFECYCLE_STAGE_VALUES = void 0;
const zod_1 = require("zod");
/**
 * Shared Zod schemas for the People bounded context (PRD §13.1), the
 * single source of truth for `apps/api`'s request/response shapes
 * (Blueprint §6.3) - runtime-validated via `ZodValidationPipe`
 * (`apps/api/src/platform/pipes/zod-validation.pipe.ts`), with static
 * types inferred via `z.infer<>`, not hand-duplicated.
 *
 * **Why the enums below are re-declared here rather than imported.**
 * `libs/contracts` is a leaf library - "depends on nothing else in the
 * workspace" (this library's own README) - so it cannot import
 * `LifecycleStage` from `libs/domain/people` or `Role` from `libs/rbac`,
 * even though all three (plus `db/schema.prisma`'s own enums) describe
 * the same PRD-defined value sets. See `libs/domain/people/README.md`'s
 * "Why enums are duplicated" note for the same tradeoff stated from that
 * library's side.
 */
exports.LIFECYCLE_STAGE_VALUES = [
    'VISITOR',
    'FIRST_TIME_GUEST',
    'FOLLOW_UP',
    'LAPSED',
    'ASSIGNED_TO_BACENTA',
    'SIX_WEEKS_PARTICIPATION',
    'MEMBER',
];
exports.lifecycleStageSchema = zod_1.z.enum(exports.LIFECYCLE_STAGE_VALUES);
exports.ROLE_VALUES = [
    'RESIDENT_PASTOR',
    'ACTING_RESIDENT_PASTOR',
    'ASSISTANT_PASTOR',
    'BACENTA_LEADER',
    'BASONTA_LEADER',
    'TREASURER',
    'WORKER',
    'MEMBER',
    'VISITOR',
    'ADMIN',
    'COUNCIL_OVERSEER',
];
exports.roleSchema = zod_1.z.enum(exports.ROLE_VALUES);
/**
 * FR-PPL-01 ("create a Person record from ... manual entry by an
 * authorized role"). `branchId`/`lifecycleStage` are deliberately absent:
 * a created Person always starts at `lifecycle_stage = VISITOR` (PRD
 * §12.5's `[*] -> Visitor`, matching `db/schema.prisma`'s own
 * `@default(VISITOR)`) and is scoped to the creating Admin's own Branch
 * (PRD §17.3's `people.person.create` row: ADMIN, scope BRANCH) - neither
 * is a client-supplied input.
 *
 * `overrideDuplicateCheck`: FR-PPL-02 requires "explicit ... action by an
 * authorized role before two records can coexist silently" once a
 * duplicate candidate is found. A first `POST` that turns up a candidate
 * is rejected (409) with the candidate list; resubmitting with this flag
 * set is the caller's explicit acknowledgement to proceed anyway. See
 * `PEOPLE_DESIGN_NOTES.md` - this is a narrower substitute for PRD
 * §16.1's persistent admin "duplicate resolution queue" surface, which
 * has no backing table in the Sprint 1.3 schema.
 */
exports.createPersonSchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1, 'firstName is required'),
    lastName: zod_1.z.string().trim().min(1, 'lastName is required'),
    phone: zod_1.z.string().trim().min(1).optional(),
    email: zod_1.z.string().trim().email().optional(),
    dateOfBirth: zod_1.z.string().date().optional(),
    address: zod_1.z.string().trim().min(1).optional(),
    guardianPersonId: zod_1.z.string().uuid().optional(),
    overrideDuplicateCheck: zod_1.z.boolean().default(false),
});
/** FR-PPL-08's configurable custom fields are H2 (out of scope) - see
 * `PEOPLE_DESIGN_NOTES.md`; `customFields` is deliberately not writable
 * through this schema yet even though the database column already
 * exists (Sprint 1.3). */
exports.updatePersonSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().trim().min(1).optional(),
    lastName: zod_1.z.string().trim().min(1).optional(),
    phone: zod_1.z.string().trim().min(1).nullable().optional(),
    email: zod_1.z.string().trim().email().nullable().optional(),
    dateOfBirth: zod_1.z.string().date().nullable().optional(),
    address: zod_1.z.string().trim().min(1).nullable().optional(),
    guardianPersonId: zod_1.z.string().uuid().nullable().optional(),
})
    .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
exports.personResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    phone: zod_1.z.string().nullable(),
    email: zod_1.z.string().nullable(),
    dateOfBirth: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    lifecycleStage: exports.lifecycleStageSchema,
    guardianPersonId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.duplicateCandidateResponseSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    matchedOn: zod_1.z.enum(['NAME_AND_PHONE', 'NAME_AND_BACENTA_AND_APPROXIMATE_AGE']),
    reason: zod_1.z.string(),
});
/**
 * FR-PPL-03: `toStage` is validated as a member of the enum only here;
 * whether `fromStage -> toStage` is a *modeled* transition is
 * `libs/domain/people`'s `checkLifecycleTransition`'s job, evaluated
 * against the Person's actual current stage server-side, not trusted
 * from the client.
 */
exports.lifecycleTransitionRequestSchema = zod_1.z.object({
    toStage: exports.lifecycleStageSchema,
    reason: zod_1.z.string().trim().min(1).optional(),
});
/**
 * PRD §16.1: Bacenta/Basonta reassignment "requires a reason code."
 * Whether `reason` is actually *required* depends on whether this call
 * closes a prior active Bacenta membership (a reassignment) or opens a
 * brand-new one - `libs/domain/people`'s `planGroupMembershipChange`
 * decides that server-side (`reasonRequiredForClose`), not this schema.
 */
exports.createGroupMembershipRequestSchema = zod_1.z.object({
    groupId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().trim().min(1).optional(),
});
/**
 * PRD §17.3 "Role Assignment: grant Shepherd/Worker/etc." row.
 * `scopeGroupIds` mirrors `db/schema.prisma`'s own field of the same
 * name (Open Question #1, CLUSTER scope's schema-less modeling) -
 * accepted here even though `libs/rbac`'s current `ActorContext`/scope
 * model cannot yet make use of it for authorization (see
 * `AUTH_DESIGN_NOTES.md`), so the data is not lost once that gap is
 * resolved.
 */
exports.createRoleAssignmentRequestSchema = zod_1.z.object({
    role: exports.roleSchema,
    groupId: zod_1.z.string().uuid().optional(),
    scopeGroupIds: zod_1.z.array(zod_1.z.string().uuid()).default([]),
    effectiveFrom: zod_1.z.string().datetime().optional(),
});
exports.roleAssignmentResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    role: exports.roleSchema,
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().nullable(),
    scopeGroupIds: zod_1.z.array(zod_1.z.string().uuid()),
    effectiveFrom: zod_1.z.string(),
    effectiveTo: zod_1.z.string().nullable(),
});
exports.GROUP_TYPE_VALUES = ['PASTORAL_CARE', 'MINISTRY'];
exports.groupTypeSchema = zod_1.z.enum(exports.GROUP_TYPE_VALUES);
exports.GROUP_LIFECYCLE_STATUS_VALUES = ['ACTIVE', 'SPLITTING', 'MERGING', 'ARCHIVED'];
exports.groupLifecycleStatusSchema = zod_1.z.enum(exports.GROUP_LIFECYCLE_STATUS_VALUES);
/**
 * [INFERRED - no PRD §17.3 row covers Group creation itself, see
 * `libs/rbac/src/lib/actions.ts`'s `people.group.*` doc comment]
 * `type` picks Bacenta (`PASTORAL_CARE`, FR-PC-01: "name, leader, meeting
 * schedule, meeting location") vs Basonta (`MINISTRY`, FR-MIN-01: "name,
 * leader, purpose/category"). Both field sets are accepted regardless of
 * `type` rather than validated as type-conditionally-required: the PRD
 * describes what each creation *flow* captures, not a hard schema
 * constraint that the other type's fields must be absent, and
 * `db/schema.prisma`'s own `Group` model leaves `meetingSchedule`/
 * `meetingLocation`/`category` optional for exactly this reason. `leader`
 * itself is deliberately absent - PRD §19.4 step 6 and this module's own
 * `RoleAssignmentService.grant()` establish Bacenta/Basonta leadership as
 * a separate Role Assignment, not a field on Group.
 */
exports.createGroupSchema = zod_1.z.object({
    type: exports.groupTypeSchema,
    name: zod_1.z.string().trim().min(1, 'name is required'),
    meetingSchedule: zod_1.z.string().trim().min(1).optional(),
    meetingLocation: zod_1.z.string().trim().min(1).optional(),
    category: zod_1.z.string().trim().min(1).optional(),
});
exports.updateGroupSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).optional(),
    meetingSchedule: zod_1.z.string().trim().min(1).nullable().optional(),
    meetingLocation: zod_1.z.string().trim().min(1).nullable().optional(),
    category: zod_1.z.string().trim().min(1).nullable().optional(),
    lifecycleStatus: exports.groupLifecycleStatusSchema.optional(),
})
    .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
exports.groupResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    type: exports.groupTypeSchema,
    name: zod_1.z.string(),
    meetingSchedule: zod_1.z.string().nullable(),
    meetingLocation: zod_1.z.string().nullable(),
    category: zod_1.z.string().nullable(),
    lifecycleStatus: exports.groupLifecycleStatusSchema,
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.groupMembershipResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    groupType: zod_1.z.enum(['PASTORAL_CARE', 'MINISTRY']),
    startedAt: zod_1.z.string(),
    endedAt: zod_1.z.string().nullable(),
    reason: zod_1.z.string().nullable(),
});
//# sourceMappingURL=people.schemas.js.map