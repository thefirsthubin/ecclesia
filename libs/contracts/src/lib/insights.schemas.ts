import { z } from 'zod';

/**
 * Shared Zod schemas for the Insights bounded context (PRD §13.6). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported from `libs/domain/insights` -
 * `libs/contracts` is a leaf library and must not depend on a domain
 * library.
 *
 * **`signalType` is a plain string, not a Zod enum.**
 * `db/schema.prisma`'s `EngagementSignal.signalType` is a bare `String`
 * column (not a Prisma/DB enum) - `libs/domain/insights`'s
 * `isChurchPulseSignalType()` is the one place that closes it to the six
 * `[PRD-DERIVED]` Church Pulse categories, deliberately at the domain
 * layer rather than the wire layer, so a signal source that does not yet
 * map to a scored category can still be ingested and stored without a
 * contract change (Blueprint §4.3 rule 3: Insights "depends only on the
 * Engagement Signal stream" - the stream's own wire shape should not be
 * artificially narrower than the table that backs it).
 *
 * **`scopeType`/`scopeId` (not separate `groupId`/`branchId` fields).**
 * Mirrors `PulseScoreScopeType` (`db/schema.prisma`) exactly -
 * `PulseScore`/`PulseScoreHistory`/`Alert` all key off a generic scope
 * pair. `PERSON` is included here for type-fidelity with the DB enum, but
 * no route in this milestone ever produces or accepts a `PERSON`-scoped
 * value - see `PulseScoreService`'s doc comment (NFR-PRIV-02).
 */

export const PULSE_SCORE_SCOPE_TYPE_VALUES = ['PERSON', 'GROUP', 'BRANCH'] as const;
export const pulseScoreScopeTypeSchema = z.enum(PULSE_SCORE_SCOPE_TYPE_VALUES);
export type PulseScoreScopeTypeDto = z.infer<typeof pulseScoreScopeTypeSchema>;

export const ALERT_STATUS_VALUES = ['OPEN', 'ACTED', 'DISMISSED'] as const;
export const alertStatusSchema = z.enum(ALERT_STATUS_VALUES);
export type AlertStatusDto = z.infer<typeof alertStatusSchema>;

/**
 * The shape `EngagementSignalService.record()` accepts (Blueprint §10.3's
 * event envelope, narrowed to the fields `engagement_signals` actually
 * persists - this module has no async event-bus consumer yet, see
 * `INSIGHTS_DESIGN_NOTES.md`, so `eventId`/`eventType`/`schemaVersion`
 * are not modeled here; they belong to the envelope a future
 * apps/worker consumer would unwrap before calling this same method).
 * Not validated by `ZodValidationPipe` anywhere in this milestone (no
 * HTTP route accepts it directly) - defined here anyway so the shape has
 * one canonical source of truth ready for that future consumer.
 */
export const recordEngagementSignalSchema = z.object({
  branchId: z.string().uuid(),
  personId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  signalType: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  occurredAt: z.string().datetime(),
});
export type RecordEngagementSignalInput = z.infer<typeof recordEngagementSignalSchema>;

export const pulseScoreResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  scopeType: pulseScoreScopeTypeSchema,
  scopeId: z.string().uuid(),
  score: z.number().min(0).max(100),
  computedAt: z.string().datetime(),
});
export type PulseScoreResponseDto = z.infer<typeof pulseScoreResponseSchema>;

export const alertResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  scopeType: pulseScoreScopeTypeSchema,
  scopeId: z.string().uuid(),
  alertType: z.string(),
  message: z.string().nullable(),
  status: alertStatusSchema,
  resolvedByPersonId: z.string().uuid().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  triggeredAt: z.string().datetime(),
});
export type AlertResponseDto = z.infer<typeof alertResponseSchema>;

/**
 * FR-INS-05: "record whether a leader acted on a proactive Insights
 * alert vs. dismissed it without action." `OPEN` is deliberately excluded
 * here - a leader resolves an alert into exactly one of the two terminal
 * states, they do not re-open one through this endpoint (there is no PRD
 * text describing a re-open flow).
 */
export const resolveAlertSchema = z.object({
  status: z.enum(['ACTED', 'DISMISSED']),
});
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;

/** `GET /insights/branch-dashboard` (FR-INS-04, Resident Pastor's
 * whole-Branch view). */
export const branchDashboardResponseSchema = z.object({
  branchId: z.string().uuid(),
  pulseScore: pulseScoreResponseSchema,
  alerts: z.array(alertResponseSchema),
});
export type BranchDashboardResponseDto = z.infer<typeof branchDashboardResponseSchema>;

/** `GET /insights/bacenta-dashboard/:groupId` and
 * `GET /insights/cluster-dashboard/:groupId` (FR-INS-04, Shepherd's own
 * Bacenta / Assistant Pastor's cluster drill-down) - same response shape,
 * different RBAC action/scope per `permission-matrix.ts`. See
 * `INSIGHTS_DESIGN_NOTES.md` for why the cluster route is a single-Bacenta
 * drill-down rather than a true multi-Bacenta ranked list. */
export const groupDashboardResponseSchema = z.object({
  branchId: z.string().uuid(),
  groupId: z.string().uuid(),
  pulseScore: pulseScoreResponseSchema,
  alerts: z.array(alertResponseSchema),
});
export type GroupDashboardResponseDto = z.infer<typeof groupDashboardResponseSchema>;

/** `GET /insights/alerts` (the Alert inbox surface, PRD §16.6). */
export const alertListResponseSchema = z.array(alertResponseSchema);
