"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorIntakeResponseSchema = exports.submitVisitorIntakeSchema = exports.attendanceRecordResponseSchema = exports.recordAttendanceSchema = exports.listGatheringsQuerySchema = exports.gatheringResponseSchema = exports.updateGatheringSchema = exports.createGatheringSchema = exports.gatheringSeriesResponseSchema = exports.createGatheringSeriesSchema = exports.attendanceStatusSchema = exports.ATTENDANCE_STATUS_VALUES = exports.gatheringStatusSchema = exports.GATHERING_STATUS_VALUES = void 0;
const zod_1 = require("zod");
/**
 * Shared Zod schemas for the Gatherings bounded context (PRD §13.4). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */
exports.GATHERING_STATUS_VALUES = ['SCHEDULED', 'CANCELLED', 'COMPLETED'];
exports.gatheringStatusSchema = zod_1.z.enum(exports.GATHERING_STATUS_VALUES);
exports.ATTENDANCE_STATUS_VALUES = ['PRESENT', 'ABSENT', 'EXCUSED'];
exports.attendanceStatusSchema = zod_1.z.enum(exports.ATTENDANCE_STATUS_VALUES);
/**
 * FR-GTH-02. `type` is a free string, not an enum - FR-GTH-01/US-D4:
 * gathering types are Branch-configurable
 * (`platform.configurations.gathering_types`), not fixed at the schema
 * level. `recurrenceRule`'s format is unspecified by the PRD (see
 * `libs/domain/gatherings/README.md`) - accepted here as an opaque
 * string, not parsed or validated by this schema.
 */
exports.createGatheringSeriesSchema = zod_1.z.object({
    type: zod_1.z.string().trim().min(1, 'type is required'),
    groupId: zod_1.z.string().uuid().optional(),
    recurrenceRule: zod_1.z.string().trim().min(1).optional(),
    startDate: zod_1.z.string().date(),
    endDate: zod_1.z.string().date().optional(),
});
exports.gatheringSeriesResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid().nullable(),
    type: zod_1.z.string(),
    recurrenceRule: zod_1.z.string().nullable(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().nullable(),
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
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
exports.createGatheringSchema = zod_1.z.object({
    type: zod_1.z.string().trim().min(1, 'type is required'),
    ownerGroupId: zod_1.z.string().uuid().optional(),
    seriesId: zod_1.z.string().uuid().optional(),
    scheduledStart: zod_1.z.string().datetime(),
    scheduledEnd: zod_1.z.string().datetime().optional(),
    venue: zod_1.z.string().trim().min(1).optional(),
    config: zod_1.z.record(zod_1.z.unknown()).optional(),
});
/**
 * §12.4's edge case: "any one of which can be individually cancelled,
 * rescheduled, or have its attendance recorded without altering the
 * series definition." `status` transitions are validated against
 * `libs/domain/gatherings`'s `checkGatheringStatusTransition` server-side,
 * not trusted from the client.
 */
exports.updateGatheringSchema = zod_1.z
    .object({
    scheduledStart: zod_1.z.string().datetime().optional(),
    scheduledEnd: zod_1.z.string().datetime().nullable().optional(),
    venue: zod_1.z.string().trim().min(1).nullable().optional(),
    status: exports.gatheringStatusSchema.optional(),
    config: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
})
    .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
exports.gatheringResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    ownerGroupId: zod_1.z.string().uuid().nullable(),
    seriesId: zod_1.z.string().uuid().nullable(),
    type: zod_1.z.string(),
    scheduledStart: zod_1.z.string(),
    scheduledEnd: zod_1.z.string().nullable(),
    venue: zod_1.z.string().nullable(),
    status: exports.gatheringStatusSchema,
    config: zod_1.z.record(zod_1.z.unknown()).nullable(),
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
/**
 * `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint -
 * [Gap]: only `GET /gatherings/:id` existed before, no way to find "my
 * Bacenta's next/last meeting" without already knowing its id. See
 * `apps/mobile/.../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 6). `ownerGroupId` is required - a Branch-wide, ungrouped listing
 * is out of scope for this sprint's one caller (the dashboard's
 * Today's-Meeting/Attendance-Summary cards, both Bacenta-scoped).
 * `from`/`to` default to "now through 30 days out" at the service layer,
 * not here.
 */
exports.listGatheringsQuerySchema = zod_1.z.object({
    ownerGroupId: zod_1.z.string().uuid(),
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
});
/** FR-GTH-03. One record per Person per Gathering instance
 * (`db/schema.prisma`'s `@@unique([gatheringId, personId])`) - recording
 * again for the same pair overwrites the prior status (a correction, e.g.
 * marked absent by mistake), not a second record. */
exports.recordAttendanceSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
    status: exports.attendanceStatusSchema,
});
exports.attendanceRecordResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    gatheringId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    status: exports.attendanceStatusSchema,
    recordedByPersonId: zod_1.z.string().uuid(),
    recordedAt: zod_1.z.string(),
});
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
exports.submitVisitorIntakeSchema = zod_1.z.object({
    gatheringId: zod_1.z.string().uuid().optional(),
    firstName: zod_1.z.string().trim().min(1, 'firstName is required'),
    lastName: zod_1.z.string().trim().min(1, 'lastName is required'),
    phone: zod_1.z.string().trim().min(1).optional(),
    howTheyHeard: zod_1.z.string().trim().min(1).optional(),
    firstTimeGuest: zod_1.z.boolean().default(false),
    bacentaPreferenceGroupId: zod_1.z.string().uuid().optional(),
});
exports.visitorIntakeResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    gatheringId: zod_1.z.string().uuid().nullable(),
    personId: zod_1.z.string().uuid().nullable(),
    submittedData: zod_1.z.record(zod_1.z.unknown()),
    createdAt: zod_1.z.string(),
    followUpTaskCreated: zod_1.z.boolean(),
});
//# sourceMappingURL=gatherings.schemas.js.map