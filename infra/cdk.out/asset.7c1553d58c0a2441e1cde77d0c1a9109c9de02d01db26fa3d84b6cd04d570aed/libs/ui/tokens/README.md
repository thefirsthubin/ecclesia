# @ecclesia/ui-tokens

The single source of truth for Ecclesia's design tokens (Design System v1.0
Parts 3/6): color, typography, spacing, radius, elevation, breakpoints,
motion, z-index, opacity, and sizing. Pure TypeScript data, zero framework
dependency - importable from `libs/ui/core`, `libs/ui/web`, `libs/ui/native`,
a future Storybook, or a plain Node script with no React/React Native
runtime required.

See `../UI_DESIGN_NOTES.md` at the `libs/ui` root for the full architecture
rationale. In short: this package is the one place literal design values
(hex colors, pixel sizes) may appear anywhere in the UI foundation -
everything downstream consumes these tokens by name, never a raw value.

## What's here

- `color.ts` - neutral scale, brand, status (success/warning/danger/info/neutral), Church Pulse score bands, and the resolved `lightPalette`/`darkPalette` semantic maps.
- `contrast.ts` - a dependency-free WCAG 2.1 contrast-ratio calculator, used by `tokens.spec.ts` to assert every token pair actually meets the Design System's 4.5:1 floor (§1.5) rather than trusting a hand-verified claim in a comment.
- `typography.ts`, `spacing.ts`, `radius.ts`, `elevation.ts`, `breakpoints.ts`, `motion.ts`, `z-index.ts`, `opacity.ts`, `sizing.ts` - one file per token category.

## Verify

```bash
npx nx test ui-tokens
npx nx lint ui-tokens
npx nx build ui-tokens
```
