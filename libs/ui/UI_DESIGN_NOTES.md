# Ecclesia UI Foundation — Design Notes

Sprint scope: the reusable UI platform every future `apps/web-admin` and
`apps/mobile` screen is built from — tokens, theme, icons, and a curated
base-component slice. No business screens are implemented here (see
"Explicitly out of scope" below). Traces to
`docs/Ecclesia_Design_System_UX_Foundation_v1.0.md` ("the Design System"
below) throughout.

## 1. Architecture

```
libs/ui/
  tokens/   @ecclesia/ui-tokens   pure TS data, zero framework dependency (leaf)
  core/     @ecclesia/ui-core     theme composition + shared types + icon registry, depends on tokens only
  web/      @ecclesia/ui-web      React DOM components, depends on core + tokens
  native/   @ecclesia/ui-native   React Native components, depends on core + tokens
```

`ui-web` and `ui-native` are siblings — neither imports the other, ever.
Both build on exactly the same `Theme` object (`buildTheme()` in
`ui-core`) and the same `ICON_REGISTRY`, so a design decision made once
(a color, a spacing value, which icon means "warning") is correct on
both platforms by construction, not by two developers independently
copying it correctly.

This mirrors the project's existing `libs/domain/*` pattern (small,
single-purpose libs, one clear dependency direction) rather than
inventing a new structural convention.

### Module boundaries

`eslint.config.cjs`'s `@nx/enforce-module-boundaries` `depConstraints`
enforce the dependency graph above at lint time, plus a real boundary
this sprint added: the former single `scope:app` tag was split into
`scope:app-backend` (`apps/api`, `apps/worker`), `scope:app-web`
(`apps/web-admin`), and `scope:app-native` (`apps/mobile`). Backend apps
structurally cannot import `ui-tokens`/`ui-core`/`ui-web`/`ui-native` —
a NestJS service accidentally importing React is now a lint error, not
just a code-review catch.

### Styling approach: token-driven inline styles, not a CSS framework

