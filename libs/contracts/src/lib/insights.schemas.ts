import { z } from 'zod';

import { financialTransactionTypeSchema } from './stewardship.schemas';
import { gatheringCategorySchema } from './gatherings.schemas';

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

/**
 * `[Milestone C: Portal Read Models + Analytics]` Phase 2's shared
 * bucketing contract - the request/response shapes every new trend
 * endpoint (giving-trend, attendance-trend, membership-trend) reuses,
 * rather than each inventing its own. Mirrors `libs/domain/insights`'s
 * `TimeBucketGranularity`/`TimeBucket` shape exactly (re-declared, not
 * imported - `libs/contracts` is a leaf library, same rule every other
 * schema file in this package already follows).
 */
export const TIME_BUCKET_GRANULARITY_VALUES = ['week', 'month', 'year'] as const;
export const timeBucketGranularitySchema = z.enum(TIME_BUCKET_GRANULARITY_VALUES);
export type TimeBucketGranularityDto = z.infer<typeof timeBucketGranularitySchema>;

/** Shared by every trend query - `groupId` names one specific Bacenta/
 * Basonta to drill into (validated against the actor's own scope by the
 * route's resource-context guard, the same `groupId`-optional shape
 * `FollowUpTaskListForActorResourceContextGuard`/`ListOutreachQuery`
 * already establish); `council: true` requests a Council-wide,
 * per-Branch breakdown instead (only meaningful for a COUNCIL-scoped
 * actor - `RESIDENT_PASTOR`, `COUNCIL_TREASURER`, `COUNCIL_OVERSEER`).
 * Neither implies the other; supplying both is rejected by the service
 * layer (a single request names at most one explicit scope narrowing). */
export const trendQueryBaseSchema = z.object({
  granularity: timeBucketGranularitySchema.default('month'),
  count: z.coerce.number().int().min(1).max(52).default(6),
  endingAt: z.string().datetime().optional(),
  groupId: z.string().uuid().optional(),
  council: z.coerce.boolean().default(false),
});

export const timeBucketResponseSchema = z.object({
  bucketStart: z.string(),
  bucketEnd: z.string(),
  label: z.string(),
});

/**
 * `[Milestone C]` Phase 3's Giving Trend read model.
 * `giving.schemas.ts`'s own `financialTransactionTypeSchema.exclude(['EXPENSE'])`
 * convention is reused verbatim - `EXPENSE` must never appear in giving
 * analytics, per Phase 3's explicit instruction, enforced here at the
 * contract layer, not merely by service-layer discipline.
 */
export const getGivingTrendQuerySchema = trendQueryBaseSchema.extend({
  type: financialTransactionTypeSchema.exclude(['EXPENSE']).optional(),
  gatheringCategory: gatheringCategorySchema.optional(),
});
export type GetGivingTrendQuery = z.infer<typeof getGivingTrendQuerySchema>;

export const givingTrendBucketSchema = timeBucketResponseSchema.extend({
  totalAmountMinor: z.string(),
  byType: z.record(financialTransactionTypeSchema.exclude(['EXPENSE']), z.string()),
});
export type GivingTrendBucketDto = z.infer<typeof givingTrendBucketSchema>;

/** One Branch's own giving-trend result - the shape every scope
 * (branch/cluster/own-group) response uses; a `council: true` request
 * wraps one of these per Branch (`councilBranches` below). */
export const givingTrendResultSchema = z.object({
  from: z.string(),
  to: z.string(),
  buckets: z.array(givingTrendBucketSchema),
  /**
   * Phase 1 decision #5: transactions with neither `gatheringId` nor
   * `sourceGroupId` - reported as one explicit total for the whole
   * queried window, never guessed into a category/group bucket above and
   * never silently dropped.
   */
  unattributedAmountMinor: z.string(),
  /** Every configured `Gathering.type` string seen among this window's
   * rows that has no `GatheringTypeCategoryMapping` row yet - surfaced
   * so a caller filtering by `gatheringCategory` can see what's being
   * silently excluded from every category bucket, rather than
   * discovering it only as a total that doesn't add up. Empty unless
   * `gatheringCategory` was supplied. */
  unmappedGatheringTypes: z.array(z.string()),
});
export type GivingTrendResultDto = z.infer<typeof givingTrendResultSchema>;

