import { Button, Heading, Icon, Text, useTheme } from '@ecclesia/ui-web';
import type { IconName } from '@ecclesia/ui-core';

import { useNavigate } from '../../router/router';

interface QuickAction {
  label: string;
  description: string;
  icon: IconName;
  href: string;
}

/**
 * Quick actions zone (Design System v1.0 Part 4.2, zone 3 of 5). Every
 * target here is an existing route already in `app.tsx`'s route table -
 * no new route is introduced (redesign brief: "Do NOT change ... routing"),
 * this is only a set of fast, prominent entry points into pages that
 * already exist.
 *
 * `[Reference-image iteration]` Restyled from a horizontal tile grid into
 * a vertical stack of colorful cards, mirroring the reference dashboard's
 * "Select a course" right column. Each card's tint rotates through
 * existing semantic tokens (`brand.subtle`/`status.info.background`/
 * `status.success.background`) rather than the reference's literal
 * pink/lavender hues - keeps the "borrow the layout, keep the brand
 * palette" decision consistent card-by-card, not just at the top level.
 */
const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Add a New Member', description: 'Record a new Person in the Branch directory', icon: 'userPlus', href: '/people' },
  { label: "Record This Week's Giving", description: 'Log a Financial Transaction', icon: 'coins', href: '/stewardship' },
  { label: 'Plan an Upcoming Gathering', description: 'Record a Gathering and its attendance', icon: 'calendar', href: '/gatherings' },
];

export function QuickActionsRow() {
  const theme = useTheme();
  const navigate = useNavigate();

  const tints = [
    { background: theme.colors.brand.subtle, foreground: theme.colors.brand.default },
    { background: theme.colors.status.info.background, foreground: theme.colors.status.info.strong },
    { background: theme.colors.status.success.background, foreground: theme.colors.status.success.strong },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }} data-testid="quick-actions-card">
      <Heading level={3}>Quick actions</Heading>
      {QUICK_ACTIONS.map((action, index) => {
        const tint = tints[index % tints.length];
        return (
          <div
            key={action.href}
            data-testid={`quick-action-${action.href.slice(1)}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing[3],
              padding: theme.spacing[5],
              borderRadius: theme.radius.md,
              backgroundColor: tint.background,
            }}
          >
            <div
              aria-hidden
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.surface.raised,
              }}
            >
              <Icon name={action.icon} size="md" color={tint.foreground} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
              <Text variant="body" as="span" color={theme.colors.text.primary}>
                {action.label}
              </Text>
              <Text variant="caption" color={theme.colors.text.secondary}>
                {action.description}
              </Text>
            </div>
            <Button variant="primary" size="sm" iconRight="arrowRight" onClick={() => navigate(action.href)}>
              Go
            </Button>
          </div>
        );
      })}
    </div>
  );
}
