import { z } from 'zod';

/**
 * Shared Zod schemas for the Pastoral Care bounded context (PRD §13.2).
 * See `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */

export const POIMEN_STATUS_VALUES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'] as const;
export const poimenStatusSchema = z.enum(POIMEN_STATUS_VALUES);
export type PoimenStatusDto = z.infer<typeof poimenStatusSchema>;

/**
 * FR-PC-06: enrolling a candidate in Poimen training. No body beyond the
 * route's `:personId` is required - enrollment always starts at
 * `NOT_STARTED` (`db/schema.prisma`'s own `@default(NOT_STARTED)`), the
 * same "no client-supplied initial state" pattern `createPersonSchema`
 * already uses for `lifecycleStage`.
 */
export const enrollPoimenCandidateSchema = z.object({});
export type EnrollPoimenCandidateInput = z.infer<typeof enrollPoimenCandidateSchema>;

export const updatePoimenStatusSchema = z.object({
  status: poimenStatusSchema,
});
export type UpdatePoimenStatusInput = z.infer<typeof updatePoimenStatusSchema>;

export const poimenEnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  personId: z.string().uuid(),
  status: poimenStatusSchema,
  enrolledAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PoimenEnrollmentResponseDto = z.infer<typeof poimenEnrollmentResponseSchema>;

export const FOLLOW_UP_TASK_STATUS_VALUES = ['OPEN', 'ESCALATED', 'COMPLETED'] as const;
export const followUpTaskStatusSchema = z.enum(FOLLOW_UP_TASK_STATUS_VALUES);
export type FollowUpTaskStatusDto = z.infer<typeof followUpTaskStatusSchema>;

export const FOLLOW_UP_TASK_TRIGGER_VALUES = ['FIRST_TIME_GUEST', 'LAPSED_REENGAGEMENT', 'MANUAL'] as const;
export const followUpTaskTriggerSchema = z.enum(FOLLOW_UP_TASK_TRIGGER_VALUES);
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
export const createFollowUpTaskSchema = z.object({
  assignedToPersonId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  trigger: followUpTaskTriggerSchema.default('MANUAL'),
  dueAtOverride: z.string().datetime().optional(),
});
export type CreateFollowUpTaskInput = z.infer<typeof createFollowUpTaskSchema>;

/**
 * BR-PC-04: escalation names the target explicitly - resolving "the
 * assigned Person's organizational superior (typically Shepherd ->
 * Assistant Pastor)" automatically requires an org-hierarchy lookup this
 * module does not yet perform (see `PASTORAL_CARE_DESIGN_NOTES.md`), so
 * the caller supplies the target rather than the system inventing one.
 */
export const escalateFollowUpTaskSchema = z.object({
  escalatedToPersonId: z.string().uuid(),
});
export type EscalateFollowUpTaskInput = z.infer<typeof escalateFollowUpTaskSchema>;

export const followUpTaskResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  groupId: z.string().uuid().nullable(),
  personId: z.string().uuid(),
  assignedToPersonId: z.string().uuid(),
  status: followUpTaskStatusSchema,
  dueAt: z.string().nullable(),
  escalatedAt: z.string().nullable(),
  escalatedToPersonId: z.string().uuid().nullable(),
  createdByPersonId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
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
export const listFollowUpTasksQuerySchema = z.object({
  status: z
    .string()
    .trim()
    .min(1)
    .optional()
    .transform((value) => (value ? value.split(',').map((entry) => entry.trim()) : undefined))
    .pipe(z.array(followUpTaskStatusSchema).optional()),
});
export type ListFollowUpTasksQuery = z.infer<typeof listFollowUpTasksQuerySchema>;

/**
 * `GET /pastoral-care/follow-up-tasks` (Pastoral Care Web Admin sprint).
 * The group-scoped route above has no BRANCH-wide equivalent, the same
 * gap `listPeopleQuerySchema`/`GET /people` closed for the People module -
 * a BRANCH-scoped actor (Resident Pastor, Admin) holds
 * `pastoral_care.followup_task.read` at BRANCH scope but had no route
 * that could ever satisfy it without already knowing every Group id in
 * the Branch. `groupId` mirrors `listPeopleQuerySchema`'s own field
 * exactly: present for OWN_GROUP/CLUSTER-scoped actors naming their own
 * Group, absent for BRANCH-scoped actors to see the whole Branch.
 */
export const listFollowUpTasksForActorQuerySchema = listFollowUpTasksQuerySchema.extend({
  groupId: z.string().uuid().optional(),
});
export type ListFollowUpTasksForActorQuery = z.infer<typeof listFollowUpTasksForActorQuerySchema>;

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
export const SILENT_DRIFT_STATUS_VALUES = ['FLAGGED', 'RESOLVED', 'ESCALATED'] as const;
export const silentDriftStatusSchema = z.enum(SILENT_DRIFT_STATUS_VALUES);
export type SilentDriftStatusDto = z.infer<typeof silentDriftStatusSchema>;

export const silentDriftFlagResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  groupId: z.string().uuid(),
  personId: z.string().uuid(),
  attendanceMissedCount: z.number().int(),
  attendanceThreshold: z.number().int(),
  bacentaMissedCount: z.number().int(),
  bacentaThreshold: z.number().int(),
  status: silentDriftStatusSchema,
  assignedShepherdPersonId: z.string().uuid().nullable(),
  resolvedAt: z.string().nullable(),
  escalatedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type SilentDriftFlagResponseDto = z.infer<typeof silentDriftFlagResponseSchema>;

/** `GET /pastoral-care/groups/:groupId/silent-drift-flags`. Same
 * comma-separated-list convention as `listFollowUpTasksQuerySchema`;
 * defaults to the two still-open statuses (`FLAGGED,ESCALATED`) at the
 * service layer, not here, so the schema stays a pure shape check. */
export const listSilentDriftFlagsQuerySchema = z.object({
  status: z
    .string()
    .trim()
    .min(1)
    .optional()
    .transform((value) => (value ? value.split(',').map((entry) => entry.trim()) : undefined))
    .pipe(z.array(silentDriftStatusSchema).optional()),
});
export type ListSilentDriftFlagsQuery = z.infer<typeof listSilentDriftFlagsQuerySchema>;

/**
 * §16.2's pastoral notes capability, NFR-PRIV-01 permission-sensitive
 * (`pastoral_care.notes.*` explicitly DENIES ADMIN in
 * `libs/rbac/src/lib/permission-matrix.ts`, "configuration authority does
 * not imply pastoral-content access" - Blueprint §9.3's own worked
 * example). `db/schema.prisma`'s `PastoralNote` has no `updatedAt` -
 * immutable once written, so there is no update schema here.
 */
export const createPastoralNoteSchema = z.object({
  content: z.string().trim().min(1, 'content is required'),
});
export type CreatePastoralNoteInput = z.infer<typeof createPastoralNoteSchema>;

export const pastoralNoteResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  personId: z.string().uuid(),
  authorPersonId: z.string().uuid(),
  content: z.string(),
  createdAt: z.string(),
});
export type PastoralNoteResponseDto = z.infer<typeof pastoralNoteResponseSchema>;
