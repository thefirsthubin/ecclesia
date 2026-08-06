# @ecclesia/ui-web

React DOM implementation of the Ecclesia UI Foundation, built on
`@ecclesia/ui-core` (theme/types) and `@ecclesia/ui-tokens` (raw tokens).
Every visual value renders from theme tokens - no component in this
package uses a hard-coded pixel/hex value. See `../UI_DESIGN_NOTES.md`
for the full architecture rationale, the deferred-component roadmap, and
the acceptance-criteria walkthrough.

Consumed by `apps/web-admin` only. Never imported by `apps/api` or
`apps/worker` (enforced by `@nx/enforce-module-boundaries`'s
`scope:app-backend` tag) and never imported by `apps/mobile` (use
`@ecclesia/ui-native` there instead - the two packages are siblings and
never depend on each other).

## Styling approach

Token-driven inline style objects computed at render time from
`useTheme()`, with hover/active/focus state tracked via local component
state (not CSS Modules, not Tailwind, not styled-components) - a
deliberate choice to avoid adding new build-tool surface area, given this
repo's history of webpack/babel/SWC breakage (see root `README.md`'s
Sprint 0 log).

## What's here

- `ThemeProvider/` - `ThemeProvider`, `useTheme`, `useColorScheme`, `useBreakpoint`, `useResponsiveValue`, `useReducedMotion`. System color scheme resolved via `matchMedia` + `useSyncExternalStore`.
- `Icon/` - the web half of Ecclesia's single icon system (Design System v1.0 Part 9), rendering `@ecclesia/ui-core`'s `ICON_REGISTRY` through `lucide-react`.
- `utils/` - `getBoxShadow(theme, level)`, composing an elevation token into a CSS `box-shadow` string.
- Base components (foundation slice, 12 of the Design System's 23): `Text`, `Heading`, `Button`, `Card`, `Badge`, `Avatar`, `Input`, `Divider`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`. Each is typed, documented, and accessible (see `../UI_DESIGN_NOTES.md` Part 10 for the accessibility pattern used by each).

**Not yet built** (documented follow-up milestone, not an oversight):
TextArea, Checkbox, Radio, Select, Switch, Toast, Tooltip, Modal, Drawer,
Tabs, Accordion, and all Navigation/Data/Layout components. See
`../UI_DESIGN_NOTES.md` for the full inventory and planned composition.

## Verify

```bash
npx nx test ui-web
npx nx lint ui-web
npx nx build ui-web
```
