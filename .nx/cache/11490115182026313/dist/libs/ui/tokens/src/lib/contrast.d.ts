/**
 * WCAG 2.1 contrast-ratio calculation (Design System §1.5, NFR-USA-02).
 *
 * This is deliberately a standalone, dependency-free implementation of the
 * WCAG relative-luminance and contrast-ratio formulas (see
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance and
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio) rather than a pulled-in
 * color library - `libs/ui/tokens` is meant to stay a zero-runtime-
 * dependency leaf (Blueprint §4.3-style "leaf library" discipline, same
 * reasoning `libs/contracts` follows), and this workspace has no network
 * access to add or verify a new package inside this sandbox in any case.
 *
 * `tokens.spec.ts` uses this to assert - as an executable check, not a
 * hand-verified claim in a comment - that every foreground/background pair
 * this file defines actually meets the Design System's 4.5:1 floor for
 * normal text (§1.5).
 */
/** A hex color string, e.g. "#1B7A6E". Always 6 hex digits, no shorthand. */
export type HexColor = `#${string}`;
/** WCAG relative luminance, in the range [0, 1]. */
export declare function getRelativeLuminance(hex: HexColor): number;
/**
 * WCAG contrast ratio between two colors, in the range [1, 21]. Order of
 * arguments does not matter - the lighter color is always treated as L1.
 */
export declare function getContrastRatio(colorA: HexColor, colorB: HexColor): number;
/** The Design System's §1.5 floor for normal body text. */
export declare const WCAG_AA_NORMAL_TEXT_MIN_RATIO = 4.5;
/** The Design System's §1.5 floor for large text (18px+/bold 14px+) and UI component boundaries. */
export declare const WCAG_AA_LARGE_TEXT_MIN_RATIO = 3;
export declare function meetsWcagAaNormalText(colorA: HexColor, colorB: HexColor): boolean;
//# sourceMappingURL=contrast.d.ts.map