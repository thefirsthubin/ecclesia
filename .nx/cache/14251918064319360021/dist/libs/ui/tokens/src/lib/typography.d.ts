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
export declare const fontFamily: {
    readonly base: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
    /** React Native has no "system-ui" stack; platforms resolve their own default when this is unset. */
    readonly nativeFallback: string | undefined;
};
export type FontWeight = 400 | 500 | 600 | 700;
export interface TypeStyle {
    fontSize: number;
    lineHeight: number;
    fontWeight: FontWeight;
    letterSpacing: number;
    /** Numeric tabular figures are a component-level concern (Part 6.5's `type.numeric.tabular`); this flag tells a component to opt into them. Always explicitly present (never omitted) so every role has an identically-shaped object - see the comment on `typography` below for why that matters. */
    tabularNumbers: boolean;
}
export type TypographyRole = 'display' | 'heading1' | 'heading2' | 'heading3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'numericTabular';
/**
 * Typed as `Record<TypographyRole, TypeStyle>` explicitly (not left to
 * per-entry inference via `as const`) so that `typography[someRole]`,
 * where `someRole` is a union of multiple roles, resolves to one uniform
 * `TypeStyle` shape rather than a union-of-differently-shaped-objects -
 * the latter makes `.tabularNumbers` a type error at every call site
 * that reads it through a non-literal role (e.g. `Text`'s `variant` prop).
 */
export declare const typography: Record<TypographyRole, TypeStyle>;
//# sourceMappingURL=typography.d.ts.map