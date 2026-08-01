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

export const ROLE_VALUES = [
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

export const roleAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  role: roleSchema,
  branchId: z.string().uuid(),
  groupId: z.string().uuid().nullable(),
  scopeGroupIds: z.array(z.string().uuid()),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
});
export type RoleAssignmentResponseDto = z.infer<typeof roleAssignmentResponseSchema>;

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
