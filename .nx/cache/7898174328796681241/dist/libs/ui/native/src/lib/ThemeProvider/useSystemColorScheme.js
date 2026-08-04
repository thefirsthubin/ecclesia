"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSystemColorScheme = useSystemColorScheme;
const react_1 = require("react");
const react_native_1 = require("react-native");
function subscribe(callback) {
    const subscription = react_native_1.Appearance.addChangeListener(callback);
    return () => subscription.remove();
}
function getSnapshot() {
    return react_native_1.Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}
/**
 * React Native's equivalent of `ui-web`'s `matchMedia`-based hook - same
 * role (Design System v1.0 Part 5.11), platform-native API
 * (`Appearance`, not a media query).
 */
function useSystemColorScheme() {
    return (0, react_1.useSyncExternalStore)(subscribe, getSnapshot, () => 'light');
}
//# sourceMappingURL=useSystemColorScheme.js.map