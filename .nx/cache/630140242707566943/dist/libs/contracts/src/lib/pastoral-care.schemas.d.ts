import { z } from 'zod';
/**
 * Shared Zod schemas for the Pastoral Care bounded context (PRD §13.2).
 * See `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */
export declare const POIMEN_STATUS_VALUES: readonly ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"];
export declare const poimenStatusSchema: z.ZodEnum<["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]>;
export type PoimenStatusDto = z.infer<typeof poimenStatusSchema>;
/**
 * FR-PC-06: enrolling a candidate in Poimen training. No body beyond the
 * route's `:personId` is required - enrollment always starts at
 * `NOT_STARTED` (`db/schema.prisma`'s own `@default(NOT_STARTED)`), the
 * same "no client-supplied initial state" pattern `createPersonSchema`
 * already uses for `lifecycleStage`.
 */
export declare const enrollPoimenCandidateSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type EnrollPoimenCandidateInput = z.infer<typeof enrollPoimenCandidateSchema>;
export declare const updatePoimenStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]>;
}, "strip", z.ZodTypeAny, {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
}, {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
}>;
export type UpdatePoimenStatusInput = z.infer<typeof updatePoimenStatusSchema>;
export declare const poimenEnrollmentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    personId: z.ZodString;
    status: z.ZodEnum<["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]>;
    enrolledAt: z.ZodNullable<z.ZodString>;
    completedAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    personId: string;
    enrolledAt: string | null;
    completedAt: string | null;
}, {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    personId: string;
    enrolledAt: string | null;
    completedAt: string | null;
}>;
export type PoimenEnrollmentResponseDto = z.infer<typeof poimenEnrollmentResponseSchema>;
export declare const FOLLOW_UP_TASK_STATUS_VALUES: readonly ["OPEN", "ESCALATED", "COMPLETED"];
export declare const followUpTaskStatusSchema: z.ZodEnum<["OPEN", "ESCALATED", "COMPLETED"]>;
export type FollowUpTaskStatusDto = z.infer<typeof followUpTaskStatusSchema>;
export declare const FOLLOW_UP_TASK_TRIGGER_VALUES: readonly ["FIRST_TIME_GUEST", "LAPSED_REENGAGEMENT", "MANUAL"];
export declare const followUpTaskTriggerSchema: z.ZodEnum<["FIRST_TIME_GUEST", "LAPSED_REENGAGEMENT", "MANUAL"]>;
export type FollowUpTaskTriggerDto = z.infer<typeof followUpTaskTriggerSchema>;
/**
 * FR-PC-03/FR-PC-04: creating a Follow-up task always requires an
 * explicit `assignedToPersonId` - PRD §19.1 step 3's "default rule
 * (geographic/Bacenta preference, or a rotation among Shepherds if no
 * preference given)" for the *automatic* FIRST_TIME_GUEST trigger has no
 * concrete, buildable algorithm specified in the PRD (no rotation-state
 * field exists anywhere in `db/schema.prisma`, and "geographic
 * preference" is not a captured Person field) - so this module does not
 * invent one. See `PASTORAL_CARE_DESIGN_NOTES.md`'s open question. This
 * schema covers explicit/manual creation only; `trigger` is optional and,
 * when supplied, only affects which SLA default
 * (`DEFAULT_FOLLOW_UP_SLA_DAYS`, `libs/domain/pastoral-care`) applies.
 */
