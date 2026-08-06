import { type ReactNode } from 'react';
import { Modal as RNModal, Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Heading } from '../Heading';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Labels the dialog for assistive technology (Design System v1.0 Part
   * 7.8: "labelled by its heading") - rendered as a real `Heading`, not
   * merely an `accessibilityLabel` string. */
  title: string;
  children: ReactNode;
  /** `modal` (up to `radius.lg`, scrollable) vs `dialog` (smaller,
   * centered, no scroll) - the same two variants `ui-web`'s `Modal`
   * exposes. Mobile's true "bottom-sheet" variant (Part 7.8) is not this
   * component - see this file's own doc comment. */
  variant?: 'modal' | 'dialog';
  /** A destructive-action dialog "requires an explicit button press,
   * never a dismiss-by-accident path" (Part 7.8) - set `false` to disable
   * scrim-tap/hardware-back dismissal, leaving only `footer`'s own
   * explicit buttons able to close it. Defaults to `true`. */
  dismissible?: boolean;
  footer?: ReactNode;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Modal`, built on RN's own
 * `Modal` primitive rather than reimplementing a portal/overlay from
 * scratch (`UI_DESIGN_NOTES.md`'s own plan for this component: "native via
 * RN's `Modal` primitive"). `accessibilityViewIsModal` on the content
 * `View` is RN's platform mechanism for VoiceOver/TalkBack to trap focus
 * within the dialog while it's open - there is no manual Tab-trapping
 * concept on this platform the way `ui-web`'s `Modal` needs (RN has no
 * keyboard-Tab navigation model at all).
 *
 * **Not this codebase's "bottom-sheet" variant.** Design System v1.0 Part
 * 7.8 lists `bottom-sheet` as Mobile's own equivalent of a modal
 * (respecting one-handed reachability) - genuinely a different
 * presentation (slides from the bottom, partial-height) from this
 * component's centered dialog. Building it is deferred alongside every
 * other still-missing base/Navigation component - see
 * `UI_DESIGN_NOTES.md`'s "Base components - deferred" section.
 */
export function Modal({ isOpen, onClose, title, children, variant = 'modal', dismissible = true, footer, testId }: ModalProps) {
  const theme = useTheme();
  const isDialog = variant === 'dialog';

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={dismissible ? onClose : () => undefined}
      testID={testId}
    >
      <Pressable
        testID={testId ? `${testId}-scrim` : undefined}
        onPress={dismissible ? onClose : undefined}
        style={{
          flex: 1,
          backgroundColor: theme.colors.surface.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing[4],
        }}
      >
        <Pressable
          accessibilityViewIsModal
          accessibilityRole="none"
          testID={testId ? `${testId}-dialog` : undefined}
          onPress={(event) => event.stopPropagation()}
          style={{
            width: isDialog ? 320 : '100%',
            maxWidth: isDialog ? 320 : 480,
            maxHeight: isDialog ? undefined : '85%',
            borderRadius: isDialog ? theme.radius.md : theme.radius.lg,
            backgroundColor: theme.colors.surface.raised,
            padding: theme.spacing[5],
            gap: theme.spacing[4],
          }}
        >
          <Heading level={3}>{title}</Heading>
          {isDialog ? (
            <View>{children}</View>
          ) : (
            <ScrollView>{children}</ScrollView>
          )}
          {footer && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing[2] }}>{footer}</View>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
