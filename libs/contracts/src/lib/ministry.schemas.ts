import { z } from 'zod';

/**
 * Shared Zod schemas for the Ministry bounded context (PRD §13.3). See
 * `people.schemas.ts`'s own doc comment for why enums/shapes are
 * re-declared here rather than imported from `libs/domain/ministry` -
 * `libs/contracts` is a leaf library and must not depend on a domain
 * library.
 */

/// [PRD-DERIVED] FR-MIN-02: "define a staffing target for a specific
/// upcoming Gathering" - a positive count, not a ratio or percentage.
const targetCountSchema = z.number().int().positive();

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
export const createStaffingTargetSchema = z.object({
  gatheringId: z.string().uuid(),
  groupId: z.string().uuid(),
  targetCount: targetCountSchema,
});
export type CreateStaffingTargetInput = z.infer<typeof createStaffingTargetSchema>;

/**
 * FR-MIN-03: the response embeds the live-computed adequacy alongside the
 * stored target - "compute-on-read," the same pattern Insights'
 * `PulseScoreService` already established, rather than a separate
 * `/adequacy` sub-route (mirrors Gatherings' `checkCompleteness` reusing
 * its parent resource's own `.read` action instead of inventing a new
 * one).
 */
export const staffingTargetResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  gatheringId: z.string().uuid(),
  groupId: z.string().uuid(),
  targetCount: z.number().int(),
  rosteredCount: z.number().int(),
  ratio: z.number(),
  isAdequate: z.boolean(),
  createdByPersonId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type StaffingTargetResponseDto = z.infer<typeof staffingTargetResponseSchema>;
/** `[Remaining Engineering Sprint, Milestone 11]` `GET /ministry/staffing-targets?groupId=`'s
 * response shape - the same `z.array(...)` convention `rosterResponseSchema`/
 * `overcommitmentFlagListResponseSchema` below already use for their own list endpoints. */
export const staffingTargetListResponseSchema = z.array(staffingTargetResponseSchema);

/**
 * §16.3's "Worker availability self-service (H2)": "lets a worker mark
 * themselves unavailable for a date range." Date-only (`z.string().date()`),
 * matching `dateOfBirth`'s own convention in `people.schemas.ts` for a
 * Prisma `@db.Date` (not `@db.Timestamptz`) column - see
 * `db/schema.prisma`'s `WorkerAvailability` model.
 */
export const recordWorkerAvailabilitySchema = z
  .object({
    unavailableFrom: z.string().date(),
    unavailableTo: z.string().date(),
    reason: z.string().optional(),
  })
  .refine((value) => value.unavailableFrom <= value.unavailableTo, {
    message: 'unavailableFrom must not be after unavailableTo',
    path: ['unavailableTo'],
  });
export type RecordWorkerAvailabilityInput = z.infer<typeof recordWorkerAvailabilitySchema>;

export const workerAvailabilityResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  personId: z.string().uuid(),
  unavailableFrom: z.string(),
  unavailableTo: z.string(),
  reason: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type WorkerAvailabilityResponseDto = z.infer<typeof workerAvailabilityResponseSchema>;

/** `GET /ministry/groups/:groupId/roster` (FR-MIN-01/§16.3's "Basonta
 * roster view") - the underlying membership data is People's own
 * (`GroupMembership`), surfaced here through Ministry's exported
 * `GroupRosterService` consumer, not duplicated. */
export const rosterMemberResponseSchema = z.object({
  personId: z.string().uuid(),
  startedAt: z.string().datetime(),
});
export type RosterMemberResponseDto = z.infer<typeof rosterMemberResponseSchema>;
export const rosterResponseSchema = z.array(rosterMemberResponseSchema);

/**
 * `GET /ministry/groups/:groupId/roster/overcommitment` (FR-MIN-04). See
 * `libs/domain/ministry`'s `overcommitment.ts` doc comment for why
 * `concurrentCommitmentCount` measures concurrent active Basonta
 * memberships, not literal concurrent Gathering commitments.
 */
export const overcommitmentFlagResponseSchema = z.object({
  personId: z.string().uuid(),
  concurrentCommitmentCount: z.number().int(),
  threshold: z.number().int(),
  overcommitted: z.literal(true),
});
export type OvercommitmentFlagResponseDto = z.infer<typeof overcommitmentFlagResponseSchema>;
export const overcommitmentFlagListResponseSchema = z.array(overcommitmentFlagResponseSchema);
