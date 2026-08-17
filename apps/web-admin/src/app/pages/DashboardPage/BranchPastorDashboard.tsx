import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { BarChart, Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';

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
  { label: 'Review offering', icon: 'coins', href: '/stewardship' },
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
    items.push({ id: 'missing-sunday', description: 'Sunday attendance not recorded for this week yet.' });
  }
  for (const row of rows) {
    if (row.meetingAttendance === null) {
      items.push({ id: `missing-meeting-${row.groupId}`, bacentaName: row.name, description: 'Meeting attendance missing.' });
    }
  }
  for (const row of rows) {
    if (row.meetingOfferingMinor === null) {
      items.push({ id: `missing-offering-${row.groupId}`, bacentaName: row.name, description: 'Meeting offering not recorded.' });
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
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `Week of ${startLabel} – ${endLabel}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** One quiet metric in the KPI strip - value and label share one text
 * baseline ("8 Bacentas"), deliberately not a boxed/iconed card: the
 * approved spec is explicit that these four numbers must read as "one
 * unified summary line", with the Bacenta Performance table remaining
 * the dashboard's dominant visual element. */
function MetricItem({ value, label, testId }: { value: string | undefined; label: string; testId?: string }) {
  const theme = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[1], flexShrink: 0 }} data-testid={testId}>
      {value === undefined ? (
        <Skeleton height={22} width={48} />
      ) : (
        <Text as="span" variant="numericTabular" color={theme.colors.text.primary}>
          {value}
        </Text>
      )}
      <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
        {label}
      </Text>
    </div>
  );
}

/**
 * `[Branch Pastor Dashboard sprint, approved spec]` Rebuilt around the
 * single question a Branch Pastor needs answered in seconds: "how are
 * all the Bacentas under my branch performing this week?" -
 * `BacentaPerformanceTable` is the dominant module (roughly 65-70% of the
 * main content width, per the approved composition), paired with a
 * compact Needs Attention / Follow-ups / Quick Actions column rather than
 * a full-height spanning right rail. Church Pulse stays a Resident
 * Pastor-only flagship (see `ChurchPulseInsightsPanel.tsx`'s own doc
 * comment) - this dashboard doesn't render it at all.
 *
 * **Real, live data** (see `useBranchPastorDashboardData.ts` for the full
 * per-metric endpoint trace): Bacenta list/names, members per Bacenta,
 * Sunday attendance by Bacenta, Bacenta meeting attendance by Bacenta,
 * Bacenta meeting offering by Bacenta, and Needs Attention (missing-
 * record facts + real Insights alerts merged across the cluster) are all
 * real, composed from existing endpoints. No demo data anywhere on this
 * dashboard.
 *
 * **Historical trend, explicitly not built**: the two ranked comparison
 * charts below compare Bacentas for the *current* week only - no
 * multi-week aggregate endpoint exists for either metric (confirmed
 * again this sprint), so no line/trend chart is rendered for either.
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

  const followUpQuery = resolveDefaultFollowUpTaskQuery({ role: 'ASSISTANT_PASTOR', clusterBacentaIds });
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
      <div style={{ maxWidth: 720 }}>
        <EmptyState
          icon="home"
          title="No Bacentas assigned"
          description="This branch currently has no Bacentas assigned to your pastoral oversight."
        />
      </div>
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
    .map((row) => ({ label: row.name, value: Number(row.meetingOfferingMinor) / 100 }))
    .sort((a, b) => b.value - a.value);

  const fadeIn = (delayMs: number, extraStyle: CSSProperties = {}): { className: string; style: CSSProperties } => ({
    className: 'ecclesia-dashboard-fade-in',
    style: { animationDelay: `${delayMs}ms`, ...extraStyle },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 1600 }}>
      {/* Quiet page header (approved spec: title / church · branch / current
          reporting period - no personalized greeting, no hero, no giant
          alert banner). Local to this persona - the shared `DashboardHeader`
          every other dashboard uses is untouched. */}
      <div {...fadeIn(0, { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing[4], flexWrap: 'wrap' })}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
          <Heading level={1}>Branch Pastor Dashboard</Heading>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {`${CHURCH_NAME} · ${branchName}`}
            {weekStartDateOnly ? ` · ${formatWeekRangeLabel(weekStartDateOnly)}` : ''}
          </Text>
        </div>
        {attentionItems.length > 0 && (
          <Badge status="warning" testId="dashboard-header-alert-glance">
            {`${attentionItems.length} need${attentionItems.length === 1 ? 's' : ''} attention`}
          </Badge>
        )}
      </div>

      {/* Quiet KPI strip - one unified summary line, not four decorative
          cards. Numbers are readable, but stay visually subordinate to the
          Bacenta Performance table below. */}
      <Card padding={3} testId="branch-kpi-strip">
        <div
          style={
            isNarrow
              ? { display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', rowGap: theme.spacing[3], columnGap: theme.spacing[5] }
              : { display: 'flex', alignItems: 'center', gap: theme.spacing[5], flexWrap: 'wrap' }
          }
        >
          <MetricItem testId="branch-kpi-bacentas" value={String(totalBacentas)} label="Bacentas" />
          {!isNarrow && <Divider orientation="vertical" />}
          <MetricItem testId="branch-kpi-members" value={totalMembers === undefined ? undefined : String(totalMembers)} label="Members" />
          {!isNarrow && <Divider orientation="vertical" />}
          <MetricItem
            testId="branch-kpi-sunday-attendance"
            value={sundayTotal === undefined ? undefined : sundayTotal === null ? 'Not yet recorded' : String(sundayTotal)}
            label={sundayTotal === null ? '' : 'Attendance'}
          />
          {!isNarrow && <Divider orientation="vertical" />}
          <MetricItem
            testId="branch-kpi-offering"
            value={offeringTotal === undefined ? undefined : offeringTotal === null ? 'Not yet recorded' : formatAmountMinor(offeringTotal, 'GHS')}
            label={offeringTotal === null ? '' : 'Meeting Offering'}
          />
        </div>
      </Card>

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

        const needsAttentionBlock = (
          <Card padding={4} testId="needs-attention-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Heading level={3}>Needs your attention</Heading>
              {performanceState.status === 'loading' || alertsState.status === 'loading' ? (
                <Skeleton height={20} />
              ) : attentionItems.length === 0 ? (
                <EmptyState icon="checkCircle" title="Nothing needs attention" description="Every Bacenta has this week's records in, and there are no open alerts." tone="positive" />
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                    {attentionItems.slice(0, 5).map((item, index) => {
                      const alert = item.alert;
                      return (
                        <div key={item.id}>
                          {index > 0 && <Divider />}
                          <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
                              {item.bacentaName ? (
                                <Text as="span" variant="label" color={theme.colors.text.secondary}>
                                  {item.bacentaName.toUpperCase()}
                                </Text>
                              ) : (
                                <Text as="span" variant="label" color={theme.colors.text.secondary}>
                                  BRANCH-WIDE
                                </Text>
                              )}
                              {alert && (
                                <Button
                                  variant="tertiary"
                                  size="sm"
                                  loading={resolvingAlertId === alert.id}
                                  onClick={() => void resolveAlert(alert.id)}
                                  accessibilityLabel={`Resolve alert: ${alert.alertType}`}
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                            <Text variant="bodySmall">{item.description}</Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="tertiary" size="sm" onClick={() => navigate('/insights')}>
                    View all →
                  </Button>
                </>
              )}
            </div>
          </Card>
        );

        const followUpsBlock = (
          <Card padding={4} testId="branch-pastor-followups-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Heading level={3}>Follow-ups</Heading>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                      {(openFollowUps ?? []).slice(0, 3).map((task, index) => (
                        <div key={task.id}>
                          {index > 0 && <Divider />}
                          <div style={{ paddingTop: index > 0 ? theme.spacing[2] : 0 }}>
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

        const quickActionsBlock = <QuickActionsRow title="Quick actions" actions={BRANCH_PASTOR_QUICK_ACTIONS} />;

        const sundayChartBlock = (
          <Card padding={6} testId="attendance-analytics-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              <div>
                <Heading level={3}>Sunday Attendance</Heading>
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  Which Bacentas had the strongest turnout this week
                </Text>
              </div>
              {performanceState.status === 'loading' ? (
                <Skeleton height={180} />
              ) : sundayChartData.length === 0 ? (
                <EmptyState title="Attendance not recorded" description="Sunday attendance hasn't been recorded for this week yet." />
              ) : (
                <BarChart data={sundayChartData} orientation="horizontal" testId="sunday-attendance-chart" />
              )}
            </div>
          </Card>
        );

        const offeringChartBlock = (
          <Card padding={6} testId="offering-analytics-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              <div>
                <Heading level={3}>Bacenta Meeting Offering</Heading>
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  Which Bacentas generated the most meeting offering this week
                </Text>
              </div>
              {performanceState.status === 'loading' ? (
                <Skeleton height={180} />
              ) : offeringChartData.length === 0 ? (
                <EmptyState title="Not recorded" description="No Bacenta meeting offering has been verified for this week yet." />
              ) : (
                <BarChart data={offeringChartData} orientation="horizontal" formatValue={(v) => `GHS ${v.toLocaleString()}`} testId="offering-chart" />
              )}
            </div>
          </Card>
        );

        if (isNarrow) {
          return (
            <div {...fadeIn(80, { display: 'flex', flexDirection: 'column', gap: theme.spacing[4] })}>
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
            <div {...fadeIn(80, heroRowStyle)}>
              {tableBlock}
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                {needsAttentionBlock}
                {followUpsBlock}
                {quickActionsBlock}
              </div>
            </div>

            {/* Ranked comparison charts - equal width, current week only. */}
            <div {...fadeIn(160, chartsRowStyle)}>
              {sundayChartBlock}
              {offeringChartBlock}
            </div>
          </>
        );
      })()}
    </div>
  );
}
