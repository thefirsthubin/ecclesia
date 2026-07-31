# apps/mobile

The React Native client used by Shepherds, Basonta Leaders, Treasurers,
and Members (Blueprint §8.2). Offline-first attendance/offering capture
(Blueprint §8.4, NFR-OFF-01/02) lives here.

**Status:** registered as a real Nx project (Sprint 0 Milestone 2) with a
placeholder `App` component, Metro/Babel config, and Jest wired to the
`react-native` preset. No product screens yet, per this milestone's scope.

**Known gap - native folders.** `ios/` and `android/` are intentionally not
hand-authored here: they're normally produced by the React Native
community CLI template (which Nx's own generator shells out to), and that
requires network access this environment doesn't have. Run this once on a
machine with internet access, before the first `nx run mobile:run-ios` or
`:run-android`:

```bash
npx react-native@latest init EcclesiaMobileTemplate --skip-install
# then copy the generated ios/ and android/ directories into apps/mobile/,
# updating bundle identifiers / package names to match app.json.
```

Metro bundling and Jest-based testing of `src/` do not require the native
folders to exist.
