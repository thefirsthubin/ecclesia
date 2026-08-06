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
export const neutral = {
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
} as const satisfies Record<number, HexColor>;

export type NeutralStep = keyof typeof neutral;

/**
 * Brand primary: a deep, warm teal-green (Part 5.2 - chosen to avoid both
 * "generic SaaS blue" and any single denomination's liturgical color
 * associations while still reading as calm and trustworthy). `default`
 * against white text is contrast-verified at ~5.18:1 (see tokens.spec.ts).
 */
export const brand = {
  light: {
    default: '#1B7A6E' as HexColor,
    hover: '#166357' as HexColor,
    active: '#124F46' as HexColor,
    subtle: '#E3F3F0' as HexColor,
    disabled: '#A9C9C4' as HexColor,
  },
  dark: {
    default: '#2FA08F' as HexColor,
    hover: '#3AB89F' as HexColor,
    active: '#237A6D' as HexColor,
    subtle: '#123832' as HexColor,
    disabled: '#3D5B56' as HexColor,
  },
} as const;

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
export const status: Record<
  StatusKey,
  {
    strong: HexColor;
    light: { background: HexColor; foreground: HexColor; border: HexColor };
    dark: { background: HexColor; foreground: HexColor; border: HexColor };
  }
> = {
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
    strong: neutral[600],
    light: { background: neutral[100], foreground: neutral[800], border: neutral[300] },
    dark: { background: neutral[800], foreground: neutral[200], border: neutral[700] },
  },
};

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

export const churchPulse: Record<ChurchPulseBandKey, HexColor> = {
  thriving: '#1B7A6E', // reuses brand.light.default - a thriving score IS the brand-healthy state
  healthy: '#4C9A6A',
  attention: '#C98A1F',
  atRisk: '#B3261E', // reuses status.danger.strong
};

export interface ChurchPulseBand {
  key: ChurchPulseBandKey;
  label: string;
  color: HexColor;
  min: number;
  max: number;
}

/** Ordered highest-to-lowest so `getChurchPulseBand` can return on first match. */
export const CHURCH_PULSE_BANDS: ChurchPulseBand[] = [
  { key: 'thriving', label: 'Thriving', color: churchPulse.thriving, min: 80, max: 100 },
  { key: 'healthy', label: 'Healthy', color: churchPulse.healthy, min: 60, max: 79 },
  { key: 'attention', label: 'Needs attention', color: churchPulse.attention, min: 40, max: 59 },
  { key: 'atRisk', label: 'At risk', color: churchPulse.atRisk, min: 0, max: 39 },
];

/**
 * Resolves a Church Pulse score (FR-INS-01, PRD §13; PRD §12.8 for the
 * 0-100 scale) to its display band. Clamps out-of-range input rather than
 * throwing - a defensive default appropriate for a UI-layer function fed
 * by a computed, not user-entered, value.
 */
export function getChurchPulseBand(score: number): ChurchPulseBand {
  const clamped = Math.max(0, Math.min(100, score));
  const band = CHURCH_PULSE_BANDS.find((b) => clamped >= b.min && clamped <= b.max);
  // The band list is exhaustive over [0, 100] by construction; this
  // fallback only guards against a future edit narrowing the ranges.
  return band ?? CHURCH_PULSE_BANDS[CHURCH_PULSE_BANDS.length - 1];
}

/**
 * Fully-resolved semantic color tokens for one theme mode (Part 5.11:
 * "dark mode is a second value set for the same token names, not a
 * parallel design system"). This is the shape `ui-core`'s `buildTheme()`
 * consumes directly.
 */
export interface SemanticColorTokens {
  surface: { default: HexColor; raised: HexColor; overlay: string };
  text: { primary: HexColor; secondary: HexColor; disabled: HexColor; inverse: HexColor };
  border: { default: HexColor; subtle: HexColor; focus: HexColor };
  brand: { default: HexColor; hover: HexColor; active: HexColor; subtle: HexColor; disabled: HexColor };
  status: Record<StatusKey, { strong: HexColor; background: HexColor; foreground: HexColor; border: HexColor }>;
  churchPulse: typeof churchPulse;
}

function resolveStatus(mode: 'light' | 'dark'): SemanticColorTokens['status'] {
  const entries = (Object.keys(status) as StatusKey[]).map((key) => {
    const s = status[key];
    const tint = s[mode];
    return [key, { strong: s.strong, background: tint.background, foreground: tint.foreground, border: tint.border }] as const;
  });
  return Object.fromEntries(entries) as SemanticColorTokens['status'];
}

export const lightPalette: SemanticColorTokens = {
  surface: { default: neutral[0], raised: neutral[0], overlay: 'rgba(10, 10, 10, 0.5)' },
  text: { primary: neutral[900], secondary: neutral[600], disabled: neutral[400], inverse: neutral[0] },
  border: { default: neutral[300], subtle: neutral[200], focus: brand.light.default },
  brand: brand.light,
  status: resolveStatus('light'),
  churchPulse,
};

export const darkPalette: SemanticColorTokens = {
  surface: { default: neutral[950], raised: neutral[900], overlay: 'rgba(0, 0, 0, 0.6)' },
  text: { primary: neutral[50], secondary: neutral[300], disabled: neutral[600], inverse: neutral[900] },
  border: { default: neutral[700], subtle: neutral[800], focus: brand.dark.default },
  brand: brand.dark,
  status: resolveStatus('dark'),
  churchPulse,
};
