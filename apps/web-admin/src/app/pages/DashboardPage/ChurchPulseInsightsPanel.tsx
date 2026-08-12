import { Badge, Card, Divider, ErrorState, Heading, Icon, SampleDataBadge, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { IconName } from '@ecclesia/ui-core';
import { getChurchPulseBand } from '@ecclesia/ui-tokens';
import type { PulseScoreResponseDto } from '@ecclesia/contracts';

import type { BranchSummaryDatum, ChurchPulseSubMetricsDatum, KpiDatum, TrendDirection } from './dashboardDemoData';

const BAND_TO_BADGE_STATUS = {
  thriving: 'success',
  healthy: 'success',
  attention: 'warning',
  atRisk: 'danger',
} as const;

const TREND_ICON: Record<TrendDirection, IconName> = { up: 'trendingUp', down: 'trendingDown', flat: 'arrowRight' };

interface SubMetricTile {
  id: string;
  label: string;
  icon: IconName;
  value: string;
  trendDirection: TrendDirection;
  trendLabel: string;
  isSample?: boolean;
}

export interface ChurchPulseInsightsPanelProps {
  status: 'loading' | 'error' | 'success';
  pulseScore?: PulseScoreResponseDto;
  onRetry: () => void;
  /** Real, from `useBranchDashboard`'s own `alerts` array - the one
   * sub-metric on this panel that is not demo data. */
  openAlertCount: number;
  /** `undefined` while `useDashboardDemoMetrics` is still loading - the
   * panel renders its own score/band from real data regardless, and only
   * the sub-metric row + insight line wait on this. */
  kpis?: KpiDatum[];
  subMetrics?: ChurchPulseSubMetricsDatum;
  /** Horizon 3 preview strip - omitted entirely (not even an empty
   * section) unless the caller passes real branch data, so the read-only
   * `ChurchPulseCard` call sites this panel does NOT replace never need
   * to reason about it. */
  branches?: BranchSummaryDatum[];
}

/**
 * `[Product Experience Sprint I]` Objective 3 - Church Pulse elevated
 * into Ecclesia's flagship dashboard feature, replacing the plain
 * `ChurchPulseCard` on `ResidentPastorDashboard` only (`ChurchPulseCard`
 * itself is untouched and still used exactly as before on
 * `InsightsPage`/`ClusterInsightsView`/`SuperAdministratorDashboard`/
 * `BranchPastorDashboard` - those are compact, often read-only or
 * cluster-scoped contexts where the full flagship treatment below would
 * be the wrong density, not a "should eventually get this too" gap).
 *
 * Same real score + band + `testId="church-pulse-card"` +
 * `"Church Pulse — whole Branch"` heading `ChurchPulseCard` already
 * rendered here (`DashboardPage.spec.tsx`'s existing RESIDENT_PASTOR
 * assertions depend on both and are otherwise unchanged this sprint) -
 * this panel is a strict superset, not a redesign of the real part.
 *
 * New below the score: a sub-metric row (Attendance/Giving/Volunteer
 * Health trends - read from the already-real `DEMO_KPIS`, not
 * duplicated; Pastoral Care Alerts - real `openAlertCount`; Follow-up
 * Health - the one genuinely new, disclosed-demo
 * `DEMO_CHURCH_PULSE_SUBMETRICS` field, see that export's own comment.
 * Engagement Trend used to render here too but moved to Insights per
 * Final UX Design Specification §14 decision 8 - see
 * `BranchTrendsSection.tsx`)
 * and one computed, actionable insight sentence - "surface actionable
 * insights instead of raw numbers" (brief, Objective 3) implemented by
 * reusing each KPI's own already-written `actionLabel` copy rather than
 * inventing a second copy-generation system: whichever real signal is
 * worst (an open alert, or the KPI trending down) drives the sentence
 * shown, so the same underlying data never has two different pieces of
 * prose describing it.
 */
export function ChurchPulseInsightsPanel({ status, pulseScore, onRetry, openAlertCount, kpis, subMetrics, branches }: ChurchPulseInsightsPanelProps) {
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <Card padding={6}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <Skeleton height={20} width="40%" />
          <Skeleton height={56} width="30%" />
          <Skeleton height={72} />
        </div>
      </Card>
    );
  }

  if (status === 'error' || !pulseScore) {
    return (
      <Card padding={6}>
        <ErrorState title="Couldn't load Church Pulse" onRetry={onRetry} />
      </Card>
    );
  }

  const band = getChurchPulseBand(pulseScore.score);
  const attendance = kpis?.find((k) => k.id === 'attendance');
  const giving = kpis?.find((k) => k.id === 'giving');
  const volunteers = kpis?.find((k) => k.id === 'volunteers');

  const tiles: SubMetricTile[] = [
    { id: 'alerts', label: 'PASTORAL CARE ALERTS', icon: 'alertTriangle', value: String(openAlertCount), trendDirection: openAlertCount > 0 ? 'down' : 'flat', trendLabel: openAlertCount > 0 ? 'Open, needs review' : 'None open' },
    ...(attendance ? [{ id: 'attendance', label: 'ATTENDANCE TREND', icon: 'calendar' as const, value: attendance.formattedValue, trendDirection: attendance.trendDirection, trendLabel: attendance.trendLabel }] : []),
    ...(giving ? [{ id: 'giving', label: 'GIVING TREND', icon: 'coins' as const, value: giving.formattedValue, trendDirection: giving.trendDirection, trendLabel: giving.trendLabel }] : []),
    ...(volunteers ? [{ id: 'volunteers', label: 'VOLUNTEER HEALTH', icon: 'userCheck' as const, value: volunteers.formattedValue, trendDirection: volunteers.trendDirection, trendLabel: volunteers.trendLabel }] : []),
    ...(subMetrics
      ? [{ id: 'followUp', label: 'FOLLOW-UP HEALTH', icon: 'checkCircle' as const, value: `${subMetrics.followUpHealthPercent}%`, trendDirection: subMetrics.followUpHealthTrend, trendLabel: 'On-time completion', isSample: true }]
      : []),
  ];

  // Worst-signal-first: an open alert beats any KPI dip (a pastoral care
  // alert is a person, not a number); otherwise the first KPI trending
  // down; otherwise a positive reinforcement line keyed to the band.
  const decliningKpi = [attendance, giving, volunteers].find((kpi) => kpi?.trendDirection === 'down');
  const insight =
    openAlertCount > 0
      ? `${openAlertCount} open pastoral care ${openAlertCount === 1 ? 'alert needs' : 'alerts need'} review before they age further.`
      : decliningKpi
        ? decliningKpi.actionLabel
        : `${band.label} and holding steady — no urgent follow-up needed today.`;

  return (
    <Card padding={6} testId="church-pulse-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Heading level={3}>Church Pulse — whole Branch</Heading>
            <Badge status={BAND_TO_BADGE_STATUS[band.key]}>{band.label}</Badge>
          </div>
          <Heading level="display" color={band.color}>
            {`${Math.round(pulseScore.score)}`}
          </Heading>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            The Branch&apos;s overall engagement score, from attendance, follow-up, and serving activity across every Bacenta.
          </Text>
        </div>

        {tiles.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: theme.spacing[4] }}>
              {tiles.map((tile) => (
                <div key={tile.id} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }} data-testid={`pulse-submetric-${tile.id}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                    <Icon name={tile.icon} size="sm" color={theme.colors.text.secondary} />
                    <Text variant="label" color={theme.colors.text.secondary}>
                      {tile.label}
                    </Text>
                    {tile.isSample && <SampleDataBadge testId={`pulse-submetric-${tile.id}-sample-badge`} />}
                  </div>
                  <Heading level={3}>{tile.value}</Heading>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                    <Icon name={TREND_ICON[tile.trendDirection]} size="sm" color={theme.colors.text.secondary} />
                    <Text variant="caption" color={theme.colors.text.secondary}>
                      {tile.trendLabel}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: theme.spacing[2],
            padding: theme.spacing[4],
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.brand.subtle,
          }}
          data-testid="pulse-insight"
        >
          <Icon name="infoCircle" size="sm" color={theme.colors.brand.default} />
          <Text variant="bodySmall">{insight}</Text>
        </div>

        {branches && branches.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                <Text variant="label" color={theme.colors.text.secondary}>
                  BRANCH COMPARISON
                </Text>
                <SampleDataBadge testId="branch-comparison-sample-badge" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {branches.map((branchSummary, index) => {
                  const branchBand = getChurchPulseBand(branchSummary.pulseScore);
                  return (
                    <div key={branchSummary.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[2] : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text variant="bodySmall">{branchSummary.name}</Text>
                        <Badge status={BAND_TO_BADGE_STATUS[branchBand.key]}>{Math.round(branchSummary.pulseScore)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