Both platforms compute style objects from `useTheme()` at render time
(web: inline `style={{...}}`; native: RN's `style` prop) rather than
adopting CSS Modules, Tailwind, or styled-components. This is a
deliberate, disclosed trade-off: this repo has a long history of
webpack/babel/SWC/Metro tooling breakage (see root `README.md`'s
Sprint 0 log), and every one of those fixes was hard-won. Adding a new
CSS build pipeline is new surface area for exactly that class of
failure, for a benefit (co-located styles, autocomplete) the token
system already provides another way. If a future sprint wants to
revisit this (e.g. for real theming performance at scale), that's a
scoped follow-up, not something to smuggle into this one.

## 2. Design tokens (`ui-tokens`)

One file per category, each with a named export and (where relevant) a
derived TypeScript union type for the valid keys:

| File | Exports | Notes |
|---|---|---|
| `color.ts` | `neutral`, `brand`, `status`, `churchPulse`, `CHURCH_PULSE_BANDS`, `getChurchPulseBand()`, `lightPalette`/`darkPalette` | `lightPalette`/`darkPalette` are `SemanticColorTokens` — the same token *names* resolve to different values per mode (Design System §5.11). |
| `typography.ts` | `fontFamily`, `typography: Record<TypographyRole, TypeStyle>` | 9 roles: `display`, `heading1-3`, `body`, `bodySmall`, `caption`, `label`, `numericTabular`. Every role has an identically-shaped `TypeStyle` object (see the in-file comment on why `tabularNumbers` is required, not optional — it's a real type-safety fix, not decoration). |
| `spacing.ts` | `spacing: Record<SpacingStep, number>` | 8pt rhythm: 0,4,8,12,16,20,24,32,40,48,64 at keys 0-16. |
| `radius.ts` | `radius` | none/sm/md/lg/full. |
| `elevation.ts` | `elevation: Record<ElevationLevel, ElevationStyle>` | 3 levels (0/1/2), each an `{offsetX, offsetY, blur, opacity}` shape both platforms can consume without a CSS-string round-trip. |
| `breakpoints.ts` | `breakpoints` | sm/md/lg/xl — web-only concern in practice (see `useBreakpoint` note below). |
| `motion.ts` | `motion.duration`, `motion.easing` | `duration.fast/standard/slow`, `easing.standard/emphasized` as cubic-bezier tuples. |
| `z-index.ts` | `zIndex` | named stacking-context tokens (no raw numbers at call sites). |
| `opacity.ts` | `opacity` | includes `opacity.disabled`, used consistently for every disabled-state component. |
| `sizing.ts` | `touchTarget`, `iconSize`, `avatarSize` | `touchTarget.minIOS` (44), `minAndroid` (48), `minWeb` (44) — the two platforms' own accessibility guidelines actually disagree, so both are exported and each platform's components pick the correct floor. |
| `contrast.ts` | `getContrastRatio()`, `meetsWcagAaNormalText()` | Dependency-free WCAG 2.1 relative-luminance implementation, used by `tokens.spec.ts` to assert real contrast ratios rather than trust a comment. |

**Church Pulse color bands** (`churchPulse`, `CHURCH_PULSE_BANDS`,
`getChurchPulseBand(score)`) are an explicit **[Design decision —
extends Design System §10.1]**: thriving 80-100, healthy 60-79,
attention 40-59, atRisk 0-39. The Design System names the concept;
the exact numeric bands and their colors are this sprint's addition,
disclosed as such.

## 3. Theme system (`ui-core` + per-platform `ThemeProvider`)

`ui-core/theme.ts` exports `buildTheme(mode: 'light' | 'dark'): Theme`
— a pure function, no React, no platform API. Everything except
`colors` is mode-independent and simply passed through; `colors`
resolves to `lightPalette`/`darkPalette` from `ui-tokens`.

Each platform wraps this in a real `ThemeProvider`:

- **`ui-web`**: `ThemeProvider` (React context), `useTheme()`,
  `useColorScheme()`, `useBreakpoint()` + `useResponsiveValue<T>()`,
  `useReducedMotion()`. System color scheme via
  `matchMedia('(prefers-color-scheme: dark)')` + `useSyncExternalStore`
  (React 18's idiomatic pattern for subscribing to external browser
  state — chosen over a `useEffect`+`useState` polyfill because it's
  race-free by construction). Light mode is the default; a `colorScheme`
  prop can force either mode or `"system"`.
- **`ui-native`**: identical hook surface. System color scheme via RN's
  `Appearance` API; reduced motion via
  `AccessibilityInfo.isReduceMotionEnabled()` + the
  `'reduceMotionChanged'` event (no synchronous snapshot API exists on
  RN, so this one hook uses plain `useState`/`useEffect` rather than
  `useSyncExternalStore`). `useBreakpoint` exists via
  `useWindowDimensions` for future tablet support, but per Design
  System §6.11 mobile does not use breakpoint-driven layout as its
  primary responsive strategy the way web does.

Dark mode: both `lightPalette` and `darkPalette` share the same
semantic key names (`colors.text.primary`, `colors.surface.raised`,
etc.) — a component never branches on `theme.mode` directly, it just
reads a token, and the token resolves correctly for whichever mode is
active. This is what makes dark-mode support "already done" for every
component in this sprint rather than a future retrofit.

## 4. Base components — implemented (12 of 23)

Every component below exists on **both** platforms with matching props
(platform-appropriate event names: `onClick`/`onPress`,
`children: ReactNode`/`children: string` where RN's `<Text>` requires a
string), is fully typed, and has a `.spec` test covering render +
accessibility-relevant behavior.

| Component | Purpose | Key accessibility pattern |
|---|---|---|
| `Text` | Body copy primitive, all non-heading typography roles | — |
| `Heading` | `level: 1\|2\|3\|'display'` | Web: real `<h1>`-`<h3>`. Native: `accessibilityRole="header"` on every level (RN has no numeric heading concept — document order conveys hierarchy). |
| `Button` | Primary action trigger, 4 variants × 3 sizes, loading/icon slots | Web: focus-visible outline, `aria-busy`. Native: `accessibilityState={{disabled, busy}}`, 44/48pt touch floor, `hitSlop`. |
| `Card` | Content grouping, optional `interactive` (whole-card tap target) | Web: real `role="button"`+`tabIndex`+Enter/Space handling, not a `<div onClick>`. Native: `Pressable` with `accessibilityRole="button"`. |
| `Badge` | Small status/count chip, 5 status colors × subtle/solid | Never the sole conveyor of urgency (Design System §7.9) — caller responsibility, documented on the component. |
| `Avatar` | Photo or deterministic initials fallback | `role="img"`/`accessibilityLabel` = full name either way. |
| `Input` | Labeled text field with error/helper text | Web: `<label htmlFor>` + `aria-describedby`+`role="alert"` on error. Native: no `<label>` equivalent exists, so `accessibilityLabel` mirrors the visible label text. |
| `Divider` | Visual separator | Web: `role="separator"`+`aria-orientation`. Native: `accessibilityElementsHidden` (decorative). |
| `Spinner` | Loading indicator | Web: `role="status"` (implies `aria-live`). Native: wraps RN's own `ActivityIndicator` rather than reimplementing rotation — the platform already provides a correct native spinner. Explicitly exempt from `useReducedMotion` (WCAG's essential-motion exception; a spinner conveys "still working," suppressing it would be misleading). |
| `Skeleton` | Loading placeholder | `aria-hidden`/`accessibilityElementsHidden`; pulse animation disabled under reduced motion (unlike `Spinner` — a skeleton's animation is decorative, not informational, so it doesn't get the same exemption). |
| `EmptyState` | "No content" designed state (Design System §7.18) | `tone: 'neutral' \| 'positive'` — an empty priority zone is good news, not an error; the component supports reading that way. |
| `ErrorState` | Recoverable-error designed state | Web: `role="alert"`. Native: `accessibilityLiveRegion="assertive"` (RN's ARIA-alert analogue). Optional `onRetry` renders a secondary `Button`. |

## 5. Base components — deferred (11 of 23)

Explicitly out of scope for this sprint, not omitted by oversight —
same "foundation slice first" phasing this project used for
`apps/worker` (build the platform + one complete vertical slice, ship
it, then extend):

`TextArea`, `Checkbox`, `Radio`, `Select`, `Switch`, `Toast`,
`Tooltip`, `Modal`, `Drawer`, `Tabs`, `Accordion`.

Planned composition when built: `TextArea`/`Checkbox`/`Radio`/`Select`/
`Switch` follow `Input`'s established pattern (label association +
error/helper text, token-driven styling, no new architectural
decisions needed). `Toast`/`Tooltip`/`Modal`/`Drawer` all need a
portal/overlay strategy — web via a portal to `document.body` plus
`zIndex` tokens (already exported, unused until now); native via RN's
`Modal` primitive. `Tabs`/`Accordion` are the two components that need
a small amount of shared state-management logic (active tab/expanded
panel) beyond what any component built so far required.

## 6. Navigation / Data / Layout components — not started

Design System §7 Parts 6-8 (sidebar/tab-bar navigation, data tables,
list rows, page/section layout primitives) are **not started**. These
compose from the base components above once the deferred slice (§5) is
also done, and are the next milestone after that — deliberately
sequenced last because they're the highest-leverage place for
inconsistency to creep in if built before the base primitives are
proven out across real screens.

## 7. Icons

**Decision: [lucide]**, via `lucide-react` (web) and
`lucide-react-native` (native, peer dependency `react-native-svg`).

Why: single open-source icon set covering both platforms with matching
visual language (same stroke width/style), tree-shakeable (each icon is
its own export, so bundlers only ship the icons actually used), and
actively maintained. No screen or component outside the platform
`Icon` wrapper ever imports lucide directly — `ICON_REGISTRY` in
`ui-core` is the single source of truth for which ~34 semantic icon
names exist in Ecclesia (`check`, `alertTriangle`, `chevronDown`,
etc.), each mapped to lucide's PascalCase export name. Adding an icon
means adding one line to `ICON_REGISTRY`, never a new import scattered
across a screen file. This is what "never allow multiple icon systems"
(the prompt's explicit requirement) means in practice: it's not just a
convention, `Icon` is the only component that imports the library at
all.

`react-native-svg` is pinned to `^15.2.0` — a **disclosed, unverified
guess**: WebSearch confirmed the newest 15.x releases (15.15.5+)
require React Native ≥0.78, and this repo pins RN at exactly `0.75.4`,
so an earlier 15.x patch was chosen deliberately. This needs
confirmation via the user's own `pnpm install`; if it conflicts, try
other 15.x/14.x patches.

## 8. Accessibility

Applied consistently, not per-component ad hoc:

- Every interactive component meets the touch-target floor (`theme.touchTarget`) on native, and a minimum click target on web.
- Every color pairing used for text-on-background is verified ≥4.5:1 contrast by `ui-tokens/tokens.spec.ts`, computed via a from-scratch WCAG 2.1 formula (no color library dependency — the sandbox has no npm registry access to add one during this build).
- Status is never conveyed by color alone: `Badge`/`ErrorState`/status colors are always paired with text or an icon.
- Every component that manages its own interaction state exposes it to assistive tech (`aria-busy`/`accessibilityState.busy` for `Button` loading, `aria-describedby`/`role="alert"` for `Input` errors, etc.) rather than only a visual change.
- Reduced-motion is respected where animation is decorative (`Skeleton`) and deliberately *not* suppressed where animation is the information (`Spinner`) — see §4 above for the reasoning.

## 9. Developer experience

**Naming**: one component per directory
(`ComponentName/ComponentName.tsx` + `.spec.tsx` + `index.ts`),
PascalCase directories matching the exported component name — mirrors
the convention already used by `libs/domain/*`'s service/module files.

**Imports**: consumers always import from the package barrel
(`@ecclesia/ui-web` / `@ecclesia/ui-native`), never a deep path like
`@ecclesia/ui-web/lib/Button/Button` — enforced by convention today
(no lint rule added this sprint; a `no-restricted-imports` rule
blocking deep imports would be a reasonable small follow-up if deep
imports show up in review).

**Storybook**: recommended, not built this sprint. Given this repo's
demonstrated sensitivity to new build tooling (see §1's styling-approach
rationale), adding Storybook should be its own small, isolated sprint
with its own verification pass — bundling it into this one would risk
tooling breakage obscuring whether the *components* are correct.

**Testing strategy**: React Testing Library (web) /
`@testing-library/react-native` (native) — every component's `.spec`
asserts rendered output and accessibility-relevant attributes
(labels, roles, `aria-*`/`accessibility*` props), not implementation
detail (no snapshot tests, no internal-state assertions). This matches
the testing philosophy already used throughout `libs/domain/*`.
**Sandbox caveat**: Jest cannot execute in this sandbox (persistent
`@swc/core` native-binding failure, present since the project's very
first sprint) — every spec listed in this document was written to the
same standard as the executable domain-module tests, but has only been
statically type-checked (`tsc --noEmit`) here, not actually run. Real
`pnpm test` execution is the user's machine's job — see the root
README's verification section.

## 10. Acceptance criteria — walkthrough

The prompt's stated acceptance bar: *"apps/web-admin and apps/mobile
both import the same design tokens and the same base components, with
platform-specific implementations."*

- `apps/web-admin/src/app/app.tsx` imports `ThemeProvider`, `useTheme`, `Heading`, `Text`, `Button`, `Card`, `Badge` from `@ecclesia/ui-web`.
- `apps/mobile/src/app/App.tsx` imports the same six named exports from `@ecclesia/ui-native` instead.
- Both render an identical *structure* (heading, description text, a card containing a heading + status badge + description + button that increments a demo counter) using each platform's native primitives (`<div>`/`<h1>` vs. `View`/RN `Text`), proving the shared component contracts produce visually-equivalent, platform-correct output.
- Both compile cleanly via `tsc --noEmit` against their respective `tsconfig.app.json`, with the only remaining errors being the expected "module not found" for `lucide-react`/`lucide-react-native` (not yet installed in this sandbox — resolves after the user's own `pnpm install`).
- This showcase is explicitly commented in both files as **not** a product screen — a placeholder proving the wiring, exactly like the Sprint 0 scaffolds it replaces.

## 11. Sandbox limitations disclosed this sprint

- Jest cannot execute at all (native `@swc/core` binding failure) — true since the project's first sprint, unrelated to this work.
- **New this sprint**: `npx nx lint`/`nx build` via the Nx project graph became unreliable mid-sprint after an `npx nx reset` (triggered by `@nx/jest/plugin`'s target-inference step hitting the same broken `@swc/core` path while analyzing the new `ui-web` project's `jest.config.ts`). Every remaining in-sandbox verification in this sprint used direct `npx tsc -p <tsconfig> --noEmit` instead, which has been reliable throughout. Full `pnpm lint`/`pnpm test`/`pnpm build` is deferred to the user's real machine, per the verification commands in the root README.
- No npm registry network access — new dependency versions (`lucide-react`, `lucide-react-native`, `react-native-svg`) were sourced via `WebSearch` for approximate current/compatible versions, not registry-verified in-sandbox. Requires the user's own `pnpm install` to confirm.
