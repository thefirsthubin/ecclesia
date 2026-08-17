import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AttentionList,
  BarChart,
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  HealthStatement,
  PageContainer,
  PageHeader,
  SectionHeader,
  Skeleton,
  Text,
  TrendPanel,
  useTheme,
} from '@ecclesia/ui-web';
import type { AttentionListItem } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { apiPatch } from '../../lib/api-client';
import { useNavigate } from '../../router/router';
import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import { resolveDefaultFollowUpTaskQuery, useFollowUpTaskQueue } from '../PastoralCare/usePastoralCareData';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { BacentaPerformanceTable } from './BacentaPerformanceTable';
import { QuickActionsRow } from './QuickActionsRow';
import type { QuickAction } from './QuickActionsRow';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';
import { sumMeetingOffering, sumSundayAttendance, useBacentaPerformance, useClusterAlerts } from './useBranchPastorDashboardData';
import type { BacentaAlert, BacentaPerformanceRow } from './useBranchPastorDashboardData';

/** `[Branch Pastor Dashboard sprint, approved spec]` No `Branch`-owning
 * "organization/church" name field exists anywhere in `ActorContext` or
 * `GET /auth/me` (checked, not assumed) - this deployment's real Branch
 * name (`branchName`, real data) always sits under one literal top-level
 * name, the same way the product name "Ecclesia" itself is a constant,
 * not a fetched value. Named here, once, rather than inlined, so a future
 * multi-organization deployment is a one-line change, not a text hunt. */
const CHURCH_NAME = 'River of Life';

const BRANCH_PASTOR_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Review attendance', icon: 'calendar', href: '/gatherings' },
  { label: 'Review offering', icon: 'coins', href: '/finance' },
  { label: 'View members', icon: 'users', href: '/people' },
  { label: 'Pastoral care follow-ups', icon: 'heart', href: '/pastoral-care' },
];

interface AttentionItem {
  id: string;
  description: string;
  bacentaName?: string;
  alert?: BacentaAlert;
}

/**
 * Strict priority order (approved spec): missing Sunday attendance, then
 * missing Bacenta meeting attendance, then missing Bacenta meeting
 * offering, then real backend alerts - four separate passes concatenated,
 * not one interleaved per-row loop, so the ordering is exactly what was
 * approved rather than an accident of iteration order.
 *
 * Sunday attendance is deliberately never attributed to one Bacenta by
 * name - the real data model has exactly one Branch-wide Sunday Service
 * Gathering, not one per Bacenta, so "missing" is an all-or-nothing
 * branch-level fact. Naming a single Bacenta for it would misstate what
 * the data actually says.
 */
