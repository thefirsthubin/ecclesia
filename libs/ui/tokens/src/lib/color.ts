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
 * Brand primary: a single restrained, muted deep green (`[UX Design
 * Implementation]`, Final UX Design Specification §2/§3 - superseding
 * the prior teal). Chosen to read as calm operational software rather
 * than "generic SaaS teal" or overt religious theming - identity comes
 * from restraint and consistency, not from the hue itself. `light.default`
 * against white text is contrast-verified at 6.0:1 (see tokens.spec.ts);
 * `dark.default` is deliberately darker than a naive "brighten for dark
 * mode" default would be, specifically so it still holds white button
 * text at >=4.5:1 even though nothing in this codebase currently renders
 * dark mode (Design Spec's own "architecture should allow it later
 * without a redesign" instruction - this is that architecture, kept
 * internally consistent even while unused).
 */
export const brand = {
  light: {
    default: '#1F6F5B' as HexColor,
    hover: '#185947' as HexColor,
    active: '#12432F' as HexColor,
    subtle: '#EAF4F0' as HexColor,
    disabled: '#A9C4BC' as HexColor,
  },
  dark: {
    default: '#2E7E68' as HexColor,
    hover: '#266856' as HexColor,
    active: '#1E5344' as HexColor,
    subtle: '#17332B' as HexColor,
    disabled: '#3A5650' as HexColor,
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
/**
 * `strong` is a single, mode-independent value (Final UX Design
 * Specification §2 - "colour communicates meaning, not decoration"):
 * one solid-fill shade per status regardless of light/dark mode, each
 * contrast-verified to hold white text at >=4.5:1 (tokens.spec.ts).
 * `light`/`dark` are the soft-badge tint pairs - `foreground` is tested
 * against its own `background`, never against white, so these can (and
 * for dark mode, must) sit at a different lightness than `strong`.
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
    strong: '#157A52',
    light: { background: '#E7F5EE', foreground: '#0F5C3E', border: '#A8DDC4' },
    dark: { background: '#132A1F', foreground: '#7FCBA6', border: '#215239' },
  },
  warning: {
    // Unchanged from the prior palette - already a deep amber/ochre that
    // clears 4.5:1 for white `strong`-fill text (Design Spec §2: "your
    // original reference fails; reuse this already-verified value").
    strong: '#8A5A00',
    light: { background: '#FBF0DC', foreground: '#5C3D00', border: '#E8C57A' },
    dark: { background: '#332707', foreground: '#E0B45B', border: '#5C4413' },
  },
  danger: {
    strong: '#C24141',
    light: { background: '#FBEAEA', foreground: '#8A2F2F', border: '#E8ABAB' },
    dark: { background: '#301616', foreground: '#E29A9A', border: '#5C2626' },
  },
  info: {
    strong: '#3B6EA5',
    light: { background: '#E8F0FA', foreground: '#204A73', border: '#AFC9E5' },
    dark: { background: '#16263A', foreground: '#8FB4D6', border: '#264260' },
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
  thriving: '#1F6F5B', // reuses brand.light.default - a thriving score IS the brand-healthy state
  healthy: '#4C9A6A',
  attention: '#C98A1F',
  atRisk: '#C24141', // reuses status.danger.strong
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

/**
 * `[UX Design Implementation]` Final UX Design Specification §2/§3/§17 -
 * these five categories (`surface`/`text`/`border`) are now authored as
 * literal, individually contrast-verified hex values rather than points
 * picked off the generic `neutral` ramp - the exact restrained-neutral
 * palette (off-white background, white cards, charcoal-navy text,
 * strengthened-but-still-subtle borders) doesn't land evenly on a
 * general-purpose gray scale, and nothing outside this file reads
 * `neutral[N]` directly (confirmed by a workspace-wide search before this
 * change), so the ramp itself is left untouched for whatever future use
 * still wants a plain gray step.
 */
export const lightPalette: SemanticColorTokens = {
  surface: { default: '#F8F9FA', raised: '#FFFFFF', overlay: 'rgba(10, 10, 10, 0.5)' },
  text: { primary: '#172026', secondary: '#5B6472', disabled: '#98A2AF', inverse: neutral[0] },
  border: { default: '#C4CAD1', subtle: '#EDEEF1', focus: brand.light.default },
  brand: brand.light,
  status: resolveStatus('light'),
  churchPulse,
};

export const darkPalette: SemanticColorTokens = {
  surface: { default: '#14171A', raised: '#1B1F23', overlay: 'rgba(0, 0, 0, 0.6)' },
  text: { primary: '#EDEFF1', secondary: '#A2ABB5', disabled: '#6B7480', inverse: '#14171A' },
  border: { default: '#333A41', subtle: '#262B30', focus: brand.dark.default },
  brand: brand.dark,
  status: resolveStatus('dark'),
  churchPulse,
};
