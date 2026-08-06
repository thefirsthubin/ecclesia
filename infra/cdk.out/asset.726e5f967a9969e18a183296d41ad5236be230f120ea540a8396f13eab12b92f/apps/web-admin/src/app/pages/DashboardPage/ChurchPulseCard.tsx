import { Badge, Card, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import { getChurchPulseBand } from '@ecclesia/ui-tokens';
import type { PulseScoreResponseDto } from '@ecclesia/contracts';

const BAND_TO_BADGE_STATUS = {
  thriving: 'success',
  healthy: 'success',
  attention: 'warning',
  atRisk: 'danger',
} as const;

export interface ChurchPulseCardProps {
  status: 'loading' | 'error' | 'success';
  pulseScore?: PulseScoreResponseDto;
  onRetry: () => void;
  /** `[Design Decision, Insights Web Admin sprint]` Defaults to the
   * original "whole Branch" heading so `ResidentPastorDashboard`'s
   * existing usage is unaffected. Insights' cluster drill-down passes a
   * Bacenta name here instead, since this same card is reused for both
   * surfaces rather than duplicated - see `INSIGHTS_PAGE_DESIGN_NOTES.md`. */
  scopeLabel?: string;
}

/**
 * Primary metric zone (Design System §4.3, Resident Pastor row):
 * "Branch-wide Church Pulse — 'the one number that tells me the true
 * health of the church' (PRD §11.2)." Same `getChurchPulseBand` logic
 * `apps/mobile`'s `ChurchPulseCard` uses, ported to `@ecclesia/ui-web`.
 */
export function ChurchPulseCard({ status, pulseScore, onRetry, scopeLabel = 'whole Branch' }: ChurchPulseCardProps) {
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <Card padding={6}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
          <Skeleton height={20} width="40%" />
          <Skeleton height={56} width="30%" />
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

  return (
    <Card padding={6} testId="church-pulse-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Heading level={3}>{`Church Pulse — ${scopeLabel}`}</Heading>
          <Badge status={BAND_TO_BADGE_STATUS[band.key]}>{band.label}</Badge>
        </div>
        <Heading level="display" color={band.color}>
          {`${Math.round(pulseScore.score)}`}
        </Heading>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          The Branch&apos;s overall engagement score, from attendance, follow-up, and serving activity across every Bacenta.
        </Text>
      </div>
    </Card>
  );
}
