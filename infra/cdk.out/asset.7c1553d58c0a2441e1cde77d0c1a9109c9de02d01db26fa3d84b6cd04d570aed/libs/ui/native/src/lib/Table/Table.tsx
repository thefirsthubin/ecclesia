import type { ReactNode } from 'react';
import { FlatList, Pressable, View, Text as RNText } from 'react-native';
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
  /** Flex weight relative to other columns (not a fixed pixel width - RN's flexbox is the natural fit here, unlike web's `<table>` auto-layout). Defaults to `1`. */
  flex?: number;
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
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Table`. RN has no `<table>`
 * primitive, so this is a `View` header row + RN's own `FlatList` for the
 * data rows (real virtualization, not a plain `.map` - a Table is exactly
 * the kind of long, potentially-large list `FlatList` exists for). Column
 * headers use `flex` weighting instead of web's pixel `width`, matching
 * how every other native layout in this library already works.
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
  testId,
}: TableProps<T>) {
  const theme = useTheme();
  const selectable = Boolean(selectedIds && onSelectionChange);
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

  if (!loading && data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} testId={testId ? `${testId}-empty` : undefined} />;
  }

  const headerRow = (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, paddingVertical: theme.spacing[2] }}>
      {selectable && (
        <View style={{ width: 40, paddingHorizontal: theme.spacing[2] }}>
          <Checkbox label="Select all rows" checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
        </View>
      )}
      {columns.map((column) => {
        const isSorted = sortKey === column.key;
        const content = (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
            <RNText
              style={{
                fontFamily: theme.fontFamily.base,
                fontSize: theme.typography.label.fontSize,
                fontWeight: '600',
                color: theme.colors.text.secondary,
              }}
            >
              {column.header}
            </RNText>
            {column.sortable && (
              <Icon
                name={isSorted && sortDirection === 'desc' ? 'chevronUp' : 'chevronDown'}
                size="sm"
                color={isSorted ? theme.colors.text.primary : theme.colors.text.disabled}
              />
            )}
          </View>
        );
        return (
          <View key={column.key} style={{ flex: column.flex ?? 1, paddingHorizontal: theme.spacing[2] }}>
            {column.sortable ? (
              <Pressable
                onPress={() => onSortChange?.(column.key)}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${column.header}`}
                accessibilityState={{ selected: isSorted }}
              >
                {content}
              </Pressable>
            ) : (
              content
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View testID={testId} style={{ flex: 1 }}>
      {headerRow}
      {loading ? (
        <View style={{ gap: theme.spacing[1], paddingVertical: theme.spacing[2] }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={`skeleton-${index}`} style={{ paddingHorizontal: theme.spacing[2], paddingVertical: theme.spacing[2] }}>
              <Skeleton height={16} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={getRowId}
          renderItem={({ item }) => {
            const id = getRowId(item);
            const row = (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.spacing[3],
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.subtle,
                  backgroundColor: selectedIds?.has(id) ? theme.colors.brand.subtle : undefined,
                }}
              >
                {selectable && (
                  <View style={{ width: 40, paddingHorizontal: theme.spacing[2] }}>
                    <Checkbox label={`Select row ${id}`} checked={Boolean(selectedIds?.has(id))} onChange={() => toggleRow(id)} />
                  </View>
                )}
                {columns.map((column) => {
                  const content = column.render(item);
                  return (
                    <View key={column.key} style={{ flex: column.flex ?? 1, paddingHorizontal: theme.spacing[2] }}>
                      {typeof content === 'string' || typeof content === 'number' ? (
                        <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}>
                          {content}
                        </RNText>
                      ) : (
                        content
                      )}
                    </View>
                  );
                })}
              </View>
            );
            return onRowClick ? (
              <Pressable onPress={() => onRowClick(item)} accessibilityRole="button">
                {row}
              </Pressable>
            ) : (
              row
            );
          }}
        />
      )}
    </View>
  );
}
