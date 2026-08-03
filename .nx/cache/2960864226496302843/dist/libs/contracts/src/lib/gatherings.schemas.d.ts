import { z } from 'zod';
/**
 * Shared Zod schemas for the Gatherings bounded context (PRD §13.4). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */
export declare const GATHERING_STATUS_VALUES: readonly ["SCHEDULED", "CANCELLED", "COMPLETED"];
export declare const gatheringStatusSchema: z.ZodEnum<["SCHEDULED", "CANCELLED", "COMPLETED"]>;
export type GatheringStatusDto = z.infer<typeof gatheringStatusSchema>;
export declare const ATTENDANCE_STATUS_VALUES: readonly ["PRESENT", "ABSENT", "EXCUSED"];
export declare const attendanceStatusSchema: z.ZodEnum<["PRESENT", "ABSENT", "EXCUSED"]>;
export type AttendanceStatusDto = z.infer<typeof attendanceStatusSchema>;
/**
 * FR-GTH-02. `type` is a free string, not an enum - FR-GTH-01/US-D4:
 * gathering types are Branch-configurable
 * (`platform.configurations.gathering_types`), not fixed at the schema
 * level. `recurrenceRule`'s format is unspecified by the PRD (see
 * `libs/domain/gatherings/README.md`) - accepted here as an opaque
 * string, not parsed or validated by this schema.
 */
export declare const createGatheringSeriesSchema: z.ZodObject<{
    type: z.ZodString;
    groupId: z.ZodOptional<z.ZodString>;
    recurrenceRule: z.ZodOptional<z.ZodString>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    startDate: string;
    groupId?: string | undefined;
    recurrenceRule?: string | undefined;
    endDate?: string | undefined;
}, {
    type: string;
    startDate: string;
    groupId?: string | undefined;
    recurrenceRule?: string | undefined;
    endDate?: string | undefined;
}>;
export type CreateGatheringSeriesInput = z.infer<typeof createGatheringSeriesSchema>;
export declare const gatheringSeriesResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    groupId: z.ZodNullable<z.ZodString>;
    type: z.ZodString;
    recurrenceRule: z.ZodNullable<z.ZodString>;
    startDate: z.ZodString;
    endDate: z.ZodNullable<z.ZodString>;
    createdByPersonId: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    type: string;
    groupId: string | null;
    recurrenceRule: string | null;
    startDate: string;
    endDate: string | null;
    id: string;
    createdByPersonId: string;
    createdAt: string;
    updatedAt: string;
}, {
    branchId: string;
    type: string;
    groupId: string | null;
    recurrenceRule: string | null;
    startDate: string;
    endDate: string | null;
    id: string;
    createdByPersonId: string;
    createdAt: string;
    updatedAt: string;
}>;
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
export declare const createGatheringSchema: z.ZodObject<{
    type: z.ZodString;
    ownerGroupId: z.ZodOptional<z.ZodString>;
    seriesId: z.ZodOptional<z.ZodString>;
    scheduledStart: z.ZodString;
    scheduledEnd: z.ZodOptional<z.ZodString>;
    venue: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    scheduledStart: string;
    ownerGroupId?: string | undefined;
    seriesId?: string | undefined;
    scheduledEnd?: string | undefined;
    venue?: string | undefined;
    config?: Record<string, unknown> | undefined;
}, {
    type: string;
    scheduledStart: string;
    ownerGroupId?: string | undefined;
    seriesId?: string | undefined;
    scheduledEnd?: string | undefined;
    venue?: string | undefined;
    config?: Record<string, unknown> | undefined;
}>;
export type CreateGatheringInput = z.infer<typeof createGatheringSchema>;
/**
 * §12.4's edge case: "any one of which can be individually cancelled,
 * rescheduled, or have its attendance recorded without altering the
 * series definition." `status` transitions are validated against
 * `libs/domain/gatherings`'s `checkGatheringStatusTransition` server-side,
 * not trusted from the client.
 */
