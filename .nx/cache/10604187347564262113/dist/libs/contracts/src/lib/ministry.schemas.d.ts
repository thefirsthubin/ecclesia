import { z } from 'zod';
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
export declare const createStaffingTargetSchema: z.ZodObject<{
    gatheringId: z.ZodString;
    groupId: z.ZodString;
    targetCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    groupId: string;
    gatheringId: string;
    targetCount: number;
}, {
    groupId: string;
    gatheringId: string;
    targetCount: number;
}>;
export type CreateStaffingTargetInput = z.infer<typeof createStaffingTargetSchema>;
/**
 * FR-MIN-03: the response embeds the live-computed adequacy alongside the
 * stored target - "compute-on-read," the same pattern Insights'
 * `PulseScoreService` already established, rather than a separate
 * `/adequacy` sub-route (mirrors Gatherings' `checkCompleteness` reusing
 * its parent resource's own `.read` action instead of inventing a new
 * one).
 */
export declare const staffingTargetResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    gatheringId: z.ZodString;
    groupId: z.ZodString;
    targetCount: z.ZodNumber;
    rosteredCount: z.ZodNumber;
    ratio: z.ZodNumber;
    isAdequate: z.ZodBoolean;
    createdByPersonId: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    groupId: string;
    createdByPersonId: string;
    gatheringId: string;
    targetCount: number;
    rosteredCount: number;
    ratio: number;
    isAdequate: boolean;
}, {
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    groupId: string;
    createdByPersonId: string;
    gatheringId: string;
    targetCount: number;
    rosteredCount: number;
    ratio: number;
    isAdequate: boolean;
}>;
export type StaffingTargetResponseDto = z.infer<typeof staffingTargetResponseSchema>;
/**
 * §16.3's "Worker availability self-service (H2)": "lets a worker mark
 * themselves unavailable for a date range." Date-only (`z.string().date()`),
 * matching `dateOfBirth`'s own convention in `people.schemas.ts` for a
 * Prisma `@db.Date` (not `@db.Timestamptz`) column - see
 * `db/schema.prisma`'s `WorkerAvailability` model.
 */
export declare const recordWorkerAvailabilitySchema: z.ZodEffects<z.ZodObject<{
    unavailableFrom: z.ZodString;
    unavailableTo: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    unavailableFrom: string;
    unavailableTo: string;
    reason?: string | undefined;
}, {
    unavailableFrom: string;
    unavailableTo: string;
    reason?: string | undefined;
}>, {
    unavailableFrom: string;
    unavailableTo: string;
    reason?: string | undefined;
}, {
    unavailableFrom: string;
    unavailableTo: string;
    reason?: string | undefined;
}>;
export type RecordWorkerAvailabilityInput = z.infer<typeof recordWorkerAvailabilitySchema>;
export declare const workerAvailabilityResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    personId: z.ZodString;
    unavailableFrom: z.ZodString;
    unavailableTo: z.ZodString;
    reason: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    branchId: string;
    createdAt: string;
    reason: string | null;
    personId: string;
    unavailableFrom: string;
    unavailableTo: string;
}, {
    id: string;
    branchId: string;
    createdAt: string;
    reason: string | null;
    personId: string;
    unavailableFrom: string;
    unavailableTo: string;
}>;
export type WorkerAvailabilityResponseDto = z.infer<typeof workerAvailabilityResponseSchema>;
/** `GET /ministry/groups/:groupId/roster` (FR-MIN-01/§16.3's "Basonta
 * roster view") - the underlying membership data is People's own
 * (`GroupMembership`), surfaced here through Ministry's exported
 * `GroupRosterService` consumer, not duplicated. */
export declare const rosterMemberResponseSchema: z.ZodObject<{
    personId: z.ZodString;
    startedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    personId: string;
    startedAt: string;
}, {
    personId: string;
    startedAt: string;
}>;
export type RosterMemberResponseDto = z.infer<typeof rosterMemberResponseSchema>;
export declare const rosterResponseSchema: z.ZodArray<z.ZodObject<{
    personId: z.ZodString;
    startedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    personId: string;
    startedAt: string;
}, {
    personId: string;
    startedAt: string;
}>, "many">;
/**
 * `GET /ministry/groups/:groupId/roster/overcommitment` (FR-MIN-04). See
 * `libs/domain/ministry`'s `overcommitment.ts` doc comment for why
 * `concurrentCommitmentCount` measures concurrent active Basonta
 * memberships, not literal concurrent Gathering commitments.
 */
export declare const overcommitmentFlagResponseSchema: z.ZodObject<{
    personId: z.ZodString;
    concurrentCommitmentCount: z.ZodNumber;
    threshold: z.ZodNumber;
    overcommitted: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    personId: string;
    concurrentCommitmentCount: number;
    threshold: number;
    overcommitted: true;
}, {
    personId: string;
    concurrentCommitmentCount: number;
    threshold: number;
    overcommitted: true;
}>;
export type OvercommitmentFlagResponseDto = z.infer<typeof overcommitmentFlagResponseSchema>;
export declare const overcommitmentFlagListResponseSchema: z.ZodArray<z.ZodObject<{
    personId: z.ZodString;
    concurrentCommitmentCount: z.ZodNumber;
    threshold: z.ZodNumber;
    overcommitted: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    personId: string;
    concurrentCommitmentCount: number;
    threshold: number;
    overcommitted: true;
}, {
    personId: string;
    concurrentCommitmentCount: number;
    threshold: number;
    overcommitted: true;
}>, "many">;
//# sourceMappingURL=ministry.schemas.d.ts.map