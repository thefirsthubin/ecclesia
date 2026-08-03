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
