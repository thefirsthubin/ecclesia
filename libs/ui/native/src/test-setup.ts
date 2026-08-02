// @testing-library/react-native (v12+) ships its own Jest matchers
// (toBeTruthy, toBeOnTheScreen, etc.) auto-registered on import - no
// separate jest-native setup package is required (mirrors
// apps/mobile/src/test-setup.ts's identical comment/decision).

// `Skeleton`'s pulse animation uses `Animated.timing(..., { useNativeDriver: true })`
// (Design System-correct for a real device), but the native animated
// module has no implementation under Jest's test renderer - without this
// mock, mounting any component that starts a native-driven animation
// throws "Invariant Violation: Native animated module is not available".
// This is React Native's own documented Jest workaround, not a
// project-specific hack.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
