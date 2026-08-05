"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertListResponseSchema = exports.groupDashboardResponseSchema = exports.branchDashboardResponseSchema = exports.resolveAlertSchema = exports.alertResponseSchema = exports.pulseScoreResponseSchema = exports.recordEngagementSignalSchema = exports.alertStatusSchema = exports.ALERT_STATUS_VALUES = exports.pulseScoreScopeTypeSchema = exports.PULSE_SCORE_SCOPE_TYPE_VALUES = void 0;
const zod_1 = require("zod");
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
exports.PULSE_SCORE_SCOPE_TYPE_VALUES = ['PERSON', 'GROUP', 'BRANCH'];
exports.pulseScoreScopeTypeSchema = zod_1.z.enum(exports.PULSE_SCORE_SCOPE_TYPE_VALUES);
exports.ALERT_STATUS_VALUES = ['OPEN', 'ACTED', 'DISMISSED'];
exports.alertStatusSchema = zod_1.z.enum(exports.ALERT_STATUS_VALUES);
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
exports.recordEngagementSignalSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid().optional(),
    groupId: zod_1.z.string().uuid().optional(),
    signalType: zod_1.z.string().min(1),
    payload: zod_1.z.record(zod_1.z.unknown()).default({}),
    occurredAt: zod_1.z.string().datetime(),
});
exports.pulseScoreResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    scopeType: exports.pulseScoreScopeTypeSchema,
    scopeId: zod_1.z.string().uuid(),
    score: zod_1.z.number().min(0).max(100),
    computedAt: zod_1.z.string().datetime(),
});
exports.alertResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    scopeType: exports.pulseScoreScopeTypeSchema,
    scopeId: zod_1.z.string().uuid(),
    alertType: zod_1.z.string(),
    message: zod_1.z.string().nullable(),
    status: exports.alertStatusSchema,
    resolvedByPersonId: zod_1.z.string().uuid().nullable(),
    resolvedAt: zod_1.z.string().datetime().nullable(),
    triggeredAt: zod_1.z.string().datetime(),
});
/**
 * FR-INS-05: "record whether a leader acted on a proactive Insights
 * alert vs. dismissed it without action." `OPEN` is deliberately excluded
 * here - a leader resolves an alert into exactly one of the two terminal
 * states, they do not re-open one through this endpoint (there is no PRD
 * text describing a re-open flow).
 */
exports.resolveAlertSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTED', 'DISMISSED']),
});
/** `GET /insights/branch-dashboard` (FR-INS-04, Resident Pastor's
 * whole-Branch view). */
exports.branchDashboardResponseSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    pulseScore: exports.pulseScoreResponseSchema,
    alerts: zod_1.z.array(exports.alertResponseSchema),
});
/** `GET /insights/bacenta-dashboard/:groupId` and
 * `GET /insights/cluster-dashboard/:groupId` (FR-INS-04, Shepherd's own
 * Bacenta / Assistant Pastor's cluster drill-down) - same response shape,
 * different RBAC action/scope per `permission-matrix.ts`. See
 * `INSIGHTS_DESIGN_NOTES.md` for why the cluster route is a single-Bacenta
 * drill-down rather than a true multi-Bacenta ranked list. */
exports.groupDashboardResponseSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    pulseScore: exports.pulseScoreResponseSchema,
    alerts: zod_1.z.array(exports.alertResponseSchema),
});
/** `GET /insights/alerts` (the Alert inbox surface, PRD §16.6). */
exports.alertListResponseSchema = zod_1.z.array(exports.alertResponseSchema);
//# sourceMappingURL=insights.schemas.js.map