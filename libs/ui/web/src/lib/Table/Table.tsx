import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Checkbox } from '../Checkbox';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../Skeleton';
import type { IconName } from '@ecclesia/ui-core';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** Fixed pixel width - most columns should omit this and let the table lay out naturally; use for narrow, predictable columns (a status badge, an amount) where auto-width would look jumpy across rows. */
  width?: number;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: IconName;
  /** Passed through to `EmptyState`'s own `tone` - `'positive'` for a
   * "you're caught up" empty queue (a green check, not a neutral gray
   * one), same distinction `EmptyState` already draws. */
  emptyTone?: 'neutral' | 'positive';
  testId?: string;
  /** `[UX Design Implementation]` Final UX Design Specification §9 - an
   * optional full-width detail row rendered directly beneath a given row
   * (via `colSpan`), for the inline reveal-forms Pastoral Care's
   * Follow-up queue (Escalate) and Stewardship's transaction queue (Flag
   * reason) already had before their Table adoption - this preserves
   * that exact interaction rather than forcing it into a Modal/Drawer,
   * which would be a product-behavior change, not a markup change.
   * Both `isRowExpanded` and `renderRowDetail` must be passed together to
   * opt in; omit both for a plain table. */
  isRowExpanded?: (row: T) => boolean;
  renderRowDetail?: (row: T) => ReactNode;
}

/**
 * Tabular data display (Design System v1.0 Part 7 Navigation/Data tier) -
 * a real `<table>` (never a `<div>` grid), so a screen reader announces
 * row/column position and header association for free, and sortable
 * columns use `aria-sort` on the `<th>` rather than a decoration-only icon.
 * Composes existing components rather than reinventing them: `EmptyState`
 * for the no-rows case, `Skeleton` rows for loading, `Checkbox` for
 * optional row selection (with an indeterminate "select all" in the
 * header) - the same "don't re-solve a solved problem" discipline `Select`/
 * `Drawer` followed by reusing `Modal`.
 */
export function Table<T>({
  columns,
  data,
  getRowId,
  sortKey,
  sortDirection = 'asc',
  onSortChange,
  onRowClick,
  selectedIds,
  onSelectionChange,
  loading = false,
  emptyTitle = 'No records',
  emptyDescription,
  emptyIcon,
  emptyTone,
  testId,
  isRowExpanded,
  renderRowDetail,
}: TableProps<T>) {
  const theme = useTheme();
  const selectable = Boolean(selectedIds && onSelectionChange);
  const columnCount = columns.length + (selectable ? 1 : 0);
  const allIds = data.map(getRowId);
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedIds?.has(id));
  const someSelected = selectable && allIds.some((id) => selectedIds?.has(id)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(allIds));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const thStyle = (align: TableColumn<T>['align']): CSSProperties => ({
    textAlign: align ?? 'left',
    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
    fontFamily: theme.fontFamily.base,
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    color: theme.colors.text.secondary,
    borderBottom: `1px solid ${theme.colors.border.default}`,
    whiteSpace: 'nowrap',
  });

  const tdStyle = (align: TableColumn<T>['align']): CSSProperties => ({
    textAlign: align ?? 'left',
    padding: `${theme.spacing[3]}px`,
    fontFamily: theme.fontFamily.base,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.primary,
    borderBottom: `1px solid ${theme.colors.border.subtle}`,
  });

  if (!loading && data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} tone={emptyTone} testId={testId ? `${testId}-empty` : undefined} />;
  }

  return (
    // `[UX Design Implementation]` Final UX Design Specification §19
    // (Phase 3 People workflow UI, tablet-usability pass) - the table
    // itself scrolls horizontally within this wrapper rather than
    // forcing the whole page to scroll sideways once its natural
    // content width exceeds a narrow/tablet viewport. No visual change
    // at desktop widths, where the table already fits.
    <div style={{ overflowX: 'auto' }}>
      <table data-testid={testId} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {selectable && (
              <th scope="col" style={{ ...thStyle('left'), width: 40 }}>
                <Checkbox label="Select all rows" checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.key} scope="col" style={{ ...thStyle(column.align), width: column.width }} aria-sort={sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortChange?.(column.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: theme.spacing[1],
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    {column.header}
                    <Icon name={sortKey === column.key && sortDirection === 'desc' ? 'chevronUp' : 'chevronDown'} size="sm" color={sortKey === column.key ? theme.colors.text.primary : theme.colors.text.disabled} />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {selectable && <td style={tdStyle('left')} />}
                  {columns.map((column) => (
                    <td key={column.key} style={tdStyle(column.align)}>
                      <Skeleton height={16} />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row) => {
                const id = getRowId(row);
                const expanded = Boolean(isRowExpanded?.(row));
                return (
                  <Fragment key={id}>
                    <tr
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={
                        onRowClick
                          ? (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onRowClick(row);
                              }
                            }
                          : undefined
                      }
                      tabIndex={onRowClick ? 0 : undefined}
                      role={onRowClick ? 'button' : undefined}
                      style={{ cursor: onRowClick ? 'pointer' : undefined, backgroundColor: selectedIds?.has(id) ? theme.colors.brand.subtle : undefined }}
                    >
                      {selectable && (
                        <td style={tdStyle('left')} onClick={(e) => e.stopPropagation()}>
                          <Checkbox label={`Select row ${id}`} checked={Boolean(selectedIds?.has(id))} onChange={() => toggleRow(id)} />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} style={tdStyle(column.align)}>
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                    {expanded && renderRowDetail && (
                      <tr>
                        <td colSpan={columnCount} style={{ ...tdStyle('left'), backgroundColor: theme.colors.surface.default }}>
                          {renderRowDetail(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
