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

/**
 * `[Resident Pastor Dashboard - real Members/Attendance/Giving data
 * milestone]` One point in a 6-month monthly-bucketed series
 * (`BranchDashboardSummaryResponseDto.growthSeries`). `label` is a
 * pre-formatted 3-letter month abbreviation (e.g. `'Aug'`) - the server
 * computes it, not the client, so there is exactly one place that decides
 * "which 6 months" and "what to call them," matching this response's own
 * `growthSeries` field order.
 */
export const growthSeriesPointSchema = z.object({
  label: z.string(),
  value: z.number(),
});
export type GrowthSeriesPointDto = z.infer<typeof growthSeriesPointSchema>;

/**
 * `[Resident Pastor Dashboard - Volunteers/Bacenta Leaderboard/Engagement
 * Trend milestone]` One row of `BranchDashboardSummaryResponseDto.bacentaLeaderboard`
 * - a Bacenta with an already-computed `PulseScore` (`scopeType: 'GROUP'`),
 * read as-is, never recomputed here (`apps/worker`'s `ChurchPulseRecomputeJob`
 * is the only writer). `leaderName` is `null`, not a fabricated placeholder,
 * when the Bacenta genuinely has no active `BACENTA_LEADER` Role Assignment
 * right now - a real, honest state (a vacant Bacenta), not an error.
 */
export const bacentaLeaderboardEntrySchema = z.object({
  groupId: z.string().uuid(),
  name: z.string(),
  leaderName: z.string().nullable(),
  score: z.number().min(0).max(100),
});
export type BacentaLeaderboardEntryDto = z.infer<typeof bacentaLeaderboardEntrySchema>;

export const engagementTrendDirectionSchema = z.enum(['up', 'down', 'flat']);
export type EngagementTrendDirectionDto = z.infer<typeof engagementTrendDirectionSchema>;

/**
 * `[Resident Pastor Dashboard - Volunteers/Bacenta Leaderboard/Engagement
 * Trend milestone]` `BranchDashboardSummaryResponseDto.engagementTrend` -
 * a direct read of `libs/domain/insights`'s own `evaluatePulseTrend()`
 * output (FR-INS-03), applied to the Branch's own `PulseScoreHistory`
 * (`scopeType: 'BRANCH'`), not a new trend computation. `deltaPoints` is
 * a signed **Church Pulse point** delta (the score is already a 0-100
 * scale, so this is not converted to a second, redundant "percentage of
 * baseline" figure - `evaluatePulseTrend` itself has no such concept).
 * `direction` is derived from `deltaPoints`' sign - `evaluatePulseTrend`'s
 * own `declined` field is threshold-gated for alerting purposes ("declined
 * enough to alert on"), a different question from "which way is it moving
 * at all," so it is deliberately not surfaced here.
 */
export const engagementTrendSchema = z.object({
  direction: engagementTrendDirectionSchema,
  deltaPoints: z.number(),
  windowDays: z.number().int().positive(),
});
export type EngagementTrendDto = z.infer<typeof engagementTrendSchema>;