export declare const createFollowUpTaskSchema: z.ZodObject<{
    assignedToPersonId: z.ZodString;
    groupId: z.ZodOptional<z.ZodString>;
    trigger: z.ZodDefault<z.ZodEnum<["FIRST_TIME_GUEST", "LAPSED_REENGAGEMENT", "MANUAL"]>>;
    dueAtOverride: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    assignedToPersonId: string;
    trigger: "FIRST_TIME_GUEST" | "LAPSED_REENGAGEMENT" | "MANUAL";
    groupId?: string | undefined;
    dueAtOverride?: string | undefined;
}, {
    assignedToPersonId: string;
    groupId?: string | undefined;
    trigger?: "FIRST_TIME_GUEST" | "LAPSED_REENGAGEMENT" | "MANUAL" | undefined;
    dueAtOverride?: string | undefined;
}>;
export type CreateFollowUpTaskInput = z.infer<typeof createFollowUpTaskSchema>;
/**
 * BR-PC-04: escalation names the target explicitly - resolving "the
 * assigned Person's organizational superior (typically Shepherd ->
 * Assistant Pastor)" automatically requires an org-hierarchy lookup this
 * module does not yet perform (see `PASTORAL_CARE_DESIGN_NOTES.md`), so
 * the caller supplies the target rather than the system inventing one.
 */
export declare const escalateFollowUpTaskSchema: z.ZodObject<{
    escalatedToPersonId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    escalatedToPersonId: string;
}, {
    escalatedToPersonId: string;
}>;
export type EscalateFollowUpTaskInput = z.infer<typeof escalateFollowUpTaskSchema>;
export declare const followUpTaskResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    groupId: z.ZodNullable<z.ZodString>;
    personId: z.ZodString;
    assignedToPersonId: z.ZodString;
    status: z.ZodEnum<["OPEN", "ESCALATED", "COMPLETED"]>;
    dueAt: z.ZodNullable<z.ZodString>;
    escalatedAt: z.ZodNullable<z.ZodString>;
    escalatedToPersonId: z.ZodNullable<z.ZodString>;
    createdByPersonId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "COMPLETED" | "OPEN" | "ESCALATED";
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    groupId: string | null;
    personId: string;
    createdByPersonId: string | null;
    assignedToPersonId: string;
    escalatedToPersonId: string | null;
    dueAt: string | null;
    escalatedAt: string | null;
}, {
    status: "COMPLETED" | "OPEN" | "ESCALATED";
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    groupId: string | null;
    personId: string;
    createdByPersonId: string | null;
    assignedToPersonId: string;
    escalatedToPersonId: string | null;
    dueAt: string | null;
    escalatedAt: string | null;
}>;
export type FollowUpTaskResponseDto = z.infer<typeof followUpTaskResponseSchema>;
/**
 * `GET /pastoral-care/groups/:groupId/follow-up-tasks` (§16.2's
 * "Follow-up task queue... sorted by SLA urgency" surface -
 * [Gap, Shepherd Dashboard sprint]: no list endpoint existed before this
 * sprint, only single-task CRUD by id - see
 * `apps/mobile/.../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 6). `status` accepts a comma-separated list so a caller can ask
 * for "everything still open" (`OPEN,ESCALATED`, this endpoint's default)
 * in one round trip rather than one request per status value.
 */
export declare const listFollowUpTasksQuerySchema: z.ZodObject<{
    status: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, string[] | undefined, string | undefined>, z.ZodOptional<z.ZodArray<z.ZodEnum<["OPEN", "ESCALATED", "COMPLETED"]>, "many">>>;
}, "strip", z.ZodTypeAny, {
    status?: ("COMPLETED" | "OPEN" | "ESCALATED")[] | undefined;
}, {
    status?: string | undefined;
}>;
export type ListFollowUpTasksQuery = z.infer<typeof listFollowUpTasksQuerySchema>;
/**
 * FR-PC-05/§15.8's decision tree output. `SilentDriftFlag` rows have
 * been written by `apps/worker`'s nightly `SilentDriftSweepJob` since the
 * Insights milestone (`db/schema.prisma`'s `silent_drift_flags` table),
 * but no HTTP surface read them until this sprint - see
 * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6. `attendanceMissedCount`/
 * `bacentaMissedCount` (against their respective thresholds) are the
 * literal "specific pattern" US-G3 requires be shown instead of a generic
 * "at risk" label.
 */
