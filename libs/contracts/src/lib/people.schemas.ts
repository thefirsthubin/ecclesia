import { z } from 'zod';

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

export const LIFECYCLE_STAGE_VALUES = [
  'VISITOR',
  'FIRST_TIME_GUEST',
  'FOLLOW_UP',
  'LAPSED',
  'ASSIGNED_TO_BACENTA',
  'SIX_WEEKS_PARTICIPATION',
  'MEMBER',
] as const;
export const lifecycleStageSchema = z.enum(LIFECYCLE_STAGE_VALUES);
export type LifecycleStageDto = z.infer<typeof lifecycleStageSchema>;

/**
 * [Multi-Tenant Foundation, Phase 1] Mirrors `libs/rbac/src/lib/roles.ts`'s
 * `ROLES` array exactly, including this phase's two additions
 * (`COUNCIL_TREASURER`, `SYSTEM_ADMINISTRATOR`) - see that file's own doc
 * comment for why both exist. Hand-duplicated, not imported, matching this
 * pair's existing relationship (`libs/rbac` cannot depend on `libs/contracts`
 * or vice versa without an import cycle risk neither file's prior history
 * introduced) - keep these two lists synchronized by hand on every Role
 * addition.
 */
export const ROLE_VALUES = [
  'RESIDENT_PASTOR',
  'ACTING_RESIDENT_PASTOR',
  'ASSISTANT_PASTOR',
  'BACENTA_LEADER',
  'BASONTA_LEADER',
  'TREASURER',
  'COUNCIL_TREASURER',
  'WORKER',
  'USHER',
  'MEMBER',
  'VISITOR',
  'ADMIN',
  'COUNCIL_OVERSEER',
  'SYSTEM_ADMINISTRATOR',
] as const;
export const roleSchema = z.enum(ROLE_VALUES);
export type RoleDto = z.infer<typeof roleSchema>;

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
export const createPersonSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  dateOfBirth: z.string().date().optional(),
  address: z.string().trim().min(1).optional(),
  guardianPersonId: z.string().uuid().optional(),
  overrideDuplicateCheck: z.boolean().default(false),
});
export type CreatePersonInput = z.infer<typeof createPersonSchema>;

/** FR-PPL-08's configurable custom fields are H2 (out of scope) - see
 * `PEOPLE_DESIGN_NOTES.md`; `customFields` is deliberately not writable
 * through this schema yet even though the database column already
 * exists (Sprint 1.3). */
export const updatePersonSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).nullable().optional(),
    email: z.string().trim().email().nullable().optional(),
    dateOfBirth: z.string().date().nullable().optional(),
    address: z.string().trim().min(1).nullable().optional(),
    guardianPersonId: z.string().uuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;

export const personResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  address: z.string().nullable(),
  lifecycleStage: lifecycleStageSchema,
  guardianPersonId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PersonResponseDto = z.infer<typeof personResponseSchema>;

/**
 * `GET /people` (People Web Admin sprint - see `PEOPLE_DESIGN_NOTES.md`
 * and `apps/web-admin/.../PEOPLE_PAGE_DESIGN_NOTES.md`). PRD §16.1's
 * "Search & directory" capability: "Role-scoped search (a Shepherd
 * searches within their Bacenta context by default; an Admin searches the
 * whole Branch)." `groupId` mirrors `listGatheringsQuerySchema`'s own
 * `ownerGroupId` pattern - required for OWN_GROUP/CLUSTER-scoped roles
 * (a Bacenta/Basonta Leader or Assistant Pastor must name their own
 * group), omitted by BRANCH-scoped roles (Resident Pastor/Admin/
 * Treasurer) to search the whole Branch. `search` is a plain
 * case-insensitive name substring match, not a PRD-specified search
 * algorithm - `[Design Decision]`.
 */
export const listPeopleQuerySchema = z.object({
  groupId: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
});
export type ListPeopleQuery = z.infer<typeof listPeopleQuerySchema>;

export const duplicateCandidateResponseSchema = z.object({
  candidateId: z.string().uuid(),
  matchedOn: z.enum(['NAME_AND_PHONE', 'NAME_AND_BACENTA_AND_APPROXIMATE_AGE']),
  reason: z.string(),
});
export type DuplicateCandidateResponseDto = z.infer<typeof duplicateCandidateResponseSchema>;

/**
 * FR-PPL-03: `toStage` is validated as a member of the enum only here;
 * whether `fromStage -> toStage` is a *modeled* transition is
 * `libs/domain/people`'s `checkLifecycleTransition`'s job, evaluated
 * against the Person's actual current stage server-side, not trusted
 * from the client.
 */
export const lifecycleTransitionRequestSchema = z.object({
  toStage: lifecycleStageSchema,
  reason: z.string().trim().min(1).optional(),
});
export type LifecycleTransitionRequestInput = z.infer<typeof lifecycleTransitionRequestSchema>;

