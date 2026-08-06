import type { ReactNode } from 'react';
import { Pressable, ScrollView, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Tabs`. RN ships real `"tab"`/
 * `"tablist"` `accessibilityRole` values (unlike, say, dialog-trapping,
 * this is one of the few cases RN's accessibility API maps directly onto
 * the ARIA concept), so this uses them rather than inventing a
 * `View`-plus-generic-role fallback. Tab bar is a horizontal
 * `ScrollView` (not a fixed-width row) since a Bacenta/Ministry-heavy tab
 * set can exceed one screen width on a phone in a way it wouldn't on
 * web. Only the active tab's content renders below - same
 * single-source-of-truth choice as `ui-web`'s version.
 */
export function Tabs({ tabs, activeTabId, onChange, testId }: TabsProps) {
  const theme = useTheme();
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <View testID={testId}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist">
        <View style={{ flexDirection: 'row', gap: theme.spacing[1], borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <Pressable
                key={tab.id}
                onPress={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive, disabled: tab.disabled }}
                style={{
                  paddingHorizontal: theme.spacing[3],
                  paddingVertical: theme.spacing[2],
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? theme.colors.brand.default : 'transparent',
                  opacity: tab.disabled ? theme.opacity.disabled : 1,
                  minHeight: theme.touchTarget.minIOS,
                  justifyContent: 'center',
                }}
              >
                <RNText
                  style={{
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.body.fontSize,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
                  }}
                >
                  {tab.label}
                </RNText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {activeTab && <View style={{ paddingTop: theme.spacing[4] }}>{activeTab.content}</View>}
    </View>
  );
}
