"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pastoralNoteResponseSchema = exports.createPastoralNoteSchema = exports.listSilentDriftFlagsQuerySchema = exports.silentDriftFlagResponseSchema = exports.silentDriftStatusSchema = exports.SILENT_DRIFT_STATUS_VALUES = exports.listFollowUpTasksQuerySchema = exports.followUpTaskResponseSchema = exports.escalateFollowUpTaskSchema = exports.createFollowUpTaskSchema = exports.followUpTaskTriggerSchema = exports.FOLLOW_UP_TASK_TRIGGER_VALUES = exports.followUpTaskStatusSchema = exports.FOLLOW_UP_TASK_STATUS_VALUES = exports.poimenEnrollmentResponseSchema = exports.updatePoimenStatusSchema = exports.enrollPoimenCandidateSchema = exports.poimenStatusSchema = exports.POIMEN_STATUS_VALUES = void 0;
const zod_1 = require("zod");
/**
 * Shared Zod schemas for the Pastoral Care bounded context (PRD §13.2).
 * See `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */
exports.POIMEN_STATUS_VALUES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE'];
exports.poimenStatusSchema = zod_1.z.enum(exports.POIMEN_STATUS_VALUES);
/**
 * FR-PC-06: enrolling a candidate in Poimen training. No body beyond the
 * route's `:personId` is required - enrollment always starts at
 * `NOT_STARTED` (`db/schema.prisma`'s own `@default(NOT_STARTED)`), the
 * same "no client-supplied initial state" pattern `createPersonSchema`
 * already uses for `lifecycleStage`.
 */
exports.enrollPoimenCandidateSchema = zod_1.z.object({});
exports.updatePoimenStatusSchema = zod_1.z.object({
    status: exports.poimenStatusSchema,
});
exports.poimenEnrollmentResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    status: exports.poimenStatusSchema,
    enrolledAt: zod_1.z.string().nullable(),
    completedAt: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.FOLLOW_UP_TASK_STATUS_VALUES = ['OPEN', 'ESCALATED', 'COMPLETED'];
exports.followUpTaskStatusSchema = zod_1.z.enum(exports.FOLLOW_UP_TASK_STATUS_VALUES);
exports.FOLLOW_UP_TASK_TRIGGER_VALUES = ['FIRST_TIME_GUEST', 'LAPSED_REENGAGEMENT', 'MANUAL'];
exports.followUpTaskTriggerSchema = zod_1.z.enum(exports.FOLLOW_UP_TASK_TRIGGER_VALUES);
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
exports.createFollowUpTaskSchema = zod_1.z.object({
    assignedToPersonId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().optional(),
    trigger: exports.followUpTaskTriggerSchema.default('MANUAL'),
    dueAtOverride: zod_1.z.string().datetime().optional(),
});
/**
 * BR-PC-04: escalation names the target explicitly - resolving "the
 * assigned Person's organizational superior (typically Shepherd ->
 * Assistant Pastor)" automatically requires an org-hierarchy lookup this
 * module does not yet perform (see `PASTORAL_CARE_DESIGN_NOTES.md`), so
 * the caller supplies the target rather than the system inventing one.
 */
exports.escalateFollowUpTaskSchema = zod_1.z.object({
    escalatedToPersonId: zod_1.z.string().uuid(),
});
exports.followUpTaskResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().nullable(),
    personId: zod_1.z.string().uuid(),
    assignedToPersonId: zod_1.z.string().uuid(),
    status: exports.followUpTaskStatusSchema,
    dueAt: zod_1.z.string().nullable(),
    escalatedAt: zod_1.z.string().nullable(),
    escalatedToPersonId: zod_1.z.string().uuid().nullable(),
    createdByPersonId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
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
exports.listFollowUpTasksQuerySchema = zod_1.z.object({
    status: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .transform((value) => (value ? value.split(',').map((entry) => entry.trim()) : undefined))
        .pipe(zod_1.z.array(exports.followUpTaskStatusSchema).optional()),
});
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
exports.SILENT_DRIFT_STATUS_VALUES = ['FLAGGED', 'RESOLVED', 'ESCALATED'];
exports.silentDriftStatusSchema = zod_1.z.enum(exports.SILENT_DRIFT_STATUS_VALUES);
exports.silentDriftFlagResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    attendanceMissedCount: zod_1.z.number().int(),
    attendanceThreshold: zod_1.z.number().int(),
    bacentaMissedCount: zod_1.z.number().int(),
    bacentaThreshold: zod_1.z.number().int(),
    status: exports.silentDriftStatusSchema,
    assignedShepherdPersonId: zod_1.z.string().uuid().nullable(),
    resolvedAt: zod_1.z.string().nullable(),
    escalatedAt: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
});
/** `GET /pastoral-care/groups/:groupId/silent-drift-flags`. Same
 * comma-separated-list convention as `listFollowUpTasksQuerySchema`;
 * defaults to the two still-open statuses (`FLAGGED,ESCALATED`) at the
 * service layer, not here, so the schema stays a pure shape check. */
exports.listSilentDriftFlagsQuerySchema = zod_1.z.object({
    status: zod_1.z
        .string()
        .trim()
        .min(1)
        .optional()
        .transform((value) => (value ? value.split(',').map((entry) => entry.trim()) : undefined))
        .pipe(zod_1.z.array(exports.silentDriftStatusSchema).optional()),
});
/**
 * §16.2's pastoral notes capability, NFR-PRIV-01 permission-sensitive
 * (`pastoral_care.notes.*` explicitly DENIES ADMIN in
 * `libs/rbac/src/lib/permission-matrix.ts`, "configuration authority does
 * not imply pastoral-content access" - Blueprint §9.3's own worked
 * example). `db/schema.prisma`'s `PastoralNote` has no `updatedAt` -
 * immutable once written, so there is no update schema here.
 */
exports.createPastoralNoteSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, 'content is required'),
});
exports.pastoralNoteResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    authorPersonId: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    createdAt: zod_1.z.string(),
});
//# sourceMappingURL=pastoral-care.schemas.js.map