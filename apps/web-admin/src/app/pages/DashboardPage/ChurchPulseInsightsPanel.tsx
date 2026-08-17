import { useEffect, useState } from 'react';
import { Badge, Card, Divider, ErrorState, Heading, Icon, SampleDataBadge, Skeleton, Text, getCubicBezier, useReducedMotion, useTheme } from '@ecclesia/ui-web';
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

const GAUGE_SIZE = 136;
const GAUGE_RADIUS = 56;
const GAUGE_STROKE = 10;
const GAUGE_CENTER = GAUGE_SIZE / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/**
 * `[Dashboard Visual Redesign]` A hand-drawn SVG progress ring, same
 * "plain `<svg>`, no charting library" philosophy as `LineChart`/
 * `BarChart`/`Sparkline` (`ui-web`) - kept local to this one flagship
 * panel rather than promoted to `ui-web` since a Church Pulse gauge is a
 * one-off, band-colored visualization specific to this exact metric, not
 * a general-purpose chart type another screen would reach for (Design
 * System §7's bar for a new shared component isn't met here).
 *
 * `[Second visual redesign pass]` The score now renders *inside* the
 * ring (absolutely centered over the svg) rather than beside it - a
 * genuine gauge reading, not a decorative circle sitting next to the
 * real number. The ring itself stays `aria-hidden`, same reasoning as
 * `Sparkline`: the score is real, visible text (still a `Heading`, just
 * repositioned) and the band is a real `Badge` with text, so the ring
 * adds no information a screen reader would otherwise miss.
 *
 * `[Product Experience Sprint II, Phase 2 - "the Ecclesia moment"]` The
 * ring now draws from empty to the real score whenever that score
 * actually changes (first arrival, or a later refetch that moves the
 * number) - "motion explains change" (this sprint's own brief), not a
 * decorative flourish. Mechanism: render one frame at the *previous*
 * `strokeDashoffset`, then commit the new target a frame later so the
 * always-present CSS `transition` has something to animate between - no
 * JS animation loop, no new dependency. Skipped entirely under
 * `prefers-reduced-motion`: the ring commits straight to its final value
 * with no transition, the same "no animation, static final render"
 * precedent `LineChart`/`BarChart` already established. The track
 * (background) circle is unaffected either way - only the real-value
 * arc moves.
 */
function ChurchPulseGauge({ score, band }: { score: number; band: ReturnType<typeof getChurchPulseBand> }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, score));
  const targetDashoffset = GAUGE_CIRCUMFERENCE * (1 - clamped / 100);

  const [renderedDashoffset, setRenderedDashoffset] = useState(() => (reducedMotion ? targetDashoffset : GAUGE_CIRCUMFERENCE));

  useEffect(() => {
    if (reducedMotion) {
      setRenderedDashoffset(targetDashoffset);
      return;
    }
    const frame = requestAnimationFrame(() => setRenderedDashoffset(targetDashoffset));
    return () => cancelAnimationFrame(frame);
  }, [targetDashoffset, reducedMotion]);

  return (
    <div style={{ position: 'relative', width: GAUGE_SIZE, height: GAUGE_SIZE, flexShrink: 0 }}>
      <svg aria-hidden width={GAUGE_SIZE} height={GAUGE_SIZE} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}>
        {/* `[Product Experience Sprint II, Phase 2]` `accent.subtle` (a
            warm stone tint) replaces the previous cold `border.subtle`
            for this one resting track - the sprint's single, deliberately
            restrained demonstration of surface warmth on the product's
            one flagship visualization. */}
        <circle cx={GAUGE_CENTER} cy={GAUGE_CENTER} r={GAUGE_RADIUS} fill="none" stroke={theme.colors.accent.subtle} strokeWidth={GAUGE_STROKE} />
        <circle
          cx={GAUGE_CENTER}
          cy={GAUGE_CENTER}
          r={GAUGE_RADIUS}
          fill="none"
          stroke={band.color}
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          strokeDashoffset={renderedDashoffset}
          transform={`rotate(-90 ${GAUGE_CENTER} ${GAUGE_CENTER})`}
          style={{
            transition: reducedMotion ? 'none' : `stroke-dashoffset ${theme.motion.duration.slow}ms ${getCubicBezier(theme.motion.easing.emphasized)}`,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing[1],
        }}
      >
        <Heading level="display" color={band.color}>
          {`${Math.round(clamped)}`}
        </Heading>
        <Text variant="caption" color={theme.colors.text.secondary}>
          out of 100
        </Text>
      </div>
    </div>
  );
}

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
 *
 * `[Second visual redesign pass]` The sub-metric row is now a
 * "what's contributing" chip row beside the gauge rather than a grid of
 * tiles beneath the score, and Branch Comparison moved out into its own
 * sibling `BranchComparisonCard` (below) - same data, same disclosure,
 * different composition. See `DASHBOARD_REDESIGN_NOTES.md`.
 */