/**
 * `GET /insights/branch-dashboard-summary` - Resident Pastor Dashboard's
 * real KPI/growth-chart data (replacing `apps/web-admin`'s previously-demo
 * `DEMO_KPIS`/`buildGrowthSeries()`/`DEMO_BACENTA_LEADERBOARD`/
 * `DEMO_CHURCH_PULSE_SUBMETRICS.engagementTrend*` fields one milestone at a
 * time - see `DASHBOARD_REDESIGN_NOTES.md`'s Milestone 11 addendum and the
 * two Web Admin Release 1 audit follow-ons that named these as the next
 * tasks). First milestone: Members/Attendance/Giving. Second milestone
 * (this one): Volunteers/Bacenta Leaderboard/Engagement Trend. Follow-up
 * Health, Church name, and Branch Comparison remain demo data - still out
 * of scope.
 *
 * **Field semantics** (see `BranchDashboardSummaryService`'s own doc
 * comment for the full reasoning):
 * - `membersCount` - current total People in the Branch (a live snapshot,
 *   not a period sum).
 * - `membersTrend` - a signed **count** (not a percentage) of People
 *   created since the start of the current calendar month - matches the
 *   demo data it replaces (`'+12 this month'` is an absolute delta, unlike
 *   Attendance/Giving's percentage trends).
 * - `attendanceTotal` / `givingTotalMinor` - the current (in-progress)
 *   calendar month's total: every `AttendanceRecord` with `status:
 *   'PRESENT'` recorded this month (branch-wide, not filtered by
 *   Gathering type - `Gathering.type` is free-text, not a fixed enum, so
 *   there is no principled type to filter to); every `FinancialTransaction`
 *   with `currentState` `VERIFIED`/`RECONCILED` created this month
 *   (branch-wide, every `giverPersonId`/`sourceGroupId` - unlike
 *   `sumVerifiedAmountByGroupForWeek`'s per-Bacenta reconciliation view,
 *   a Branch-wide Giving KPI has no reason to exclude individual gifts).
 * - `attendanceTrend` / `givingTrend` - signed **percentage** change vs.
 *   the immediately preceding full calendar month (i.e. the last two
 *   points of the corresponding `growthSeries`).
 * - `givingTotalMinor` is a decimal string in minor currency units
 *   (pesewas), matching every other `amountMinor`-shaped field in this
 *   codebase's wire contracts - never a `number` (BigInt precision).
 * - `growthSeries.giving[].value` is a plain `number`, **also in minor
 *   units** - deliberately consistent with `givingTotalMinor` rather than
 *   pre-converted to major currency units; `apps/web-admin`'s own
 *   `formatAmountMinor`/chart-mapping layer is where minor-to-major
 *   conversion already happens for every other money value in this app,
 *   and this endpoint does not special-case itself.
 * - `growthSeries.membership` is a **cumulative snapshot** per month
 *   (total People created on or before that month's end), not a
 *   per-month new-members count - matches the demo data it replaces
 *   (`MEMBERSHIP_TREND`'s monotonically increasing values). This is
 *   deliberately different in kind from `attendance`/`giving`'s
 *   per-month period sums; see `BranchDashboardSummaryService` for why.
 * - `volunteersCount` - current distinct People with at least one active
 *   (`endedAt: null`) `MINISTRY`-type Group Membership, Branch-wide - the
 *   same "distinct person, not membership row count" shape as every other
 *   headcount here (one Person can hold several concurrent Basonta
 *   memberships without being double-counted).
 * - `volunteersTrend` - a signed **count** (not a percentage), the exact
 *   same "current minus start-of-month" shape as `membersTrend` -
 *   `GroupMembership.startedAt`/`endedAt` make an honest point-in-time
 *   reconstruction possible (count active *as of* a past date), the same
 *   technique `membersTrend`/`growthSeries.membership` already use.
 * - `bacentaLeaderboard` - every active Bacenta (`type: 'PASTORAL_CARE'`,
 *   `lifecycleStatus: 'ACTIVE'`) that already has a computed `PulseScore`
 *   (`scopeType: 'GROUP'`) - **not** every active Bacenta unconditionally;
 *   one with no score yet (e.g. the nightly `ChurchPulseRecomputeJob`
 *   sweep hasn't reached it) is omitted, not shown with a fabricated 0.
 *   Ordered highest score first (leaderboard semantics), matching the
 *   demo data's own ordering.
 * - `engagementTrend` - see `engagementTrendSchema`'s own doc comment.
 */
export const branchDashboardSummaryResponseSchema = z.object({
  branchId: z.string().uuid(),
  membersCount: z.number().int().min(0),
  membersTrend: z.number().int(),
  attendanceTotal: z.number().int().min(0),
  attendanceTrend: z.number(),
  givingTotalMinor: z.string(),
  givingTrend: z.number(),
  growthSeries: z.object({
    attendance: z.array(growthSeriesPointSchema),
    membership: z.array(growthSeriesPointSchema),
    giving: z.array(growthSeriesPointSchema),
  }),
  volunteersCount: z.number().int().min(0),
  volunteersTrend: z.number().int(),
  bacentaLeaderboard: z.array(bacentaLeaderboardEntrySchema),
  engagementTrend: engagementTrendSchema,
});
export type BranchDashboardSummaryResponseDto = z.infer<typeof branchDashboardSummaryResponseSchema>;
