import type { ReactNode } from 'react';
import { Pressable, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  expandedIds: string[];
  onChange: (expandedIds: string[]) => void;
  allowMultiple?: boolean;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Accordion`. Each header is a
 * `Pressable` with `accessibilityRole="button"` and
 * `accessibilityState.expanded` - RN has no `role="region"` landmark
 * concept for the panel the way web's ARIA does, so the panel is a plain
 * conditionally-rendered `View`; the header's own expanded-state
 * announcement is the accessibility signal available on this platform.
 */
export function Accordion({ items, expandedIds, onChange, allowMultiple = false, testId }: AccordionProps) {
  const theme = useTheme();

  const toggle = (id: string) => {
    const isExpanded = expandedIds.includes(id);
    if (allowMultiple) {
      onChange(isExpanded ? expandedIds.filter((existing) => existing !== id) : [...expandedIds, id]);
    } else {
      onChange(isExpanded ? [] : [id]);
    }
  };

  return (
    <View testID={testId}>
      {items.map((item, index) => {
        const isExpanded = expandedIds.includes(item.id);
        return (
          <View key={item.id} style={{ borderBottomWidth: index === items.length - 1 ? 0 : 1, borderBottomColor: theme.colors.border.subtle }}>
            <Pressable
              onPress={() => !item.disabled && toggle(item.id)}
              disabled={item.disabled}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityState={{ expanded: isExpanded, disabled: item.disabled }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: theme.spacing[3],
                opacity: item.disabled ? theme.opacity.disabled : 1,
                minHeight: theme.touchTarget.minIOS,
              }}
            >
              <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, fontWeight: '600', color: theme.colors.text.primary }}>
                {item.title}
              </RNText>
              <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                <Icon name="chevronDown" size="sm" />
              </View>
            </Pressable>
            {isExpanded && <View style={{ paddingBottom: theme.spacing[3] }}>{item.content}</View>}
          </View>
        );
      })}
    </View>
  );
}
