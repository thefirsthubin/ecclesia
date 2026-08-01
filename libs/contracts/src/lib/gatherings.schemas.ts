import { z } from 'zod';

/**
 * Shared Zod schemas for the Gatherings bounded context (PRD §13.4). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */

export const GATHERING_STATUS_VALUES = ['SCHEDULED', 'CANCELLED', 'COMPLETED'] as const;
export const gatheringStatusSchema = z.enum(GATHERING_STATUS_VALUES);
export type GatheringStatusDto = z.infer<typeof gatheringStatusSchema>;

export const ATTENDANCE_STATUS_VALUES = ['PRESENT', 'ABSENT', 'EXCUSED'] as const;
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUS_VALUES);
export type AttendanceStatusDto = z.infer<typeof attendanceStatusSchema>;

/**
 * FR-GTH-02. `type` is a free string, not an enum - FR-GTH-01/US-D4:
 * gathering types are Branch-configurable
 * (`platform.configurations.gathering_types`), not fixed at the schema
 * level. `recurrenceRule`'s format is unspecified by the PRD (see
 * `libs/domain/gatherings/README.md`) - accepted here as an opaque
 * string, not parsed or validated by this schema.
 */
export const createGatheringSeriesSchema = z.object({
  type: z.string().trim().min(1, 'type is required'),
  groupId: z.string().uuid().optional(),
  recurrenceRule: z.string().trim().min(1).optional(),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
});
export type CreateGatheringSeriesInput = z.infer<typeof createGatheringSeriesSchema>;

export const gatheringSeriesResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  groupId: z.string().uuid().nullable(),
  type: z.string(),
  recurrenceRule: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  createdByPersonId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GatheringSeriesResponseDto = z.infer<typeof gatheringSeriesResponseSchema>;

/**
 * FR-GTH-01/§12.4. `ownerGroupId` is omitted for a Branch-wide Gathering
 * (e.g. Sunday Service) and required in practice for a Bacenta/Basonta
 * Meeting - PRD §12.4's own implementation note states this per-type
 * requirement narratively ("`BacentaMeeting.ownerGroupId` is mandatory
 * while `SundayFirstService.ownerGroupId` is null") but does not tie it
 * to a specific `type` string value (types are Branch-configurable, not a
 * fixed set this schema could switch on) - so this is not enforced here,
 * only documented; the resource-context guard resolves scope from
 * whichever is actually provided.
 */
export const createGatheringSchema = z.object({
  type: z.string().trim().min(1, 'type is required'),
  ownerGroupId: z.string().uuid().optional(),
  seriesId: z.string().uuid().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
  venue: z.string().trim().min(1).optional(),
  config: z.record(z.unknown()).optional(),
});
export type CreateGatheringInput = z.infer<typeof createGatheringSchema>;

/**
 * §12.4's edge case: "any one of which can be individually cancelled,
 * rescheduled, or have its attendance recorded without altering the
 * series definition." `status` transitions are validated against
 * `libs/domain/gatherings`'s `checkGatheringStatusTransition` server-side,
 * not trusted from the client.
 */
export const updateGatheringSchema = z
  .object({
    scheduledStart: z.string().datetime().optional(),
    scheduledEnd: z.string().datetime().nullable().optional(),
    venue: z.string().trim().min(1).nullable().optional(),
    status: gatheringStatusSchema.optional(),
    config: z.record(z.unknown()).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
export type UpdateGatheringInput = z.infer<typeof updateGatheringSchema>;

export const gatheringResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  ownerGroupId: z.string().uuid().nullable(),
  seriesId: z.string().uuid().nullable(),
  type: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string().nullable(),
  venue: z.string().nullable(),
  status: gatheringStatusSchema,
  config: z.record(z.unknown()).nullable(),
  createdByPersonId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GatheringResponseDto = z.infer<typeof gatheringResponseSchema>;

/** FR-GTH-03. One record per Person per Gathering instance
 * (`db/schema.prisma`'s `@@unique([gatheringId, personId])`) - recording
 * again for the same pair overwrites the prior status (a correction, e.g.
 * marked absent by mistake), not a second record. */
export const recordAttendanceSchema = z.object({
  personId: z.string().uuid(),
  status: attendanceStatusSchema,
});
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;

export const attendanceRecordResponseSchema = z.object({
  id: z.string().uuid(),
  gatheringId: z.string().uuid(),
  personId: z.string().uuid(),
  branchId: z.string().uuid(),
  status: attendanceStatusSchema,
  recordedByPersonId: z.string().uuid(),
  recordedAt: z.string(),
});
export type AttendanceRecordResponseDto = z.infer<typeof attendanceRecordResponseSchema>;

/**
 * FR-GTH-04/BR-GTH-03. `submittedData` mirrors `db/schema.prisma`'s own
 * Json column - §16.1's minimal example fields ("name, phone, how they
 * heard about the church") accepted as free-form data, not a pinned
 * shape, matching the schema's own disclosed looseness. `firstTimeGuest`
 * lets the capturing actor confirm "this is their first attendance"
 * (FR-GTH-04: Visitor vs FirstTimeGuest at creation) - a fact only a
 * human at the point of capture can know, not something this schema
 * infers. `bacentaPreferenceGroupId` is US-A2's "Bacenta preference" -
 * when supplied, the service resolves that Bacenta's current Shepherd as
 * the Follow-up task's assignee; when omitted, no Follow-up task is
 * auto-created (see `GATHERINGS_DESIGN_NOTES.md`'s open question on the
 * unspecified "rotation among Shepherds" fallback).
 */
export const submitVisitorIntakeSchema = z.object({
  gatheringId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  phone: z.string().trim().min(1).optional(),
  howTheyHeard: z.string().trim().min(1).optional(),
  firstTimeGuest: z.boolean().default(false),
  bacentaPreferenceGroupId: z.string().uuid().optional(),
});
export type SubmitVisitorIntakeInput = z.infer<typeof submitVisitorIntakeSchema>;

export const visitorIntakeResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  gatheringId: z.string().uuid().nullable(),
  personId: z.string().uuid().nullable(),
  submittedData: z.record(z.unknown()),
  createdAt: z.string(),
  followUpTaskCreated: z.boolean(),
});
export type VisitorIntakeResponseDto = z.infer<typeof visitorIntakeResponseSchema>;
