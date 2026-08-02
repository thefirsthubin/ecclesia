import type { HexColor } from './contrast';
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
export declare const neutral: {
    readonly 0: "#FFFFFF";
    readonly 50: "#F7F7F7";
    readonly 100: "#EEEEEE";
    readonly 200: "#E0E0E0";
    readonly 300: "#C7C7C7";
    readonly 400: "#A3A3A3";
    readonly 500: "#7A7A7A";
    readonly 600: "#5C5C5C";
    readonly 700: "#434343";
    readonly 800: "#2B2B2B";
    readonly 900: "#171717";
    readonly 950: "#0A0A0A";
};
export type NeutralStep = keyof typeof neutral;
/**
 * Brand primary: a deep, warm teal-green (Part 5.2 - chosen to avoid both
 * "generic SaaS blue" and any single denomination's liturgical color
 * associations while still reading as calm and trustworthy). `default`
 * against white text is contrast-verified at ~5.18:1 (see tokens.spec.ts).
 */
export declare const brand: {
    readonly light: {
        readonly default: HexColor;
        readonly hover: HexColor;
        readonly active: HexColor;
        readonly subtle: HexColor;
        readonly disabled: HexColor;
    };
    readonly dark: {
        readonly default: HexColor;
        readonly hover: HexColor;
        readonly active: HexColor;
        readonly subtle: HexColor;
        readonly disabled: HexColor;
    };
};
export type StatusKey = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
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
export declare const status: Record<StatusKey, {
    strong: HexColor;
    light: {
        background: HexColor;
        foreground: HexColor;
        border: HexColor;
    };
    dark: {
        background: HexColor;
        foreground: HexColor;
        border: HexColor;
    };
}>;
/**
 * Church Pulse band colors (extends Design System v1.0 Part 10.1 -
 * **[Design decision, not literally specified in the PRD/Blueprint]**).
 * FR-INS-01 (PRD §13) defines the score as 0-100; the band boundaries
 * below are this document's own choice, deliberately distinct from the
 * generic status palette so a Church Pulse score reads as its own
 * recognizable gradient (thriving teal through at-risk red) rather than
 * borrowing the same red/amber/green used for e.g. a reconciliation
 * discrepancy. Boundaries are exported as data (`CHURCH_PULSE_BANDS`) so a
 * future Admin-configurable-threshold feature (a plausible extension, not
 * a current requirement) is a data change, not a code change.
 */
export type ChurchPulseBandKey = 'thriving' | 'healthy' | 'attention' | 'atRisk';
export declare const churchPulse: Record<ChurchPulseBandKey, HexColor>;
export interface ChurchPulseBand {
    key: ChurchPulseBandKey;
    label: string;
    color: HexColor;
    min: number;
    max: number;
}
/** Ordered highest-to-lowest so `getChurchPulseBand` can return on first match. */
export declare const CHURCH_PULSE_BANDS: ChurchPulseBand[];
/**
 * Resolves a Church Pulse score (FR-INS-01, PRD §13; PRD §12.8 for the
 * 0-100 scale) to its display band. Clamps out-of-range input rather than
 * throwing - a defensive default appropriate for a UI-layer function fed
 * by a computed, not user-entered, value.
 */
export declare function getChurchPulseBand(score: number): ChurchPulseBand;
/**
 * Fully-resolved semantic color tokens for one theme mode (Part 5.11:
 * "dark mode is a second value set for the same token names, not a
 * parallel design system"). This is the shape `ui-core`'s `buildTheme()`
 * consumes directly.
 */
export interface SemanticColorTokens {
    surface: {
        default: HexColor;
        raised: HexColor;
        overlay: string;
    };
    text: {
        primary: HexColor;
        secondary: HexColor;
        disabled: HexColor;
        inverse: HexColor;
    };
    border: {
        default: HexColor;
        subtle: HexColor;
        focus: HexColor;
    };
    brand: {
        default: HexColor;
        hover: HexColor;
        active: HexColor;
        subtle: HexColor;
        disabled: HexColor;
    };
    status: Record<StatusKey, {
        strong: HexColor;
        background: HexColor;
        foreground: HexColor;
        border: HexColor;
    }>;
    churchPulse: typeof churchPulse;
}
export declare const lightPalette: SemanticColorTokens;
export declare const darkPalette: SemanticColorTokens;
//# sourceMappingURL=color.d.ts.map