export function ChurchPulseInsightsPanel({ status, pulseScore, onRetry, openAlertCount, kpis, subMetrics }: ChurchPulseInsightsPanelProps) {
  const theme = useTheme();

  // `[Dashboard Visual Redesign]` §4.2's "hero vs. standard resting
  // elevation" exception (`ECCLESIA_DESIGN_SYSTEM.md`) - this panel is
  // the one screen-wide hero metric, so it opts into `elevation={1}` at
  // rest across every status (loading/error/success) rather than only
  // once data arrives, so the card doesn't visually "jump" elevation
  // tiers as it loads.
  if (status === 'loading') {
    return (
      <Card padding={6} elevation={1}>
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
      <Card padding={6} elevation={1}>
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
    <Card padding={6} elevation={1} testId="church-pulse-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Heading level={3}>Church Pulse — whole Branch</Heading>
          <Badge status={BAND_TO_BADGE_STATUS[band.key]}>{band.label}</Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[5], flexWrap: 'wrap' }}>
          <ChurchPulseGauge score={pulseScore.score} band={band} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3], flex: 1, minWidth: 220 }}>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              The Branch&apos;s overall engagement score, from attendance, follow-up, and serving activity across every Bacenta.
            </Text>

            {tiles.length > 0 && (
              <div>
                <Text variant="label" color={theme.colors.text.secondary}>
                  WHAT&apos;S CONTRIBUTING
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
                  {tiles.map((tile) => (
                    <div
                      key={tile.id}
                      data-testid={`pulse-submetric-${tile.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing[2],
                        padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                        borderRadius: theme.radius.full,
                        backgroundColor: theme.colors.surface.default,
                        border: `1px solid ${theme.colors.border.subtle}`,
                      }}
                    >
                      <Icon name={tile.icon} size="sm" color={theme.colors.text.secondary} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[1] }}>
                          <Text variant="bodySmall" as="span">
                            {tile.value}
                          </Text>
                          <Icon name={TREND_ICON[tile.trendDirection]} size="sm" color={theme.colors.text.secondary} />
                          {tile.isSample && <SampleDataBadge testId={`pulse-submetric-${tile.id}-sample-badge`} />}
                        </div>
                        <Text variant="caption" color={theme.colors.text.secondary}>
                          {tile.label}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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
      </div>
    </Card>
  );
}

export interface BranchComparisonCardProps {
  branches: BranchSummaryDatum[];
}

/**
 * `[Dashboard Visual Redesign, second pass]` Pulled out of
 * `ChurchPulseInsightsPanel` into its own sibling card - the "pair the
 * hero with another useful information area" brief needs a real adjacent
 * panel, not a subsection nested inside the hero card itself. Same data,
 * same Horizon 3/demo disclosure (`DEMO_COUNCIL_BRANCHES`'s own doc
 * comment in `dashboardDemoData.ts`) as before the extraction - only the
 * placement changed. Reuses `getChurchPulseBand`/`BAND_TO_BADGE_STATUS`
 * already defined in this file rather than duplicating that mapping
 * elsewhere, which is why this stays co-located here instead of moving to
 * `ResidentPastorDashboard.tsx` directly.
 */
export function BranchComparisonCard({ branches }: BranchComparisonCardProps) {
  const theme = useTheme();

  return (
    <Card padding={6} testId="branch-comparison-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
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
                <div style={{ paddingTop: index > 0 ? theme.spacing[2] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
                    <Text variant="bodySmall">{branchSummary.name}</Text>
                    <Badge status={BAND_TO_BADGE_STATUS[branchBand.key]}>{Math.round(branchSummary.pulseScore)}</Badge>
                  </div>
                  <Text variant="caption" color={theme.colors.text.secondary}>
                    {`${branchSummary.memberCount.toLocaleString()} members`}
                  </Text>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
