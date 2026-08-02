"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarSize = exports.iconSize = exports.touchTarget = void 0;
/**
 * Sizing tokens (Design System v1.0 Part 6.4). `touchTarget.min` is the
 * accessibility floor every interactive component's minimum hit area
 * targets (Part 1.5): 44pt on iOS, 48dp on Android - the two platforms'
 * own accessibility guidelines disagree slightly, so this exports both
 * and lets `ui-native` pick per-`Platform.OS`, while `ui-web` uses the
 * larger (44) value as a single safe floor.
 */
exports.touchTarget = {
    minIOS: 44,
    minAndroid: 48,
    /** The value `ui-web` uses - the larger of the two native floors. */
    minWeb: 44,
};
exports.iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
};
exports.avatarSize = {
    sm: 24,
    md: 40,
    lg: 56,
};
//# sourceMappingURL=sizing.js.map