export declare const updateGatheringSchema: z.ZodEffects<z.ZodObject<{
    scheduledStart: z.ZodOptional<z.ZodString>;
    scheduledEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    venue: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["SCHEDULED", "CANCELLED", "COMPLETED"]>>;
    config: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | undefined;
    scheduledStart?: string | undefined;
    scheduledEnd?: string | null | undefined;
    venue?: string | null | undefined;
    config?: Record<string, unknown> | null | undefined;
}, {
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | undefined;
    scheduledStart?: string | undefined;
    scheduledEnd?: string | null | undefined;
    venue?: string | null | undefined;
    config?: Record<string, unknown> | null | undefined;
}>, {
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | undefined;
    scheduledStart?: string | undefined;
    scheduledEnd?: string | null | undefined;
    venue?: string | null | undefined;
    config?: Record<string, unknown> | null | undefined;
}, {
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED" | undefined;
    scheduledStart?: string | undefined;
    scheduledEnd?: string | null | undefined;
    venue?: string | null | undefined;
    config?: Record<string, unknown> | null | undefined;
}>;
export type UpdateGatheringInput = z.infer<typeof updateGatheringSchema>;
export declare const gatheringResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    ownerGroupId: z.ZodNullable<z.ZodString>;
    seriesId: z.ZodNullable<z.ZodString>;
    type: z.ZodString;
    scheduledStart: z.ZodString;
    scheduledEnd: z.ZodNullable<z.ZodString>;
    venue: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["SCHEDULED", "CANCELLED", "COMPLETED"]>;
    config: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdByPersonId: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
    type: string;
    id: string;
    createdByPersonId: string;
    createdAt: string;
    updatedAt: string;
    ownerGroupId: string | null;
    seriesId: string | null;
    scheduledStart: string;
    scheduledEnd: string | null;
    venue: string | null;
    config: Record<string, unknown> | null;
}, {
    branchId: string;
    status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
    type: string;
    id: string;
    createdByPersonId: string;
    createdAt: string;
    updatedAt: string;
    ownerGroupId: string | null;
    seriesId: string | null;
    scheduledStart: string;
    scheduledEnd: string | null;
    venue: string | null;
    config: Record<string, unknown> | null;
}>;
export type GatheringResponseDto = z.infer<typeof gatheringResponseSchema>;
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
export declare const listGatheringsQuerySchema: z.ZodObject<{
    ownerGroupId: z.ZodString;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ownerGroupId: string;
    from?: string | undefined;
    to?: string | undefined;
}, {
    ownerGroupId: string;
    from?: string | undefined;
    to?: string | undefined;
}>;
export type ListGatheringsQuery = z.infer<typeof listGatheringsQuerySchema>;
/** FR-GTH-03. One record per Person per Gathering instance
 * (`db/schema.prisma`'s `@@unique([gatheringId, personId])`) - recording
 * again for the same pair overwrites the prior status (a correction, e.g.
 * marked absent by mistake), not a second record. */
export declare const recordAttendanceSchema: z.ZodObject<{
    personId: z.ZodString;
    status: z.ZodEnum<["PRESENT", "ABSENT", "EXCUSED"]>;
}, "strip", z.ZodTypeAny, {
    status: "PRESENT" | "ABSENT" | "EXCUSED";
    personId: string;
}, {
    status: "PRESENT" | "ABSENT" | "EXCUSED";
    personId: string;
}>;
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
export declare const attendanceRecordResponseSchema: z.ZodObject<{
    id: z.ZodString;
    gatheringId: z.ZodString;
    personId: z.ZodString;
    branchId: z.ZodString;
    status: z.ZodEnum<["PRESENT", "ABSENT", "EXCUSED"]>;
    recordedByPersonId: z.ZodString;
    recordedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    status: "PRESENT" | "ABSENT" | "EXCUSED";
    id: string;
    personId: string;
    gatheringId: string;
    recordedByPersonId: string;
    recordedAt: string;
}, {
    branchId: string;
    status: "PRESENT" | "ABSENT" | "EXCUSED";
    id: string;
    personId: string;
    gatheringId: string;
    recordedByPersonId: string;
    recordedAt: string;
}>;
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
export declare const submitVisitorIntakeSchema: z.ZodObject<{
    gatheringId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    howTheyHeard: z.ZodOptional<z.ZodString>;
    firstTimeGuest: z.ZodDefault<z.ZodBoolean>;
    bacentaPreferenceGroupId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    firstTimeGuest: boolean;
    gatheringId?: string | undefined;
    phone?: string | undefined;
    howTheyHeard?: string | undefined;
    bacentaPreferenceGroupId?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    gatheringId?: string | undefined;
    phone?: string | undefined;
    howTheyHeard?: string | undefined;
    firstTimeGuest?: boolean | undefined;
    bacentaPreferenceGroupId?: string | undefined;
}>;
export type SubmitVisitorIntakeInput = z.infer<typeof submitVisitorIntakeSchema>;
export declare const visitorIntakeResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    gatheringId: z.ZodNullable<z.ZodString>;
    personId: z.ZodNullable<z.ZodString>;
    submittedData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    createdAt: z.ZodString;
    followUpTaskCreated: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    id: string;
    createdAt: string;
    personId: string | null;
    gatheringId: string | null;
    submittedData: Record<string, unknown>;
    followUpTaskCreated: boolean;
}, {
    branchId: string;
    id: string;
    createdAt: string;
    personId: string | null;
    gatheringId: string | null;
    submittedData: Record<string, unknown>;
    followUpTaskCreated: boolean;
}>;
export type VisitorIntakeResponseDto = z.infer<typeof visitorIntakeResponseSchema>;
//# sourceMappingURL=gatherings.schemas.d.ts.map