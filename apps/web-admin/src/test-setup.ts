import '@testing-library/jest-dom';

// jsdom does not implement `window.matchMedia` - `AppShell`'s responsive
// sidebar-collapse logic (STEP 7) reads it via a real `matchMedia` call,
// so every test that mounts `AppShell` (directly or via a protected
// route) needs this polyfill, not just ones that explicitly test
// responsive behaviour.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
