# @ecclesia/ui-native

React Native implementation of the Ecclesia UI Foundation, built on the
same `@ecclesia/ui-core` (theme/types) and `@ecclesia/ui-tokens` (raw
tokens) as `@ecclesia/ui-web` - identical design decisions, a platform-
appropriate render tree. See `../UI_DESIGN_NOTES.md` for the full
architecture rationale.

Consumed by `apps/mobile` only. Never imported by `apps/api` or
`apps/worker` (`scope:app-backend` tag) and never imported by
`apps/web-admin` (use `@ecclesia/ui-web` there instead).

## Styling approach

Plain style objects passed to React Native's `style` prop, computed at
render time from `useTheme()` - the same token-driven principle as
`ui-web`, expressed through RN's styling API instead of CSS.

## What's here

- `ThemeProvider/` - same hook surface as `ui-web` (`ThemeProvider`, `useTheme`, `useColorScheme`, `useBreakpoint`, `useReducedMotion`). System color scheme resolved via RN's `Appearance` API; reduced motion via `AccessibilityInfo.isReduceMotionEnabled()`.
- `Icon/` - the native half of the single icon system, rendering the same `ICON_REGISTRY` through `lucide-react-native` (peer dependency: `react-native-svg`).
- `utils/` - `getElevationStyle(theme, level)`, resolving an elevation token into `Platform.select`'d iOS shadow props / Android `elevation`.
- Base components (foundation slice, 12 of the Design System's 23): `Text`, `Heading`, `Button`, `Card`, `Badge`, `Avatar`, `Input`, `Divider`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`.

Notable platform divergences from `ui-web` (each documented inline in
the component that has it):

- `Spinner` wraps RN's native `ActivityIndicator` rather than reimplementing rotation - the platform already provides a platform-correct spinner.
- `Heading` uses `accessibilityRole="header"` for every level - RN/iOS/Android screen readers expose no numeric heading-level concept, so document order (not a level attribute) conveys hierarchy on this platform.
- `Text`/`Heading` deliberately omit a `style` prop (`Omit<RNTextProps, 'style'>`) to force all styling through token-driven `variant`/`color` props; `Avatar`'s initials label is the one documented exception, using RN's native `Text` directly for a size computed outside the fixed typography scale (mirrors `ui-web`'s `Avatar` using a raw `<span>` for the same reason).

**Not yet built** (documented follow-up milestone, not an oversight):
TextArea, Checkbox, Radio, Select, Switch, Toast, Tooltip, Modal, Drawer,
Tabs, Accordion, and all Navigation/Data/Layout components.

## Verify

```bash
npx nx test ui-native
npx nx lint ui-native
npx nx build ui-native
```
