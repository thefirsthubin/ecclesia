# @ecclesia/ui-core

Platform-agnostic theme composition and shared types, depending only on
`@ecclesia/ui-tokens`. No React, no React DOM, no React Native import
anywhere in this package - see `../UI_DESIGN_NOTES.md` for why that
boundary matters (it's what lets `ui-web` and `ui-native` each build a
*real* `ThemeProvider` around the exact same `buildTheme()` output instead
of two independently-drifting theme implementations).

## What's here

- `theme.ts` - the `Theme` type and `buildTheme(mode)`, which resolves `ui-tokens`' `lightPalette`/`darkPalette` plus every mode-independent token table into one object.
- `types.ts` - shared prop-union types (`Size`, `ActionVariant`, `StatusKey`, `Testable`, `AccessibleProps`) used by both platforms' component prop interfaces so a `Button`'s `variant` prop means the same thing on web and native.
- `icon-registry.ts` - the single source of truth for which icon names exist in Ecclesia (Design System v1.0 Part 9), mapped to the underlying lucide export name. Does not import lucide itself - see `ui-web`/`ui-native`'s `Icon` component for the platform-specific rendering.

## Verify

```bash
npx nx test ui-core
npx nx lint ui-core
npx nx build ui-core
```