export const givingTrendResponseSchema = z.union([
  givingTrendResultSchema.extend({ branchId: z.string().uuid() }),
  z.object({ councilBranches: z.array(givingTrendResultSchema.extend({ branchId: z.string().uuid() })) }),
]);
export type GivingTrendResponseDto = z.infer<typeof givingTrendResponseSchema>;

/**
 * `[Milestone C]` Phase 4's Attendance Trend read model.
 * `gatheringCategory` here (unlike Giving's) may also be omitted entirely
 * to mean "all gatherings" (Phase 4's explicit "all gatherings" support),
 * distinct from any one specific category.
 */
export const getAttendanceTrendQuerySchema = trendQueryBaseSchema.extend({
  gatheringCategory: gatheringCategorySchema.optional(),
});
export type GetAttendanceTrendQuery = z.infer<typeof getAttendanceTrendQuerySchema>;

export const attendanceTrendBucketSchema = timeBucketResponseSchema.extend({
  presentCount: z.number().int().min(0),
});
export type AttendanceTrendBucketDto = z.infer<typeof attendanceTrendBucketSchema>;

/** One group's own attendance total for the whole queried window -
 * Phase 4's explicit "also support group-level attendance aggregation." */
export const attendanceTrendGroupBreakdownEntrySchema = z.object({
  groupId: z.string().uuid(),
  presentCount: z.number().int().min(0),
});
export type AttendanceTrendGroupBreakdownEntryDto = z.infer<typeof attendanceTrendGroupBreakdownEntrySchema>;

export const attendanceTrendResultSchema = z.object({
  from: z.string(),
  to: z.string(),
  buckets: z.array(attendanceTrendBucketSchema),
  byGroup: z.array(attendanceTrendGroupBreakdownEntrySchema),
  /** Every configured `Gathering.type` string seen among this window's
   * attended Gatherings that has no `GatheringTypeCategoryMapping` row -
   * same disclosure discipline as `GivingTrendResultDto.unmappedGatheringTypes`.
   * Empty unless `gatheringCategory` was supplied. */
  unmappedGatheringTypes: z.array(z.string()),
});
export type AttendanceTrendResultDto = z.infer<typeof attendanceTrendResultSchema>;

export const attendanceTrendResponseSchema = z.union([
  attendanceTrendResultSchema.extend({ branchId: z.string().uuid() }),
  z.object({ councilBranches: z.array(attendanceTrendResultSchema.extend({ branchId: z.string().uuid() })) }),
]);
export type AttendanceTrendResponseDto = z.infer<typeof attendanceTrendResponseSchema>;

/**
 * `[Milestone C]` Phase 5's Membership Trend read model. Two shapes
 * deliberately kept separate:
 *
 * - `series` - bucketed, cumulative-snapshot counts (registered people,
 *   Members), the same "as of each bucket's end boundary" technique
 *   `BranchDashboardSummaryService.growthSeries.membership` already
 *   established (`countByBranchCreatedBefore`) - genuinely honest
 *   history, since `Person`/`GroupMembership` rows are never deleted.
 * - `snapshot` - a **current-moment-only** set of counts (active/inactive
 *   members, first timers, visitors, people without Bacenta, Bacenta/
 *   Basonta membership). Explicitly not bucketed into a historical
 *   series - Phase 1 decision #2's active/inactive definition depends on
 *   a rolling 8-week attendance window ending "now," and re-deriving
 *   that same rolling window as of every past bucket boundary would only
 *   be honest if this system had reliably captured attendance data for
 *   every one of those past 8-week windows too, which cannot be assumed
 *   this far back - Phase 1 decision #13 and this milestone's own
 *   "do not fabricate historical transitions" instruction both apply
 *   here. A current snapshot is the honest, defensible scope.
 */
