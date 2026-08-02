"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.typography = exports.fontFamily = void 0;
exports.fontFamily = {
    base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    /** React Native has no "system-ui" stack; platforms resolve their own default when this is unset. */
    nativeFallback: undefined,
};
/**
 * Typed as `Record<TypographyRole, TypeStyle>` explicitly (not left to
 * per-entry inference via `as const`) so that `typography[someRole]`,
 * where `someRole` is a union of multiple roles, resolves to one uniform
 * `TypeStyle` shape rather than a union-of-differently-shaped-objects -
 * the latter makes `.tabularNumbers` a type error at every call site
 * that reads it through a non-literal role (e.g. `Text`'s `variant` prop).
 */
exports.typography = {
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
//# sourceMappingURL=typography.js.map