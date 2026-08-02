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
export declare const LIFECYCLE_STAGE_VALUES: readonly ["VISITOR", "FIRST_TIME_GUEST", "FOLLOW_UP", "LAPSED", "ASSIGNED_TO_BACENTA", "SIX_WEEKS_PARTICIPATION", "MEMBER"];
export declare const lifecycleStageSchema: z.ZodEnum<["VISITOR", "FIRST_TIME_GUEST", "FOLLOW_UP", "LAPSED", "ASSIGNED_TO_BACENTA", "SIX_WEEKS_PARTICIPATION", "MEMBER"]>;
export type LifecycleStageDto = z.infer<typeof lifecycleStageSchema>;
export declare const ROLE_VALUES: readonly ["RESIDENT_PASTOR", "ACTING_RESIDENT_PASTOR", "ASSISTANT_PASTOR", "BACENTA_LEADER", "BASONTA_LEADER", "TREASURER", "WORKER", "MEMBER", "VISITOR", "ADMIN", "COUNCIL_OVERSEER"];
export declare const roleSchema: z.ZodEnum<["RESIDENT_PASTOR", "ACTING_RESIDENT_PASTOR", "ASSISTANT_PASTOR", "BACENTA_LEADER", "BASONTA_LEADER", "TREASURER", "WORKER", "MEMBER", "VISITOR", "ADMIN", "COUNCIL_OVERSEER"]>;
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
export declare const createPersonSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    guardianPersonId: z.ZodOptional<z.ZodString>;
    overrideDuplicateCheck: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    overrideDuplicateCheck: boolean;
    phone?: string | undefined;
    email?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    guardianPersonId?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    email?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    guardianPersonId?: string | undefined;
    overrideDuplicateCheck?: boolean | undefined;
}>;
export type CreatePersonInput = z.infer<typeof createPersonSchema>;
/** FR-PPL-08's configurable custom fields are H2 (out of scope) - see
 * `PEOPLE_DESIGN_NOTES.md`; `customFields` is deliberately not writable
 * through this schema yet even though the database column already
 * exists (Sprint 1.3). */
