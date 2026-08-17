/**
 * Typography tokens (Design System v1.0 Part 5.3, Part 6.5).
 *
 * A single typeface family across both platforms (Part 5.3 - "reinforcing
 * the 'learned once, used everywhere' principle"). `fontFamily` is a
 * **[Design decision]**: a humanist sans-serif with wide language coverage
 * for the i18n requirement (Blueprint §14.9) - Inter, falling back to each
 * platform's system font stack so nothing renders broken if the font
 * asset isn't bundled yet (font loading/bundling is implementation-phase
 * work for whichever screen first needs it, not this foundation sprint).
 *
 * Each role bundles family/size/lineHeight/weight/letterSpacing as one
 * unit (Part 6.5 - "not four separate tokens a developer must remember to
 * combine correctly"). Sizes are in unitless px numbers so both web
 * (`${n}px`) and React Native (plain numbers) can consume the same table
 * without a unit-string parsing step.
 */

export const fontFamily = {
  base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  /**
   * `[Product Experience Sprint II, Phase 2]` A second, deliberately
   * narrow-scope typeface - Fraunces, a warm humanist serif - used only
   * for `display`/`heading1`/`heading2` (`Heading.tsx`'s own selection
   * logic), the three roles at 22px and above (Part 6.5's own size
   * table). Every smaller role (`heading3` down through `caption`) stays
   * `base` (Inter) - a serif card title or table header would read as
   * decorative noise at that size, not identity.
   *
   * Evaluated against Fraunces, Domine, and Source Serif 4 (this sprint's
   * own design-direction report has the full comparison) - Fraunces won
   * on "warm/human" without tipping into "editorial/magazine" the way
   * Domine's extremely common blog-template pairing with Inter risks, or
   * Source Serif 4's more clinical, closer-to-Times character undershoots
   * "warm." Rendered at the existing 700/700/600 weights already defined
   * per role (unchanged) - Fraunces reads sturdy, not delicate, at those
   * weights, which is what keeps it "serious software" rather than
   * "wedding invitation."
   *
   * `[ui-native gap, disclosed]` This value is a web CSS font-stack
   * string; `ui-native` (`apps/mobile`) reads the same `typography.ts`
   * file but has no Fraunces asset linked into its native bundle yet -
   * RN will silently fall back to its platform default serif (or ignore
   * an unrecognized family name) until that's done as its own,
   * separately-scoped piece of work. Web only for this phase, same
   * "contained blast radius" precedent `useDashboardBreakpoint`'s own
   * doc comment already established.
   */
  display: '"Fraunces", Georgia, "Iowan Old Style", serif',
  /** React Native has no "system-ui" stack; platforms resolve their own default when this is unset. */
  nativeFallback: undefined as string | undefined,
} as const;

export type FontWeight = 400 | 500 | 600 | 700;

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeight;
  letterSpacing: number;
  /** Numeric tabular figures are a component-level concern (Part 6.5's `type.numeric.tabular`); this flag tells a component to opt into them. Always explicitly present (never omitted) so every role has an identically-shaped object - see the comment on `typography` below for why that matters. */
  tabularNumbers: boolean;
}

export type TypographyRole =
  | 'display'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'numericTabular';

/**
 * Typed as `Record<TypographyRole, TypeStyle>` explicitly (not left to
 * per-entry inference via `as const`) so that `typography[someRole]`,
 * where `someRole` is a union of multiple roles, resolves to one uniform
 * `TypeStyle` shape rather than a union-of-differently-shaped-objects -
 * the latter makes `.tabularNumbers` a type error at every call site
 * that reads it through a non-literal role (e.g. `Text`'s `variant` prop).
 */
export const typography: Record<TypographyRole, TypeStyle> = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: 700, letterSpacing: -0.5, tabularNumbers: false },
  heading1: { fontSize: 28, lineHeight: 36, fontWeight: 700, letterSpacing: -0.25, tabularNumbers: false },
  heading2: { fontSize: 22, lineHeight: 28, fontWeight: 600, letterSpacing: 0, tabularNumbers: false },
  heading3: { fontSize: 18, lineHeight: 24, fontWeight: 600, letterSpacing: 0, tabularNumbers: false },
  body: { fontSize: 15, lineHeight: 22, fontWeight: 400, letterSpacing: 0, tabularNumbers: false },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: 400, letterSpacing: 0, tabularNumbers: false },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: 400, letterSpacing: 0.1, tabularNumbers: false },
  label: { fontSize: 12, lineHeight: 16, fontWeight: 600, letterSpacing: 0.4, tabularNumbers: false },
  numericTabular: { fontSize: 15, lineHeight: 22, fontWeight: 500, letterSpacing: 0, tabularNumbers: true },
};
