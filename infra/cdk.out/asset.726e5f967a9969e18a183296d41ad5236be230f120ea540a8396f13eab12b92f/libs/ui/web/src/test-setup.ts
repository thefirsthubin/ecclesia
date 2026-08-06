import '@testing-library/jest-dom';

/**
 * jsdom (the `testEnvironment` this project's jest.config.ts uses) does
 * not implement `window.matchMedia` at all - calling it throws
 * "matchMedia is not a function". `ThemeProvider`'s system-color-scheme
 * detection and `useReducedMotion` both call it, so every test in this
 * package needs a stub, not just the ones that exercise those hooks
 * directly. Defaults to "no match" (light mode, motion not reduced) -
 * individual tests override `window.matchMedia` per-case when they need
 * to simulate the opposite.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