export declare const SILENT_DRIFT_STATUS_VALUES: readonly ["FLAGGED", "RESOLVED", "ESCALATED"];
export declare const silentDriftStatusSchema: z.ZodEnum<["FLAGGED", "RESOLVED", "ESCALATED"]>;
export type SilentDriftStatusDto = z.infer<typeof silentDriftStatusSchema>;
export declare const silentDriftFlagResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    groupId: z.ZodString;
    personId: z.ZodString;
    attendanceMissedCount: z.ZodNumber;
    attendanceThreshold: z.ZodNumber;
    bacentaMissedCount: z.ZodNumber;
    bacentaThreshold: z.ZodNumber;
    status: z.ZodEnum<["FLAGGED", "RESOLVED", "ESCALATED"]>;
    assignedShepherdPersonId: z.ZodNullable<z.ZodString>;
    resolvedAt: z.ZodNullable<z.ZodString>;
    escalatedAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "ESCALATED" | "FLAGGED" | "RESOLVED";
    id: string;
    branchId: string;
    createdAt: string;
    groupId: string;
    personId: string;
    resolvedAt: string | null;
    escalatedAt: string | null;
    attendanceMissedCount: number;
    attendanceThreshold: number;
    bacentaMissedCount: number;
    bacentaThreshold: number;
    assignedShepherdPersonId: string | null;
}, {
    status: "ESCALATED" | "FLAGGED" | "RESOLVED";
    id: string;
    branchId: string;
    createdAt: string;
    groupId: string;
    personId: string;
    resolvedAt: string | null;
    escalatedAt: string | null;
    attendanceMissedCount: number;
    attendanceThreshold: number;
    bacentaMissedCount: number;
    bacentaThreshold: number;
    assignedShepherdPersonId: string | null;
}>;
export type SilentDriftFlagResponseDto = z.infer<typeof silentDriftFlagResponseSchema>;
/** `GET /pastoral-care/groups/:groupId/silent-drift-flags`. Same
 * comma-separated-list convention as `listFollowUpTasksQuerySchema`;
 * defaults to the two still-open statuses (`FLAGGED,ESCALATED`) at the
 * service layer, not here, so the schema stays a pure shape check. */
export declare const listSilentDriftFlagsQuerySchema: z.ZodObject<{
    status: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, string[] | undefined, string | undefined>, z.ZodOptional<z.ZodArray<z.ZodEnum<["FLAGGED", "RESOLVED", "ESCALATED"]>, "many">>>;
}, "strip", z.ZodTypeAny, {
    status?: ("ESCALATED" | "FLAGGED" | "RESOLVED")[] | undefined;
}, {
    status?: string | undefined;
}>;
export type ListSilentDriftFlagsQuery = z.infer<typeof listSilentDriftFlagsQuerySchema>;
/**
 * §16.2's pastoral notes capability, NFR-PRIV-01 permission-sensitive
 * (`pastoral_care.notes.*` explicitly DENIES ADMIN in
 * `libs/rbac/src/lib/permission-matrix.ts`, "configuration authority does
 * not imply pastoral-content access" - Blueprint §9.3's own worked
 * example). `db/schema.prisma`'s `PastoralNote` has no `updatedAt` -
 * immutable once written, so there is no update schema here.
 */
export declare const createPastoralNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export type CreatePastoralNoteInput = z.infer<typeof createPastoralNoteSchema>;
export declare const pastoralNoteResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    personId: z.ZodString;
    authorPersonId: z.ZodString;
    content: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    branchId: string;
    createdAt: string;
    personId: string;
    content: string;
    authorPersonId: string;
}, {
    id: string;
    branchId: string;
    createdAt: string;
    personId: string;
    content: string;
    authorPersonId: string;
}>;
export type PastoralNoteResponseDto = z.infer<typeof pastoralNoteResponseSchema>;
//# sourceMappingURL=pastoral-care.schemas.d.ts.map