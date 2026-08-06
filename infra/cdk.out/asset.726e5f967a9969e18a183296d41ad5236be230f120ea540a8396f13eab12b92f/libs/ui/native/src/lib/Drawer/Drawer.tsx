import { type ReactNode } from 'react';
import { Modal as RNModal, Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Heading } from '../Heading';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'left' | 'right';
  dismissible?: boolean;
  footer?: ReactNode;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Drawer`, built on RN's own
 * `Modal` primitive - the same choice `ui-native`'s `Modal` made (see that
 * file's doc comment for the full rationale). The panel is a full-height
 * `View` anchored to `side` instead of centered, `slideInLeft`/
 * `slideInRight` isn't a built-in RN `animationType`, so `slide`
 * (RN's own bottom-anchored slide) is intentionally *not* used here -
 * `fade` is used instead to avoid a visually-wrong bottom-slide for a
 * side panel; a true edge-slide transition would need
 * `react-native-reanimated` and is a disclosed follow-up, not this
 * component's scope.
 */
export function Drawer({ isOpen, onClose, title, children, side = 'right', dismissible = true, footer, testId }: DrawerProps) {
  const theme = useTheme();

  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={dismissible ? onClose : () => undefined} testID={testId}>
      <Pressable
        testID={testId ? `${testId}-scrim` : undefined}
        onPress={dismissible ? onClose : undefined}
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
          backgroundColor: theme.colors.surface.overlay,
        }}
      >
        <Pressable
          accessibilityViewIsModal
          accessibilityRole="none"
          testID={testId ? `${testId}-panel` : undefined}
          onPress={(event) => event.stopPropagation()}
          style={{
            width: '85%',
            maxWidth: 400,
            height: '100%',
            backgroundColor: theme.colors.surface.raised,
            padding: theme.spacing[5],
            gap: theme.spacing[4],
          }}
        >
          <Heading level={3}>{title}</Heading>
          <ScrollView style={{ flex: 1 }}>
            <View>{children}</View>
          </ScrollView>
          {footer && <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing[2] }}>{footer}</View>}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
