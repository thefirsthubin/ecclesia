import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@ecclesia/ui-native';
import type { AttendanceStatusDto } from '@ecclesia/contracts';

const OPTIONS: { value: AttendanceStatusDto; label: string; statusKey: 'success' | 'danger' | 'warning' }[] = [
  { value: 'PRESENT', label: 'Present', statusKey: 'success' },
  { value: 'ABSENT', label: 'Absent', statusKey: 'danger' },
  { value: 'EXCUSED', label: 'Excused', statusKey: 'warning' },
];

export interface AttendanceStatusToggleProps {
  value: AttendanceStatusDto | undefined;
  onChange: (status: AttendanceStatusDto) => void;
  accessibilityLabelPrefix: string;
  testId?: string;
}

/**
 * Screen-local tri-state control for one roster row's attendance status.
 * Design System v1.0 §7.5's "radio = single-select, small set" shape (3
 * mutually exclusive options) - deliberately not modeled as `switch`,
 * since §7.5 reserves switches for immediate-effect, no-save toggles, and
 * this control's changes are staged locally and committed together by
 * `AttendanceCaptureScreen`'s single Save action (FR-GTH-03: attendance
 * is recorded for the Gathering as one action, not committed per-tap).
 *
 * `@ecclesia/ui-native` has no built-in segmented-control/radio-group
 * component - its inventory is a fixed 12 (Text, Heading, Button, Card,
 * Badge, Avatar, Input, Divider, Spinner, Skeleton, EmptyState,
 * ErrorState; see `SHEPHERD_DASHBOARD_DESIGN_NOTES.md`'s "no new base
 * component" precedent). This composes `Pressable`+`Text` directly,
 * screen-local, rather than adding a 13th shared component for a control
 * only this screen currently needs.
 */
export function AttendanceStatusToggle({ value, onChange, accessibilityLabelPrefix, testId }: AttendanceStatusToggleProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing[2] }} testID={testId}>
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        const statusColors = theme.colors.status[option.statusKey];
        const background = selected ? statusColors.background : theme.colors.surface.raised;
        const border = selected ? statusColors.border : theme.colors.border.default;
        const text = selected ? statusColors.foreground : theme.colors.text.secondary;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${accessibilityLabelPrefix}: ${option.label}`}
            hitSlop={4}
            style={{
              flex: 1,
              minHeight: theme.touchTarget.minIOS,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.sm,
              borderWidth: selected ? 2 : 1,
              borderColor: border,
              backgroundColor: background,
            }}
          >
            <Text variant="bodySmall" color={text}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