/**
 * PRD §16.1: Bacenta/Basonta reassignment "requires a reason code."
 * Whether `reason` is actually *required* depends on whether this call
 * closes a prior active Bacenta membership (a reassignment) or opens a
 * brand-new one - `libs/domain/people`'s `planGroupMembershipChange`
 * decides that server-side (`reasonRequiredForClose`), not this schema.
 */
export const createGroupMembershipRequestSchema = z.object({
  groupId: z.string().uuid(),
  reason: z.string().trim().min(1).optional(),
});
export type CreateGroupMembershipRequestInput = z.infer<typeof createGroupMembershipRequestSchema>;

/**
 * PRD §17.3 "Role Assignment: grant Shepherd/Worker/etc." row.
 * `scopeGroupIds` mirrors `db/schema.prisma`'s own field of the same
 * name (Open Question #1, CLUSTER scope's schema-less modeling) -
 * accepted here even though `libs/rbac`'s current `ActorContext`/scope
 * model cannot yet make use of it for authorization (see
 * `AUTH_DESIGN_NOTES.md`), so the data is not lost once that gap is
 * resolved.
 */
export const createRoleAssignmentRequestSchema = z.object({
  role: roleSchema,
  groupId: z.string().uuid().optional(),
  scopeGroupIds: z.array(z.string().uuid()).default([]),
  effectiveFrom: z.string().datetime().optional(),
});
export type CreateRoleAssignmentRequestInput = z.infer<typeof createRoleAssignmentRequestSchema>;

/**
 * `[Multi-Tenant Foundation, Phase 1]` `branchId` is now `.nullable()`,
 * and `councilId` added alongside it - mirroring `RoleAssignment`'s own
 * `db/schema.prisma` shape exactly (a Role Assignment is now
 * Branch-scoped XOR Council-scoped, never neither). `POST
 * /people/:personId/role-assignments` cannot itself create a
 * Council-scoped row this phase (`RoleAssignmentService.grant()`
 * explicitly rejects `COUNCIL_TREASURER`/`SYSTEM_ADMINISTRATOR` - see
 * that method's own comment) - this schema change is about honestly
 * describing what `GET .../role-assignments` can read back, not about
 * this phase adding a way to create one via this endpoint.
 */
export const roleAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  role: roleSchema,
  branchId: z.string().uuid().nullable(),
  councilId: z.string().uuid().nullable(),
  groupId: z.string().uuid().nullable(),
  scopeGroupIds: z.array(z.string().uuid()),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
});
export type RoleAssignmentResponseDto = z.infer<typeof roleAssignmentResponseSchema>;

export const GROUP_TYPE_VALUES = ['PASTORAL_CARE', 'MINISTRY'] as const;
export const groupTypeSchema = z.enum(GROUP_TYPE_VALUES);
export type GroupTypeDto = z.infer<typeof groupTypeSchema>;

export const GROUP_LIFECYCLE_STATUS_VALUES = ['ACTIVE', 'SPLITTING', 'MERGING', 'ARCHIVED'] as const;
export const groupLifecycleStatusSchema = z.enum(GROUP_LIFECYCLE_STATUS_VALUES);
export type GroupLifecycleStatusDto = z.infer<typeof groupLifecycleStatusSchema>;

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
export const createGroupSchema = z.object({
  type: groupTypeSchema,
  name: z.string().trim().min(1, 'name is required'),
  meetingSchedule: z.string().trim().min(1).optional(),
  meetingLocation: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    meetingSchedule: z.string().trim().min(1).nullable().optional(),
    meetingLocation: z.string().trim().min(1).nullable().optional(),
    category: z.string().trim().min(1).nullable().optional(),
    lifecycleStatus: groupLifecycleStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

/**
 * `GET /groups` (Ministry Web Admin sprint). There was previously no way
 * to enumerate Groups at all - only single-record CRUD by id existed.
 * `type` lets a caller ask for Basontas only (`MINISTRY`) or Bacentas
 * only (`PASTORAL_CARE`) rather than always getting both kinds mixed
 * together; omitted, both types are returned. See
 * `apps/web-admin/.../Ministry/MINISTRY_PAGE_DESIGN_NOTES.md` for why
 * this sprint needed a Basonta directory it couldn't previously build at
 * all (no way to list Basontas branch-wide, unlike People's `groupId`
 * pattern which always assumed the caller already knew one).
 */
export const listGroupsQuerySchema = z.object({
  type: groupTypeSchema.optional(),
});
export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

export const groupResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  type: groupTypeSchema,
  name: z.string(),
  meetingSchedule: z.string().nullable(),
  meetingLocation: z.string().nullable(),
  category: z.string().nullable(),
  lifecycleStatus: groupLifecycleStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GroupResponseDto = z.infer<typeof groupResponseSchema>;

export const groupMembershipResponseSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  groupId: z.string().uuid(),
  groupType: z.enum(['PASTORAL_CARE', 'MINISTRY']),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  reason: z.string().nullable(),
});
export type GroupMembershipResponseDto = z.infer<typeof groupMembershipResponseSchema>;