export declare const updatePersonSchema: z.ZodEffects<z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dateOfBirth: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    guardianPersonId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    address?: string | null | undefined;
    guardianPersonId?: string | null | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    address?: string | null | undefined;
    guardianPersonId?: string | null | undefined;
}>, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    address?: string | null | undefined;
    guardianPersonId?: string | null | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    address?: string | null | undefined;
    guardianPersonId?: string | null | undefined;
}>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
export declare const personResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    dateOfBirth: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    lifecycleStage: z.ZodEnum<["VISITOR", "FIRST_TIME_GUEST", "FOLLOW_UP", "LAPSED", "ASSIGNED_TO_BACENTA", "SIX_WEEKS_PARTICIPATION", "MEMBER"]>;
    guardianPersonId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    dateOfBirth: string | null;
    address: string | null;
    guardianPersonId: string | null;
    lifecycleStage: "FIRST_TIME_GUEST" | "VISITOR" | "FOLLOW_UP" | "LAPSED" | "ASSIGNED_TO_BACENTA" | "SIX_WEEKS_PARTICIPATION" | "MEMBER";
}, {
    branchId: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    dateOfBirth: string | null;
    address: string | null;
    guardianPersonId: string | null;
    lifecycleStage: "FIRST_TIME_GUEST" | "VISITOR" | "FOLLOW_UP" | "LAPSED" | "ASSIGNED_TO_BACENTA" | "SIX_WEEKS_PARTICIPATION" | "MEMBER";
}>;
export type PersonResponseDto = z.infer<typeof personResponseSchema>;
export declare const duplicateCandidateResponseSchema: z.ZodObject<{
    candidateId: z.ZodString;
    matchedOn: z.ZodEnum<["NAME_AND_PHONE", "NAME_AND_BACENTA_AND_APPROXIMATE_AGE"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    candidateId: string;
    matchedOn: "NAME_AND_PHONE" | "NAME_AND_BACENTA_AND_APPROXIMATE_AGE";
}, {
    reason: string;
    candidateId: string;
    matchedOn: "NAME_AND_PHONE" | "NAME_AND_BACENTA_AND_APPROXIMATE_AGE";
}>;
export type DuplicateCandidateResponseDto = z.infer<typeof duplicateCandidateResponseSchema>;
/**
 * FR-PPL-03: `toStage` is validated as a member of the enum only here;
 * whether `fromStage -> toStage` is a *modeled* transition is
 * `libs/domain/people`'s `checkLifecycleTransition`'s job, evaluated
 * against the Person's actual current stage server-side, not trusted
 * from the client.
 */
export declare const lifecycleTransitionRequestSchema: z.ZodObject<{
    toStage: z.ZodEnum<["VISITOR", "FIRST_TIME_GUEST", "FOLLOW_UP", "LAPSED", "ASSIGNED_TO_BACENTA", "SIX_WEEKS_PARTICIPATION", "MEMBER"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    toStage: "FIRST_TIME_GUEST" | "VISITOR" | "FOLLOW_UP" | "LAPSED" | "ASSIGNED_TO_BACENTA" | "SIX_WEEKS_PARTICIPATION" | "MEMBER";
    reason?: string | undefined;
}, {
    toStage: "FIRST_TIME_GUEST" | "VISITOR" | "FOLLOW_UP" | "LAPSED" | "ASSIGNED_TO_BACENTA" | "SIX_WEEKS_PARTICIPATION" | "MEMBER";
    reason?: string | undefined;
}>;
export type LifecycleTransitionRequestInput = z.infer<typeof lifecycleTransitionRequestSchema>;
/**
 * PRD §16.1: Bacenta/Basonta reassignment "requires a reason code."
 * Whether `reason` is actually *required* depends on whether this call
 * closes a prior active Bacenta membership (a reassignment) or opens a
 * brand-new one - `libs/domain/people`'s `planGroupMembershipChange`
 * decides that server-side (`reasonRequiredForClose`), not this schema.
 */
export declare const createGroupMembershipRequestSchema: z.ZodObject<{
    groupId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    groupId: string;
    reason?: string | undefined;
}, {
    groupId: string;
    reason?: string | undefined;
}>;
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
export declare const createRoleAssignmentRequestSchema: z.ZodObject<{
    role: z.ZodEnum<["RESIDENT_PASTOR", "ACTING_RESIDENT_PASTOR", "ASSISTANT_PASTOR", "BACENTA_LEADER", "BASONTA_LEADER", "TREASURER", "WORKER", "MEMBER", "VISITOR", "ADMIN", "COUNCIL_OVERSEER"]>;
    groupId: z.ZodOptional<z.ZodString>;
    scopeGroupIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    effectiveFrom: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "VISITOR" | "MEMBER" | "RESIDENT_PASTOR" | "ACTING_RESIDENT_PASTOR" | "ASSISTANT_PASTOR" | "BACENTA_LEADER" | "BASONTA_LEADER" | "TREASURER" | "WORKER" | "ADMIN" | "COUNCIL_OVERSEER";
    scopeGroupIds: string[];
    groupId?: string | undefined;
    effectiveFrom?: string | undefined;
}, {
    role: "VISITOR" | "MEMBER" | "RESIDENT_PASTOR" | "ACTING_RESIDENT_PASTOR" | "ASSISTANT_PASTOR" | "BACENTA_LEADER" | "BASONTA_LEADER" | "TREASURER" | "WORKER" | "ADMIN" | "COUNCIL_OVERSEER";
    groupId?: string | undefined;
    scopeGroupIds?: string[] | undefined;
    effectiveFrom?: string | undefined;
}>;
export type CreateRoleAssignmentRequestInput = z.infer<typeof createRoleAssignmentRequestSchema>;
export declare const roleAssignmentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    personId: z.ZodString;
    role: z.ZodEnum<["RESIDENT_PASTOR", "ACTING_RESIDENT_PASTOR", "ASSISTANT_PASTOR", "BACENTA_LEADER", "BASONTA_LEADER", "TREASURER", "WORKER", "MEMBER", "VISITOR", "ADMIN", "COUNCIL_OVERSEER"]>;
    branchId: z.ZodString;
    groupId: z.ZodNullable<z.ZodString>;
    scopeGroupIds: z.ZodArray<z.ZodString, "many">;
    effectiveFrom: z.ZodString;
    effectiveTo: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    groupId: string | null;
    id: string;
    personId: string;
    role: "VISITOR" | "MEMBER" | "RESIDENT_PASTOR" | "ACTING_RESIDENT_PASTOR" | "ASSISTANT_PASTOR" | "BACENTA_LEADER" | "BASONTA_LEADER" | "TREASURER" | "WORKER" | "ADMIN" | "COUNCIL_OVERSEER";
    scopeGroupIds: string[];
    effectiveFrom: string;
    effectiveTo: string | null;
}, {
    branchId: string;
    groupId: string | null;
    id: string;
    personId: string;
    role: "VISITOR" | "MEMBER" | "RESIDENT_PASTOR" | "ACTING_RESIDENT_PASTOR" | "ASSISTANT_PASTOR" | "BACENTA_LEADER" | "BASONTA_LEADER" | "TREASURER" | "WORKER" | "ADMIN" | "COUNCIL_OVERSEER";
    scopeGroupIds: string[];
    effectiveFrom: string;
    effectiveTo: string | null;
}>;
export type RoleAssignmentResponseDto = z.infer<typeof roleAssignmentResponseSchema>;
export declare const GROUP_TYPE_VALUES: readonly ["PASTORAL_CARE", "MINISTRY"];
export declare const groupTypeSchema: z.ZodEnum<["PASTORAL_CARE", "MINISTRY"]>;
export type GroupTypeDto = z.infer<typeof groupTypeSchema>;
export declare const GROUP_LIFECYCLE_STATUS_VALUES: readonly ["ACTIVE", "SPLITTING", "MERGING", "ARCHIVED"];
export declare const groupLifecycleStatusSchema: z.ZodEnum<["ACTIVE", "SPLITTING", "MERGING", "ARCHIVED"]>;
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
export declare const createGroupSchema: z.ZodObject<{
    type: z.ZodEnum<["PASTORAL_CARE", "MINISTRY"]>;
    name: z.ZodString;
    meetingSchedule: z.ZodOptional<z.ZodString>;
    meetingLocation: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "PASTORAL_CARE" | "MINISTRY";
    name: string;
    meetingSchedule?: string | undefined;
    meetingLocation?: string | undefined;
    category?: string | undefined;
}, {
    type: "PASTORAL_CARE" | "MINISTRY";
    name: string;
    meetingSchedule?: string | undefined;
    meetingLocation?: string | undefined;
    category?: string | undefined;
}>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export declare const updateGroupSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    meetingSchedule: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    meetingLocation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lifecycleStatus: z.ZodOptional<z.ZodEnum<["ACTIVE", "SPLITTING", "MERGING", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    meetingSchedule?: string | null | undefined;
    meetingLocation?: string | null | undefined;
    category?: string | null | undefined;
    lifecycleStatus?: "ACTIVE" | "SPLITTING" | "MERGING" | "ARCHIVED" | undefined;
}, {
    name?: string | undefined;
    meetingSchedule?: string | null | undefined;
    meetingLocation?: string | null | undefined;
    category?: string | null | undefined;
    lifecycleStatus?: "ACTIVE" | "SPLITTING" | "MERGING" | "ARCHIVED" | undefined;
}>, {
    name?: string | undefined;
    meetingSchedule?: string | null | undefined;
    meetingLocation?: string | null | undefined;
    category?: string | null | undefined;
    lifecycleStatus?: "ACTIVE" | "SPLITTING" | "MERGING" | "ARCHIVED" | undefined;
}, {
    name?: string | undefined;
    meetingSchedule?: string | null | undefined;
    meetingLocation?: string | null | undefined;
    category?: string | null | undefined;
    lifecycleStatus?: "ACTIVE" | "SPLITTING" | "MERGING" | "ARCHIVED" | undefined;
}>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export declare const groupResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    type: z.ZodEnum<["PASTORAL_CARE", "MINISTRY"]>;
    name: z.ZodString;
    meetingSchedule: z.ZodNullable<z.ZodString>;
    meetingLocation: z.ZodNullable<z.ZodString>;
    category: z.ZodNullable<z.ZodString>;
    lifecycleStatus: z.ZodEnum<["ACTIVE", "SPLITTING", "MERGING", "ARCHIVED"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    type: "PASTORAL_CARE" | "MINISTRY";
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    meetingSchedule: string | null;
    meetingLocation: string | null;
    category: string | null;
    lifecycleStatus: "ACTIVE" | "SPLITTING" | "MERGING" | "ARCHIVED";
}, {
    branchId: string;
    type: "PASTORAL_CARE" | "MINISTRY";
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    meetingSchedule: string | null;
    meetingLocation: string | null;
    category: string | null;
    lifecycleStatus: "ACTIVE" | "SPLITTING" | "MERGING" | "ARCHIVED";
}>;
export type GroupResponseDto = z.infer<typeof groupResponseSchema>;
export declare const groupMembershipResponseSchema: z.ZodObject<{
    id: z.ZodString;
    personId: z.ZodString;
    groupId: z.ZodString;
    groupType: z.ZodEnum<["PASTORAL_CARE", "MINISTRY"]>;
    startedAt: z.ZodString;
    endedAt: z.ZodNullable<z.ZodString>;
    reason: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    groupId: string;
    id: string;
    personId: string;
    reason: string | null;
    startedAt: string;
    groupType: "PASTORAL_CARE" | "MINISTRY";
    endedAt: string | null;
}, {
    groupId: string;
    id: string;
    personId: string;
    reason: string | null;
    startedAt: string;
    groupType: "PASTORAL_CARE" | "MINISTRY";
    endedAt: string | null;
}>;
export type GroupMembershipResponseDto = z.infer<typeof groupMembershipResponseSchema>;
//# sourceMappingURL=people.schemas.d.ts.map