"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = Modal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Heading_1 = require("../Heading");
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
function Modal({ isOpen, onClose, title, children, variant = 'modal', dismissible = true, footer, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const isDialog = variant === 'dialog';
    return ((0, jsx_runtime_1.jsx)(react_native_1.Modal, { visible: isOpen, transparent: true, animationType: "fade", onRequestClose: dismissible ? onClose : () => undefined, testID: testId, children: (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { testID: testId ? `${testId}-scrim` : undefined, onPress: dismissible ? onClose : undefined, style: {
                flex: 1,
                backgroundColor: theme.colors.surface.overlay,
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing[4],
            }, children: (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityViewIsModal: true, accessibilityRole: "none", testID: testId ? `${testId}-dialog` : undefined, onPress: (event) => event.stopPropagation(), style: {
                    width: isDialog ? 320 : '100%',
                    maxWidth: isDialog ? 320 : 480,
                    maxHeight: isDialog ? undefined : '85%',
                    borderRadius: isDialog ? theme.radius.md : theme.radius.lg,
                    backgroundColor: theme.colors.surface.raised,
                    padding: theme.spacing[5],
                    gap: theme.spacing[4],
                }, children: [(0, jsx_runtime_1.jsx)(Heading_1.Heading, { level: 3, children: title }), isDialog ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { children: children })) : ((0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { children: children })), footer && ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing[2] }, children: footer }))] }) }) }));
}
//# sourceMappingURL=Modal.js.map