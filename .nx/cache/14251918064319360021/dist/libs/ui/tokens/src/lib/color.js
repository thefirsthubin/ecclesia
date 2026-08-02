"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.darkPalette = exports.lightPalette = exports.CHURCH_PULSE_BANDS = exports.churchPulse = exports.status = exports.brand = exports.neutral = void 0;
exports.getChurchPulseBand = getChurchPulseBand;
/**
 * Color tokens (Design System v1.0 Part 5.2, Part 6.2).
 *
 * The Design System document deliberately deferred literal color values to
 * "the implementation phase, where they will be authored directly as
 * tokens" (Part 5.2) - this file is that implementation. Every value below
 * is a **[Design decision]**, not a source-document citation; the
 * structure (neutral-first, brand/status color reserved for meaning, a
 * distinct Church Pulse band scale) is what traces back to Part 5.2, 5.10,
 * and 10.1.
 *
 * Naming follows Part 6.1's semantic convention: `category.role.variant`,
 * never a literal name like "teal600". Consumers should reach for
 * `lightPalette`/`darkPalette` (the resolved semantic maps `ui-core`'s
 * `buildTheme()` uses), not the raw `neutral`/`brand`/`status` scales
 * directly, except when authoring a new semantic token.
 */
/**
 * True-neutral gray ramp (equal R/G/B at every step, per Part 5.2's
 * "not blue-tinted" requirement) - backgrounds through primary text.
 */
exports.neutral = {
    0: '#FFFFFF',
    50: '#F7F7F7',
    100: '#EEEEEE',
    200: '#E0E0E0',
    300: '#C7C7C7',
    400: '#A3A3A3',
    500: '#7A7A7A',
    600: '#5C5C5C',
    700: '#434343',
    800: '#2B2B2B',
    900: '#171717',
    950: '#0A0A0A',
};
/**
 * Brand primary: a deep, warm teal-green (Part 5.2 - chosen to avoid both
 * "generic SaaS blue" and any single denomination's liturgical color
 * associations while still reading as calm and trustworthy). `default`
 * against white text is contrast-verified at ~5.18:1 (see tokens.spec.ts).
 */
exports.brand = {
    light: {
        default: '#1B7A6E',
        hover: '#166357',
        active: '#124F46',
        subtle: '#E3F3F0',
        disabled: '#A9C9C4',
    },
    dark: {
        default: '#2FA08F',
        hover: '#3AB89F',
        active: '#237A6D',
        subtle: '#123832',
        disabled: '#3D5B56',
    },
};
/**
 * Status colors (Part 5.10) - a closed, meaning-locked palette. `strong`
 * is mode-independent (used for solid fills - filled badges, the danger
 * button variant - and is contrast-verified against white text at >=4.5:1
 * for every status, see tokens.spec.ts). `background`/`foreground` are
 * mode-dependent tint pairs (used for subtle badges, alert cards, inline
 * status text) and are defined separately per light/dark mode because a
 * light tint that works on a white surface does not work on a near-black
 * one.
 */
exports.status = {
    success: {
        strong: '#1E7E4D',
        light: { background: '#E6F6ED', foreground: '#14532D', border: '#8FD9AE' },
        dark: { background: '#123822', foreground: '#8FE0B0', border: '#1E5C38' },
    },
    warning: {
        // Deliberately a deep amber/ochre, not a bright yellow (Part 5.10) -
        // darkened specifically so white text on the `strong` fill still
        // clears 4.5:1 (a bright/light amber cannot do this against white).
        strong: '#8A5A00',
        light: { background: '#FBF0DC', foreground: '#5C3D00', border: '#E8C57A' },
        dark: { background: '#3A2B05', foreground: '#F0C572', border: '#5C4413' },
    },
    danger: {
        strong: '#B3261E',
        light: { background: '#FBEAE9', foreground: '#7A1812', border: '#E8A6A1' },
        dark: { background: '#3A1512', foreground: '#F5A9A3', border: '#5C231D' },
    },
    info: {
        strong: '#1554A0',
        light: { background: '#E8F0FB', foreground: '#123A6B', border: '#A9C8EC' },
        dark: { background: '#12233A', foreground: '#9CC4F0', border: '#1F3A5C' },
    },
    neutral: {
        strong: exports.neutral[600],
        light: { background: exports.neutral[100], foreground: exports.neutral[800], border: exports.neutral[300] },
        dark: { background: exports.neutral[800], foreground: exports.neutral[200], border: exports.neutral[700] },
    },
};
exports.churchPulse = {
    thriving: '#1B7A6E', // reuses brand.light.default - a thriving score IS the brand-healthy state
    healthy: '#4C9A6A',
    attention: '#C98A1F',
    atRisk: '#B3261E', // reuses status.danger.strong
};
/** Ordered highest-to-lowest so `getChurchPulseBand` can return on first match. */
exports.CHURCH_PULSE_BANDS = [
    { key: 'thriving', label: 'Thriving', color: exports.churchPulse.thriving, min: 80, max: 100 },
    { key: 'healthy', label: 'Healthy', color: exports.churchPulse.healthy, min: 60, max: 79 },
    { key: 'attention', label: 'Needs attention', color: exports.churchPulse.attention, min: 40, max: 59 },
    { key: 'atRisk', label: 'At risk', color: exports.churchPulse.atRisk, min: 0, max: 39 },
];
/**
 * Resolves a Church Pulse score (FR-INS-01, PRD §13; PRD §12.8 for the
 * 0-100 scale) to its display band. Clamps out-of-range input rather than
 * throwing - a defensive default appropriate for a UI-layer function fed
 * by a computed, not user-entered, value.
 */
function getChurchPulseBand(score) {
    const clamped = Math.max(0, Math.min(100, score));
    const band = exports.CHURCH_PULSE_BANDS.find((b) => clamped >= b.min && clamped <= b.max);
    // The band list is exhaustive over [0, 100] by construction; this
    // fallback only guards against a future edit narrowing the ranges.
    return band ?? exports.CHURCH_PULSE_BANDS[exports.CHURCH_PULSE_BANDS.length - 1];
}
function resolveStatus(mode) {
    const entries = Object.keys(exports.status).map((key) => {
        const s = exports.status[key];
        const tint = s[mode];
        return [key, { strong: s.strong, background: tint.background, foreground: tint.foreground, border: tint.border }];
    });
    return Object.fromEntries(entries);
}
exports.lightPalette = {
    surface: { default: exports.neutral[0], raised: exports.neutral[0], overlay: 'rgba(10, 10, 10, 0.5)' },
    text: { primary: exports.neutral[900], secondary: exports.neutral[600], disabled: exports.neutral[400], inverse: exports.neutral[0] },
    border: { default: exports.neutral[300], subtle: exports.neutral[200], focus: exports.brand.light.default },
    brand: exports.brand.light,
    status: resolveStatus('light'),
    churchPulse: exports.churchPulse,
};
exports.darkPalette = {
    surface: { default: exports.neutral[950], raised: exports.neutral[900], overlay: 'rgba(0, 0, 0, 0.6)' },
    text: { primary: exports.neutral[50], secondary: exports.neutral[300], disabled: exports.neutral[600], inverse: exports.neutral[900] },
    border: { default: exports.neutral[700], subtle: exports.neutral[800], focus: exports.brand.dark.default },
    brand: exports.brand.dark,
    status: resolveStatus('dark'),
    churchPulse: exports.churchPulse,
};
//# sourceMappingURL=color.js.map