"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accordion = Accordion;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * React Native equivalent of `ui-web`'s `Accordion`. Each header is a
 * `Pressable` with `accessibilityRole="button"` and
 * `accessibilityState.expanded` - RN has no `role="region"` landmark
 * concept for the panel the way web's ARIA does, so the panel is a plain
 * conditionally-rendered `View`; the header's own expanded-state
 * announcement is the accessibility signal available on this platform.
 */
function Accordion({ items, expandedIds, onChange, allowMultiple = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const toggle = (id) => {
        const isExpanded = expandedIds.includes(id);
        if (allowMultiple) {
            onChange(isExpanded ? expandedIds.filter((existing) => existing !== id) : [...expandedIds, id]);
        }
        else {
            onChange(isExpanded ? [] : [id]);
        }
    };
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: testId, children: items.map((item, index) => {
            const isExpanded = expandedIds.includes(item.id);
            return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { borderBottomWidth: index === items.length - 1 ? 0 : 1, borderBottomColor: theme.colors.border.subtle }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: () => !item.disabled && toggle(item.id), disabled: item.disabled, accessibilityRole: "button", accessibilityLabel: item.title, accessibilityState: { expanded: isExpanded, disabled: item.disabled }, style: {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: theme.spacing[3],
                            opacity: item.disabled ? theme.opacity.disabled : 1,
                            minHeight: theme.touchTarget.minIOS,
                        }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, fontWeight: '600', color: theme.colors.text.primary }, children: item.title }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronDown", size: "sm" }) })] }), isExpanded && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { paddingBottom: theme.spacing[3] }, children: item.content })] }, item.id));
        }) }));
}
//# sourceMappingURL=Accordion.js.map