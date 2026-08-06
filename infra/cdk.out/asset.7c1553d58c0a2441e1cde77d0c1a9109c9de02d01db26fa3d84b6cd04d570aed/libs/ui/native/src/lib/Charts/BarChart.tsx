import { View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  formatValue?: (value: number) => string;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `BarChart` - same plain-`View`
 * approach (no `react-native-svg` needed for straight bars), same
 * accessibility choice: each value is real visible `Text`, not encoded
 * only in bar height.
 */
export function BarChart({ data, height = 160, formatValue = (v) => String(v), testId }: BarChartProps) {
  const theme = useTheme();
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  return (
    <View testID={testId} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing[3], height, paddingTop: theme.spacing[4] }}>
      {data.map((datum) => {
        const barHeight = Math.max(2, (datum.value / maxValue) * (height - 40));
        return (
          <View key={datum.label} style={{ alignItems: 'center', gap: theme.spacing[1], flex: 1 }}>
            <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, fontWeight: '600', color: theme.colors.text.primary }}>
              {formatValue(datum.value)}
            </RNText>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ width: '100%', maxWidth: 40, height: barHeight, borderRadius: theme.radius.sm, backgroundColor: datum.color ?? theme.colors.brand.default }}
            />
            <RNText
              numberOfLines={1}
              style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary, textAlign: 'center' }}
            >
              {datum.label}
            </RNText>
          </View>
        );
      })}
    </View>
  );
}
