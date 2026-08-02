/**
 * Spacing tokens (Design System v1.0 Part 5.4, Part 6.3) - an 8pt-rhythm
 * scale, closed vocabulary (no arbitrary pixel value is used anywhere a
 * `space.*` token applies, per Part 6.12's token-only governance rule).
 * Plain numbers (px on both platforms - RN's `StyleSheet` numbers are
 * density-independent pixels already, matching web's px unit closely
 * enough for one shared scale).
 */
export declare const spacing: {
    readonly 0: 0;
    readonly 1: 4;
    readonly 2: 8;
    readonly 3: 12;
    readonly 4: 16;
    readonly 5: 20;
    readonly 6: 24;
    readonly 8: 32;
    readonly 10: 40;
    readonly 12: 48;
    readonly 16: 64;
};
export type SpacingStep = keyof typeof spacing;
//# sourceMappingURL=spacing.d.ts.map