function buildAttentionItems(rows: BacentaPerformanceRow[], hasSundayGathering: boolean, alerts: BacentaAlert[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (!hasSundayGathering) {
    items.push({
      id: 'missing-sunday',
      description: 'Sunday attendance not recorded for this week yet.',
    });
  }
  for (const row of rows) {
    if (row.meetingAttendance === null) {
      items.push({
        id: `missing-meeting-${row.groupId}`,
        bacentaName: row.name,
        description: 'Meeting attendance missing.',
      });
    }
  }
  for (const row of rows) {
    if (row.meetingOfferingMinor === null) {
      items.push({
        id: `missing-offering-${row.groupId}`,
        bacentaName: row.name,
        description: 'Meeting offering not recorded.',
      });
    }
  }
  const nameByGroupId = new Map(rows.map((row) => [row.groupId, row.name]));
  for (const alert of alerts) {
    items.push({
      id: `alert-${alert.id}`,
      bacentaName: nameByGroupId.get(alert.bacentaId),
      description: alert.message ?? alert.alertType,
      alert,
    });
  }
  return items;
}

/** Pure date math on the real `weekStartDateOnly` (Monday) the data was
 * actually fetched for - the "current reporting period" line in the page
 * header, not a second, independently-guessed date. */
function formatWeekRangeLabel(weekStartDateOnly: string): string {
  const [year, month, day] = weekStartDateOnly.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 6);
  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Week of ${startLabel} – ${endLabel}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * `[Wholesale visual redesign]` Rebuilt around the single question a
 * Branch Pastor needs answered in seconds: "how is my branch doing this
 * week?" A real editorial thesis (`HealthStatement`, built from the same
 * `sundayTotal`/`attentionItems` facts the rest of the page already
 * computes - no new metric invented for this) replaces the four-up KPI
 * strip as the page's opening statement; `BacentaPerformanceTable` stays
 * the dominant module (roughly 65-70% of the main content width, per the
 * approved composition) beside a compact Needs Attention / Follow-ups /
 * Quick Actions column rather than a full-height spanning right rail.
 * Church Pulse stays a Resident Pastor-only flagship (see
 * `ChurchPulseInsightsPanel.tsx`'s own doc comment) - this dashboard
 * doesn't render it at all.
 *
 * **Real, live data** (see `useBranchPastorDashboardData.ts` for the full
 * per-metric endpoint trace): Bacenta list/names, members per Bacenta,
 * Sunday attendance by Bacenta, Bacenta meeting attendance by Bacenta,
 * Bacenta meeting offering by Bacenta, and Needs Attention (missing-
 * record facts + real Insights alerts merged across the cluster) are all
 * real, composed from existing endpoints. No demo data anywhere on this
 * dashboard, and no sparkline/trend is drawn on the hero statement - no
 * per-Bacenta multi-week aggregate endpoint exists for this dashboard
 * (still true as of this pass), so `HealthStatement`'s `trend` prop is
 * deliberately left unset rather than fed a fabricated series.
 *
 * **Historical trend, deliberately not duplicated here**: the two ranked
 * comparison charts below compare Bacentas for the *current* week only.
 * A real Branch-wide 6-month attendance/giving trend does now exist
 * (`BranchInsightsView`, Insights sprint) - deliberately kept on
 * `/insights`, not copied here too, per this same file's own "Dashboard
 * and Insights are now genuinely different screens" precedent
 * (`InsightsPage.tsx`'s own doc comment): Dashboard answers "how is my
 * Branch doing this week," Insights answers "what's happening over time."
 */
export function BranchPastorDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const clusterBacentaIds = state.status === 'authenticated' ? (state.actor.clusterBacentaIds ?? []) : [];
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const { isCompact, isNarrow } = useDashboardBreakpoint();

  const performanceState = useBacentaPerformance(accessToken, clusterBacentaIds);
  const rows = performanceState.status === 'success' ? performanceState.data.rows : [];
  const alertsState = useClusterAlerts(accessToken, clusterBacentaIds);
  const alerts = alertsState.status === 'success' ? alertsState.data : [];

  const followUpQuery = resolveDefaultFollowUpTaskQuery({
    role: 'ASSISTANT_PASTOR',
    clusterBacentaIds,
  });
  const followUpState = useFollowUpTaskQueue(accessToken, followUpQuery);
  const openFollowUps = followUpState.status === 'success' ? followUpState.data.filter((task) => task.status === 'OPEN') : undefined;
  const today = new Date();
  const dueTodayCount = openFollowUps?.filter((task) => task.dueAt && isSameCalendarDay(new Date(task.dueAt), today)).length ?? 0;

  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const resolveAlert = async (alertId: string) => {
    setResolvingAlertId(alertId);
    try {
      await apiPatch(`/insights/alerts/${alertId}/resolve`, { status: 'ACTED' }, { authToken: accessToken });
      alertsState.refetch();
    } finally {
      setResolvingAlertId(null);
    }
  };

  const attentionItems = useMemo(
    () => buildAttentionItems(rows, performanceState.status === 'success' ? performanceState.data.hasSundayGathering : true, alerts),
    [rows, performanceState.status === 'success' ? performanceState.data.hasSundayGathering : true, alerts],
  );

  if (clusterBacentaIds.length === 0) {
    return (
      <PageContainer maxWidth={720}>
        <EmptyState icon="home" title="No Bacentas assigned" description="This branch currently has no Bacentas assigned to your pastoral oversight." />
      </PageContainer>
    );
  }

  const totalBacentas = performanceState.status === 'success' ? performanceState.data.rows.length : clusterBacentaIds.length;
  const totalMembers = performanceState.status === 'success' ? performanceState.data.totalBranchMembers : undefined;
  const sundayTotal = performanceState.status === 'success' ? sumSundayAttendance(performanceState.data.rows) : undefined;
  const offeringTotal = performanceState.status === 'success' ? sumMeetingOffering(performanceState.data.rows) : undefined;
  const weekStartDateOnly = performanceState.status === 'success' ? performanceState.data.weekStartDateOnly : '';

  // `[Product Experience Sprint II, Phase 4]` `minmax(0, Nfr)`, not bare
  // `Nfr` - found during this sprint's own 1024px breakpoint check: the
  // table's own fixed-pixel column widths (`BacentaPerformanceTable`)
  // gave that 68fr track a real minimum content width wider than 68% of
  // 1024px, and a bare `fr` track still won't shrink below its content's
  // min-content size (the same CSS Grid behavior already fixed on
  // `ResidentPastorDashboard`'s KPI/region grids this same sprint) - so
  // the table pushed the sidebar column down to a sliver and the whole
  // row past the viewport. `minmax(0, ...)` overrides that implicit
  // minimum; `Table`'s own horizontal-scroll wrapper (already built)
  // takes over from there if the table genuinely needs more room than
  // its column has.
  const heroRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 68fr) minmax(0, 32fr)',
    gap: theme.spacing[4],
    alignItems: 'start',
  };
  const chartsRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: theme.spacing[4],
    alignItems: 'start',
  };

  // Ranked comparison data, sorted strongest-first (`ui-ux-pro-max`'s
  // comparison-chart guidance: "always sort descending") so the best and
  // worst-performing Bacentas are both visible without scanning.
  const sundayChartData = rows
    .filter((row) => row.sundayAttendance !== null)
    .map((row) => ({ label: row.name, value: row.sundayAttendance as number }))
    .sort((a, b) => b.value - a.value);
  const offeringChartData = rows
    .filter((row) => row.meetingOfferingMinor !== null)
    .map((row) => ({
      label: row.name,
      value: Number(row.meetingOfferingMinor) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  const fadeIn = (delayMs: number, extraStyle: CSSProperties = {}): { className: string; style: CSSProperties } => ({
    className: 'ecclesia-dashboard-fade-in',
    style: { animationDelay: `${delayMs}ms`, ...extraStyle },
  });

  // The editorial hero statement - a real derived sentence from the same
  // `sundayTotal`/`attentionItems` facts computed above, never a second,
  // independently-fabricated summary. `'—'` (not a giant "Not yet
  // recorded" headline) matches this codebase's own established glyph for
  // a genuinely missing record (`AttendanceCountCell` in
  // `BacentaPerformanceTable.tsx`).
  const healthBlock = (() => {
    if (performanceState.status === 'loading') {
      return (
        <Card padding={6} elevation={1} testId="branch-health-card">
          <Skeleton height={64} />
        </Card>
      );
    }
    if (performanceState.status === 'error') {
      return (
        <Card padding={6} elevation={1} testId="branch-health-card">
          <ErrorState title="Couldn't load this week's numbers" onRetry={performanceState.refetch} />
        </Card>
      );
    }
    const notRecorded = sundayTotal === null;
    const tone: 'positive' | 'attention' = notRecorded || attentionItems.length > 0 ? 'attention' : 'positive';
    const headline = notRecorded ? '—' : String(sundayTotal);
    const statement = notRecorded
      ? "Sunday attendance hasn't been logged for this week."
      : attentionItems.length === 0
        ? `attended Sunday service across ${totalBacentas} Bacenta${totalBacentas === 1 ? '' : 's'} — every record is in, and there are no open alerts.`
        : `attended Sunday service across ${totalBacentas} Bacenta${totalBacentas === 1 ? '' : 's'}. ${attentionItems.length} item${attentionItems.length === 1 ? '' : 's'} need${attentionItems.length === 1 ? 's' : ''} your attention.`;
    return (
      <Card padding={6} elevation={1} testId="branch-health-card">
        <HealthStatement
          headline={headline}
          statement={statement}
          tone={tone}
          trailing={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing[1],
                alignItems: 'flex-end',
              }}
            >
              <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
                {`${totalMembers} Member${totalMembers === 1 ? '' : 's'}`}
              </Text>
              <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
                {offeringTotal === null ? 'Offering not recorded' : `${formatAmountMinor(offeringTotal as string, 'GHS')} Offering`}
              </Text>
            </div>
          }
          testId="branch-health-statement"
        />
      </Card>
    );
  })();

  return (
    <PageContainer maxWidth={1440}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing[5],
        }}
      >
        {/* Quiet page header - title / church · branch / current reporting
          period, no personalized greeting, no giant alert banner. Local to
          this persona - the shared `DashboardHeader` every other dashboard
          uses is untouched. */}
        <div {...fadeIn(0)}>
          <PageHeader
            title="Dashboard"
            context={`${CHURCH_NAME} · ${branchName}${weekStartDateOnly ? ` · ${formatWeekRangeLabel(weekStartDateOnly)}` : ''}`}
            action={
              attentionItems.length > 0 ? (
                <Badge status="warning" testId="dashboard-header-alert-glance">
                  {`${attentionItems.length} need${attentionItems.length === 1 ? 's' : ''} attention`}
                </Badge>
              ) : undefined
            }
          />
        </div>

        <div {...fadeIn(60)}>{healthBlock}</div>

        {/* Each block is composed once, then arranged differently below by
          breakpoint - the approved spec gives tablet only a general
          "collapse beneath the table" instruction (the desktop grouping -
          Needs Attention/Follow-ups/Quick Actions together - carries over
          unchanged), but gives mobile an explicit, different priority
          order (Needs Attention, then both charts, then Quick Actions,
          then Follow-ups) that the desktop grouping does not satisfy on
          its own. */}
        {(() => {
          const tableBlock = (
            <BacentaPerformanceTable
              status={performanceState.status}
              rows={rows}
              weekStartDateOnly={weekStartDateOnly}
              onRetry={performanceState.refetch}
              onRowClick={(row) => navigate(`/ministry/${row.groupId}`)}
            />
          );

          const attentionListItems: AttentionListItem[] = attentionItems.slice(0, 5).map((item) => ({
            id: item.id,
            label: item.bacentaName ?? 'Branch-wide',
            description: item.description,
            action: item.alert ? (
              <Button
                variant="tertiary"
                size="sm"
                loading={resolvingAlertId === item.alert.id}
                onClick={() => void resolveAlert(item.alert!.id)}
                accessibilityLabel={`Resolve alert: ${item.alert.alertType}`}
              >
                Resolve
              </Button>
            ) : undefined,
          }));

          const needsAttentionBlock = (
            <Card padding={4} testId="needs-attention-card">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing[3],
                }}
              >
                <SectionHeader title="Needs Your Attention" />
                {performanceState.status === 'loading' || alertsState.status === 'loading' ? (
                  <Skeleton height={20} />
                ) : (
                  <>
                    <AttentionList
                      items={attentionListItems}
                      emptyState={{
                        icon: 'checkCircle',
                        title: 'Nothing needs attention',
                        description: "Every Bacenta has this week's records in, and there are no open alerts.",
                      }}
                    />
                    {attentionItems.length > 0 && (
                      <Button variant="tertiary" size="sm" onClick={() => navigate('/insights')}>
                        View all →
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          );

          const followUpsBlock = (
            <Card padding={4} testId="branch-pastor-followups-card">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing[3],
                }}
              >
                <SectionHeader title="Follow-ups" />
                {followUpState.status === 'loading' && <Skeleton height={20} />}
                {followUpState.status === 'error' && <ErrorState title="Couldn't load Follow-up tasks" onRetry={followUpState.refetch} />}
                {followUpState.status === 'success' &&
                  (openFollowUps && openFollowUps.length === 0 ? (
                    <EmptyState icon="checkCircle" title="No open follow-ups" description="Every follow-up in your cluster has been handled." tone="positive" />
                  ) : (
                    <>
                      <Text variant="bodySmall" color={theme.colors.text.secondary}>
                        {`${dueTodayCount} task${dueTodayCount === 1 ? '' : 's'} due today`}
                      </Text>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: theme.spacing[2],
                        }}
                      >
                        {(openFollowUps ?? []).slice(0, 3).map((task, index) => (
                          <div key={task.id}>
                            {index > 0 && <Divider />}
                            <div
                              style={{
                                paddingTop: index > 0 ? theme.spacing[2] : 0,
                              }}
                            >
                              <PersonNameText personId={task.personId} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="tertiary" size="sm" onClick={() => navigate('/pastoral-care')}>
                        View follow-ups →
                      </Button>
                    </>
                  ))}
              </div>
            </Card>
          );

          const quickActionsBlock = <QuickActionsRow title="Quick Actions" actions={BRANCH_PASTOR_QUICK_ACTIONS} />;

          const sundayChartBlock = (
            <Card padding={6} elevation={1} testId="attendance-analytics-card">
              <TrendPanel
                title="Sunday Attendance"
                description="Which Bacentas had the strongest turnout this week"
                status={performanceState.status}
                onRetry={performanceState.refetch}
                errorTitle="Couldn't load Sunday attendance"
                skeletonHeight={180}
              >
                {sundayChartData.length === 0 ? (
                  <EmptyState title="Attendance not recorded" description="Sunday attendance hasn't been recorded for this week yet." />
                ) : (
                  <BarChart data={sundayChartData} orientation="horizontal" testId="sunday-attendance-chart" />
                )}
              </TrendPanel>
            </Card>
          );

          const offeringChartBlock = (
            <Card padding={6} elevation={1} testId="offering-analytics-card">
              <TrendPanel
                title="Bacenta Meeting Offering"
                description="Which Bacentas generated the most meeting offering this week"
                status={performanceState.status}
                onRetry={performanceState.refetch}
                errorTitle="Couldn't load Bacenta meeting offering"
                skeletonHeight={180}
              >
                {offeringChartData.length === 0 ? (
                  <EmptyState title="Not recorded" description="No Bacenta meeting offering has been verified for this week yet." />
                ) : (
                  <BarChart data={offeringChartData} orientation="horizontal" formatValue={(v) => `GHS ${v.toLocaleString()}`} testId="offering-chart" />
                )}
              </TrendPanel>
            </Card>
          );

          if (isNarrow) {
            return (
              <div
                {...fadeIn(140, {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing[4],
                })}
              >
                {tableBlock}
                {needsAttentionBlock}
                {sundayChartBlock}
                {offeringChartBlock}
                {quickActionsBlock}
                {followUpsBlock}
              </div>
            );
          }

          return (
            <>
              {/* Hero row - Bacenta Performance (~65-70%) beside a compact
                operational column (~30-35%): Needs Attention, Follow-ups,
                Quick Actions, stacked to their own natural height - never
                stretched into a full-height spanning rail. */}
              <div {...fadeIn(140, heroRowStyle)}>
                {tableBlock}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: theme.spacing[4],
                  }}
                >
                  {needsAttentionBlock}
                  {followUpsBlock}
                  {quickActionsBlock}
                </div>
              </div>

              {/* Ranked comparison charts - equal width, current week only. */}
              <div {...fadeIn(220, chartsRowStyle)}>
                {sundayChartBlock}
                {offeringChartBlock}
              </div>
            </>
          );
        })()}
      </div>
    </PageContainer>
  );
}
