import { useState } from 'react';
import { Badge, Button, Card, EmptyState, ErrorState, Icon, LineChart, MetricCard, PageContainer, PageHeader, SectionHeader, Text, TrendPanel, useTheme } from '@ecclesia/ui-web';
import type { GetGivingTrendQuery } from '@ecclesia/contracts';
import type { IconName } from '@ecclesia/ui-core';

import { useAuth } from '../../auth/AuthContext';
import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import { summarizeTrend, useTreasurerInsightsData } from './useTreasurerInsightsData';
import type { GivingTrendFilter } from './useTreasurerInsightsData';

const GRANULARITY_OPTIONS: { value: GetGivingTrendQuery['granularity']; label: string; count: number }[] = [
  { value: 'week', label: 'Weekly', count: 8 },
  { value: 'month', label: 'Monthly', count: 6 },
  { value: 'year', label: 'Yearly', count: 5 },
];

const CATEGORY_OPTIONS: { value: GetGivingTrendQuery['gatheringCategory'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'MIDWEEK', label: 'Midweek' },
  { value: 'BACENTA_MEETING', label: 'Bacenta' },
  { value: 'BASONTA_MEETING', label: 'Basonta' },
  { value: 'OTHER', label: 'Other' },
];

const TREND_ICON: Record<'up' | 'down' | 'flat', IconName> = { up: 'trendingUp', down: 'trendingDown', flat: 'arrowRight' };

/**
 * `[Milestone D — Portal Experiences]` Branch Treasurer Insights (Portal
 * 1 spec: "weekly trend, monthly trend, yearly trend; Sunday, Midweek,
 * Bacenta, Basonta, Other; totals, trend direction, comparison, growth
 * where mathematically supported"). Every control here maps to a real
 * `GET /insights/giving-trend` query param
 * (`useTreasurerInsightsData`/`granularity`/`gatheringCategory`) - no
 * client-side faking of a dimension the backend doesn't actually filter
 * by. `summarizeTrend`'s own doc comment covers the honesty rules for
 * totals/direction/growth (never divide by zero, never invent a trend
 * from fewer than two real data points).
 */
export function TreasurerInsightsView() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;

  const [granularity, setGranularity] = useState<GetGivingTrendQuery['granularity']>('month');
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]['value']>('ALL');

  const selectedGranularity = GRANULARITY_OPTIONS.find((option) => option.value === granularity) ?? GRANULARITY_OPTIONS[1];
  const filter: GivingTrendFilter = {
    granularity,
    count: selectedGranularity.count,
    gatheringCategory: category === 'ALL' ? undefined : category,
  };

  const trendState = useTreasurerInsightsData(accessToken, filter);

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Insights" context={state.status === 'authenticated' ? state.actor.branchName : ''} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <div role="group" aria-label="Trend granularity" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
            {GRANULARITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={granularity === option.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setGranularity(option.value)}
                aria-pressed={granularity === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div role="group" aria-label="Giving category" style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
            {CATEGORY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={category === option.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCategory(option.value)}
                aria-pressed={category === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Card padding={6} elevation={1} testId="treasurer-insights-chart-card">
          <TrendPanel
            title={`${selectedGranularity.label} Giving Trend`}
            description={category === 'ALL' ? 'Every attribution combined' : `${CATEGORY_OPTIONS.find((c) => c.value === category)?.label} giving only`}
            status={trendState.status}
            onRetry={trendState.refetch}
            errorTitle="Couldn't load the giving trend"
            skeletonHeight={200}
          >
            {trendState.status === 'success' &&
              (trendState.data.buckets.every((bucket) => bucket.totalAmountMinor === '0') ? (
                <EmptyState icon="trendingUp" title="No giving recorded" description="No giving has been recorded in this window yet." />
              ) : (
                <LineChart
                  data={trendState.data.buckets.map((bucket) => ({ label: bucket.label, value: Number(bucket.totalAmountMinor) / 100 }))}
                  height={200}
                  testId="treasurer-insights-line-chart"
                />
              ))}
          </TrendPanel>
        </Card>

        {trendState.status === 'success' &&
          (() => {
            const summary = summarizeTrend(trendState.data);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: theme.spacing[3] }}>
                <MetricCard
                  label="Total"
                  value={formatAmountMinor(summary.totalMinor, 'GHS')}
                  context={`Across ${trendState.data.buckets.length} ${selectedGranularity.value}${trendState.data.buckets.length === 1 ? '' : 's'}`}
                  testId="metric-insights-total"
                />
                <MetricCard
                  label="Most Recent"
                  value={summary.latestMinor === null ? null : formatAmountMinor(summary.latestMinor, 'GHS')}
                  context={trendState.data.buckets[trendState.data.buckets.length - 1]?.label ?? 'No data yet'}
                  testId="metric-insights-latest"
                />
                <MetricCard
                  label="Trend"
                  value={summary.direction === null ? null : summary.direction === 'flat' ? 'No change' : summary.direction === 'up' ? 'Increasing' : 'Decreasing'}
                  context="vs. the prior period"
                  trailing={summary.direction && <Icon name={TREND_ICON[summary.direction]} size="sm" color={theme.colors.text.secondary} />}
                  testId="metric-insights-direction"
                />
                <MetricCard
                  label="Growth"
                  value={summary.growthPercent === null ? null : `${summary.growthPercent > 0 ? '+' : ''}${summary.growthPercent}%`}
                  context="vs. the prior period"
                  tone={summary.growthPercent !== null && summary.growthPercent < 0 ? 'attention' : 'neutral'}
                  testId="metric-insights-growth"
                />
              </div>
            );
          })()}

        {trendState.status === 'success' && trendState.data.unattributedAmountMinor !== '0' && (
          <Card padding={4} testId="unattributed-giving-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                Giving in this window with no linked Gathering or Group
              </Text>
              <Badge status="neutral">{formatAmountMinor(trendState.data.unattributedAmountMinor, 'GHS')}</Badge>
            </div>
          </Card>
        )}

        {trendState.status === 'success' && trendState.data.unmappedGatheringTypes.length > 0 && (
          <Card padding={4} testId="unmapped-gathering-types-card">
            <SectionHeader
              title="Some Gathering types aren't categorized yet"
              description={`Excluded from this category filter: ${trendState.data.unmappedGatheringTypes.join(', ')}`}
            />
          </Card>
        )}

        {trendState.status === 'error' && <ErrorState title="Couldn't load Insights" onRetry={trendState.refetch} />}
      </div>
    </PageContainer>
  );
}
