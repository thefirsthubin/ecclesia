import { Badge } from './Badge';

export interface SampleDataBadgeProps {
  testId?: string;
}

/**
 * `[UX Design Implementation]` Final UX Design Specification §8/§17
 * (decision 4) - the one, systemwide answer to "demo data must always be
 * visibly labeled, never look real": every screen with data that isn't
 * backed by a real `apps/api` fetch gets this exact badge, nothing
 * bespoke per screen. Reuses the Warning hue rather than a new color
 * (§8's own reasoning: "this isn't real" is itself an attention-worthy
 * fact), so no new token was added to `libs/ui/tokens` for it.
 */
export function SampleDataBadge({ testId }: SampleDataBadgeProps) {
  return (
    <Badge status="warning" testId={testId ?? 'sample-data-badge'}>
      Sample data
    </Badge>
  );
}
