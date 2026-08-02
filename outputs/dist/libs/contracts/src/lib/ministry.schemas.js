"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overcommitmentFlagListResponseSchema = exports.overcommitmentFlagResponseSchema = exports.rosterResponseSchema = exports.rosterMemberResponseSchema = exports.workerAvailabilityResponseSchema = exports.recordWorkerAvailabilitySchema = exports.staffingTargetResponseSchema = exports.createStaffingTargetSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared Zod schemas for the Ministry bounded context (PRD §13.3). See
 * `people.schemas.ts`'s own doc comment for why enums/shapes are
 * re-declared here rather than imported from `libs/domain/ministry` -
 * `libs/contracts` is a leaf library and must not depend on a domain
 * library.
 */
/// [PRD-DERIVED] FR-MIN-02: "define a staffing target for a specific
/// upcoming Gathering" - a positive count, not a ratio or percentage.
const targetCountSchema = zod_1.z.number().int().positive();
/**
 * FR-MIN-02: set a staffing target against one (Gathering, Basonta) pair.
 * `db/schema.prisma`'s `@@unique([gatheringId, groupId])` makes this an
 * upsert at the repository layer (`StaffingTargetRepository.upsert()`) -
 * re-submitting for the same pair corrects the existing target rather
 * than erroring, the same "re-recording is a correction, not a
 * duplicate" precedent `recordAttendanceSchema`/
 * `AttendanceRecordRepository.upsert()` already established. No separate
 * update schema/action exists - see `libs/rbac/src/lib/actions.ts`'s doc
 * comment on `ministry.staffing_target.create`.
 */
exports.createStaffingTargetSchema = zod_1.z.object({
    gatheringId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    targetCount: targetCountSchema,
});
/**
 * FR-MIN-03: the response embeds the live-computed adequacy alongside the
 * stored target - "compute-on-read," the same pattern Insights'
 * `PulseScoreService` already established, rather than a separate
 * `/adequacy` sub-route (mirrors Gatherings' `checkCompleteness` reusing
 * its parent resource's own `.read` action instead of inventing a new
 * one).
 */
exports.staffingTargetResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    gatheringId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    targetCount: zod_1.z.number().int(),
    rosteredCount: zod_1.z.number().int(),
    ratio: zod_1.z.number(),
    isAdequate: zod_1.z.boolean(),
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
/**
 * §16.3's "Worker availability self-service (H2)": "lets a worker mark
 * themselves unavailable for a date range." Date-only (`z.string().date()`),
 * matching `dateOfBirth`'s own convention in `people.schemas.ts` for a
 * Prisma `@db.Date` (not `@db.Timestamptz`) column - see
 * `db/schema.prisma`'s `WorkerAvailability` model.
 */
exports.recordWorkerAvailabilitySchema = zod_1.z
    .object({
    unavailableFrom: zod_1.z.string().date(),
    unavailableTo: zod_1.z.string().date(),
    reason: zod_1.z.string().optional(),
})
    .refine((value) => value.unavailableFrom <= value.unavailableTo, {
    message: 'unavailableFrom must not be after unavailableTo',
    path: ['unavailableTo'],
});
exports.workerAvailabilityResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    unavailableFrom: zod_1.z.string(),
    unavailableTo: zod_1.z.string(),
    reason: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
});
/** `GET /ministry/groups/:groupId/roster` (FR-MIN-01/§16.3's "Basonta
 * roster view") - the underlying membership data is People's own
 * (`GroupMembership`), surfaced here through Ministry's exported
 * `GroupRosterService` consumer, not duplicated. */
exports.rosterMemberResponseSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    startedAt: zod_1.z.string().datetime(),
});
exports.rosterResponseSchema = zod_1.z.array(exports.rosterMemberResponseSchema);
/**
 * `GET /ministry/groups/:groupId/roster/overcommitment` (FR-MIN-04). See
 * `libs/domain/ministry`'s `overcommitment.ts` doc comment for why
 * `concurrentCommitmentCount` measures concurrent active Basonta
 * memberships, not literal concurrent Gathering commitments.
 */
exports.overcommitmentFlagResponseSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    concurrentCommitmentCount: zod_1.z.number().int(),
    threshold: zod_1.z.number().int(),
    overcommitted: zod_1.z.literal(true),
});
exports.overcommitmentFlagListResponseSchema = zod_1.z.array(exports.overcommitmentFlagResponseSchema);
//# sourceMappingURL=ministry.schemas.js.map