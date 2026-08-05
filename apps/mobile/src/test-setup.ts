import { configure } from '@testing-library/react-native';

// @testing-library/react-native (v12+) ships its own Jest matchers
// (toBeTruthy, toBeOnTheScreen, etc.) auto-registered on import - no
// separate jest-native setup package is required.

// `@ecclesia/ui-native`'s `Skeleton` (used by every Shepherd Dashboard
// card's loading state) drives its pulse animation with
// `Animated.timing(..., { useNativeDriver: true })`. Under Jest's RN
// preset there is no real native animated module, and without this mock
// that call throws - the exact same fix `libs/ui/native/src/test-setup.ts`
// already applies for its own `Skeleton.spec.tsx`, needed here too now
// that `apps/mobile` actually renders `Skeleton` (via the Shepherd
// Dashboard's `CardAsyncBoundary`) instead of just the UI Foundation
// showcase.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// `[Bug fix, Mobile Personas sprint]` RTL's `waitFor()` has its own
// internal poll timeout, separate from Jest's per-test `testTimeout`
// (`jest.config.ts`) - defaulting to 1000ms
// (`@testing-library/react-native`'s own `config.ts`), never overridden
// anywhere in this project before now. A real `pnpm test` run (parallel
// Jest workers under real CPU contention, unlike this sandbox's serial
// `--runInBand` runs) showed `FinanceReconcileScreen.spec.tsx`'s
// "confirming a deposit refetches the reconciliation view" test fail
// with RTL's own "Unable to find an element with testID: ..." error -
// distinct from Jest's "Exceeded timeout of 5000ms" failures elsewhere
// in the same run, and NOT fixed by raising `testTimeout` alone, since
// that only budgets the whole test, not each individual `waitFor()`
// poll window. 10000ms gives real headroom under contention while
// staying comfortably under `testTimeout: 20000` so a genuinely broken
// `waitFor` still fails within its own test rather than always hitting
// the outer ceiling.
configure({ asyncUtilTimeout: 10000 });
