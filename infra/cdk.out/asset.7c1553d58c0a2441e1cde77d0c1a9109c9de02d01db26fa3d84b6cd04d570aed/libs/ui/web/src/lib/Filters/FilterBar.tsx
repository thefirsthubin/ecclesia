import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface FilterChipData {
  id: string;
  label: string;
}

export interface FilterBarProps {
  /** The currently-active filters, already resolved to a display label by the caller (e.g. "Branch: Accra Central", "Status: Overdue") - this component only knows how to display and remove a filter, not how to build one (per-field filter editors are business-domain UI, out of this library's scope). */
  filters: FilterChipData[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  /** A trailing slot for the caller's own "Add filter" control (typically a `Select` or a `Button` opening a `Drawer`) - kept as a slot rather than this component owning a generic filter-builder UI. */
  children?: ReactNode;
  testId?: string;
}

/**
 * The active-filter chip row above a filtered list/table (Design System
 * v1.0 Part 7.8's Filters concept). Each chip is a labelled, removable
 * pill; "Clear all" only renders once there's something to clear. This
 * is deliberately a thin display component, not a filter-builder -
 * building filter *values* (date ranges, multi-selects, etc.) is business
 * logic per screen, this only renders the resulting chips.
 */
export function FilterBar({ filters, onRemove, onClearAll, children, testId }: FilterBarProps) {
  const theme = useTheme();

  if (filters.length === 0 && !children) {
    return null;
  }

  return (
    <div data-testid={testId} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing[2] }}>
      {filters.map((filter) => (
        <span
          key={filter.id}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: theme.spacing[1],
            padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
            borderRadius: theme.radius.full,
            border: `1px solid ${theme.colors.border.default}`,
            backgroundColor: theme.colors.surface.raised,
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.bodySmall.fontSize,
            color: theme.colors.text.primary,
          }}
        >
          {filter.label}
          <button
            type="button"
            aria-label={`Remove filter: ${filter.label}`}
            onClick={() => onRemove(filter.id)}
            style={{ display: 'inline-flex', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: theme.colors.text.secondary }}
          >
            <Icon name="close" size="sm" />
          </button>
        </span>
      ))}
      {filters.length > 0 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.bodySmall.fontSize,
            fontWeight: 600,
            color: theme.colors.brand.default,
          }}
        >
          Clear all
        </button>
      )}
      {children}
    </div>
  );
}