export const membershipSnapshotSchema = z.object({
  registeredPeopleCount: z.number().int().min(0),
  membersCount: z.number().int().min(0),
  activeMembersCount: z.number().int().min(0),
  inactiveMembersCount: z.number().int().min(0),
  /** Weeks in the rolling Sunday-attendance window behind
   * `activeMembersCount`/`inactiveMembersCount` - Phase 1 decision #2's
   * `ACTIVE_MEMBER_WINDOW = 8 weeks`, echoed back so a caller never has
   * to hardcode it independently. */
  activeMemberWindowWeeks: z.number().int().min(1),
  firstTimersCount: z.number().int().min(0),
  visitorsCount: z.number().int().min(0),
  peopleWithoutBacentaCount: z.number().int().min(0),
  bacentaMembershipCount: z.number().int().min(0),
  basontaMembershipCount: z.number().int().min(0),
});
export type MembershipSnapshotDto = z.infer<typeof membershipSnapshotSchema>;

export const getMembershipTrendQuerySchema = trendQueryBaseSchema;
export type GetMembershipTrendQuery = z.infer<typeof getMembershipTrendQuerySchema>;

export const membershipTrendResultSchema = z.object({
  from: z.string(),
  to: z.string(),
  registeredPeopleSeries: z.array(growthSeriesPointSchema),
  membersSeries: z.array(growthSeriesPointSchema),
  snapshot: membershipSnapshotSchema,
});
export type MembershipTrendResultDto = z.infer<typeof membershipTrendResultSchema>;

export const membershipTrendResponseSchema = z.union([
  membershipTrendResultSchema.extend({ branchId: z.string().uuid() }),
  z.object({ councilBranches: z.array(membershipTrendResultSchema.extend({ branchId: z.string().uuid() })) }),
]);
export type MembershipTrendResponseDto = z.infer<typeof membershipTrendResponseSchema>;

/**
 * `[Milestone C.1.2: Outreach Analytics]` The Outreach conversion read
 * model - reuses `trendQueryBaseSchema`'s `groupId`/`council` scope
 * shape (no `granularity`/`count`/`endingAt` bucketing - this is a
 * single-window summary, not a bucketed trend) plus an explicit
 * `from`/`to` window, mirroring `listOutreachQuerySchema`'s own shape.
 */
export const getOutreachConversionQuerySchema = z.object({
  groupId: z.string().uuid().optional(),
  council: z.coerce.boolean().default(false),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type GetOutreachConversionQuery = z.infer<typeof getOutreachConversionQuerySchema>;

export const outreachConversionResultSchema = z.object({
  from: z.string().nullable(),
  to: z.string().nullable(),
  outreachesCount: z.number().int().min(0),
  contactsReachedCount: z.number().int().min(0),
  promotedContactsCount: z.number().int().min(0),
  conversionPercentage: z.number().min(0).max(100),
  /** `null` when no contact has been promoted yet in the queried scope -
   * never a fabricated `0`. Phase 6's explicit instruction: this is an
   * **inferred** duration (`Person.createdAt - OutreachContact.createdAt`,
   * `OutreachContactRepository.listForConversion`'s own doc comment),
   * never presented as a stored historical promotion timestamp - see
   * `averageInferredPromotionDaysIsInferred` below, always `true`, so a
   * consumer can never mistake this field for a hard fact without
   * reading documentation. */
  averageInferredPromotionDays: z.number().min(0).nullable(),
  averageInferredPromotionDaysIsInferred: z.literal(true),
  /** Promoted contacts whose resulting Person is currently a `MEMBER`
   * AND has attended a SUNDAY-category Gathering within the approved
   * 8-week active-member window (Phase 1 decision #2) - only honestly
   * computable now that that definition exists (Milestone C Phase 5).
   * Never claims a conversion the active-member definition can't
   * actually support - see `OutreachConversionService`'s own doc
   * comment. */
  convertedToActiveMemberCount: z.number().int().min(0),
  convertedToActiveMemberPercentage: z.number().min(0).max(100),
});
export type OutreachConversionResultDto = z.infer<typeof outreachConversionResultSchema>;

export const outreachConversionResponseSchema = z.union([
  outreachConversionResultSchema.extend({ branchId: z.string().uuid() }),
  z.object({ councilBranches: z.array(outreachConversionResultSchema.extend({ branchId: z.string().uuid() })) }),
]);
export type OutreachConversionResponseDto = z.infer<typeof outreachConversionResponseSchema>;
