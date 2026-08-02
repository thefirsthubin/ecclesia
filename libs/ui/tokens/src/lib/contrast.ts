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

function hexToRgb(hex: HexColor): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    throw new Error(`getContrastRatio: expected a 6-digit hex color, got "${hex}"`);
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function linearizeChannel(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, in the range [0, 1]. */
export function getRelativeLuminance(hex: HexColor): number {
  const { r, g, b } = hexToRgb(hex);
  const [rLin, gLin, bLin] = [r, g, b].map(linearizeChannel);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * WCAG contrast ratio between two colors, in the range [1, 21]. Order of
 * arguments does not matter - the lighter color is always treated as L1.
 */
export function getContrastRatio(colorA: HexColor, colorB: HexColor): number {
  const lA = getRelativeLuminance(colorA);
  const lB = getRelativeLuminance(colorB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** The Design System's §1.5 floor for normal body text. */
export const WCAG_AA_NORMAL_TEXT_MIN_RATIO = 4.5;

/** The Design System's §1.5 floor for large text (18px+/bold 14px+) and UI component boundaries. */
export const WCAG_AA_LARGE_TEXT_MIN_RATIO = 3;

export function meetsWcagAaNormalText(colorA: HexColor, colorB: HexColor): boolean {
  return getContrastRatio(colorA, colorB) >= WCAG_AA_NORMAL_TEXT_MIN_RATIO;
}
