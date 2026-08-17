import { Card, Heading, Icon, Text, useTheme } from '@ecclesia/ui-web';
import type { IconName } from '@ecclesia/ui-core';

import { useNavigate } from '../../router/router';

export interface QuickAction {
  label: string;
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
 * `[Dashboard Visual Redesign, second pass]` Compacted from a vertical
 * stack of three full tinted cards (icon well + title + description +
 * full `Button`) into a tight row-per-action list, each row its own
 * small `Card interactive` (reused, not reimplemented - same
 * role="button"/keyboard/hover-elevation/focus-ring behavior every other
 * interactive card in the product already has) rather than a hand-rolled
 * clickable `<div>`. This card now shares a narrow column with
 * `PrayerFocusCard` rather than owning a full column on its own, so it
 * needed to shrink to a fraction of its previous height. The previous
 * version's tint rotation and description copy are dropped as the thing
 * that no longer fits this density, not the navigation behavior itself
 * (same three real hrefs).
 *
 * `[Branch Pastor Dashboard sprint]` `actions` is now a prop, defaulting
 * to the same three Resident Pastor actions this component always had -
 * every existing call site keeps its exact prior behavior unchanged.
 * `BranchPastorDashboard` is the first caller to pass its own list
 * (Bacenta-oversight actions, not Resident Pastor's) - a real, named
 * repeated pattern (a titled list of navigation rows) justified
 * generalizing this component instead of hand-rolling a near-duplicate.
 */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Add a New Member', icon: 'userPlus', href: '/people' },
  { label: "Record This Week's Giving", icon: 'coins', href: '/stewardship' },
  { label: 'Plan an Upcoming Gathering', icon: 'calendar', href: '/gatherings' },
];

export interface QuickActionsRowProps {
  title?: string;
  actions?: QuickAction[];
}

export function QuickActionsRow({ title = 'Quick actions', actions = DEFAULT_QUICK_ACTIONS }: QuickActionsRowProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="quick-actions-card">
      <Heading level={3}>{title}</Heading>
      {actions.map((action) => (
        <Card key={action.href} interactive onClick={() => navigate(action.href)} padding={2} testId={`quick-action-${action.href.slice(1)}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <div
              aria-hidden
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.brand.subtle,
              }}
            >
              <Icon name={action.icon} size="sm" color={theme.colors.brand.default} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text variant="bodySmall" as="span" color={theme.colors.text.primary}>
                {action.label}
              </Text>
            </div>
            <Icon name="arrowRight" size="sm" color={theme.colors.text.secondary} />
          </div>
        </Card>
      ))}
    </div>
  );
}
