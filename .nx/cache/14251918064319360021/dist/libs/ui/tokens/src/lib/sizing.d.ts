/**
 * Sizing tokens (Design System v1.0 Part 6.4). `touchTarget.min` is the
 * accessibility floor every interactive component's minimum hit area
 * targets (Part 1.5): 44pt on iOS, 48dp on Android - the two platforms'
 * own accessibility guidelines disagree slightly, so this exports both
 * and lets `ui-native` pick per-`Platform.OS`, while `ui-web` uses the
 * larger (44) value as a single safe floor.
 */
export declare const touchTarget: {
    readonly minIOS: 44;
    readonly minAndroid: 48;
    /** The value `ui-web` uses - the larger of the two native floors. */
    readonly minWeb: 44;
};
export declare const iconSize: {
    readonly sm: 16;
    readonly md: 20;
    readonly lg: 24;
};
export declare const avatarSize: {
    readonly sm: 24;
    readonly md: 40;
    readonly lg: 56;
};
export type IconSizeToken = keyof typeof iconSize;
export type AvatarSizeToken = keyof typeof avatarSize;
//# sourceMappingURL=sizing.d.ts.map