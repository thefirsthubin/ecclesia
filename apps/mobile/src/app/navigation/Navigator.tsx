import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * `[Design Decision, Mobile Shell + Attendance Capture sprint]` A minimal,
 * dependency-free stack navigator for `apps/mobile` — the real-navigation
 * gap `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` §0/§11 explicitly flagged as
 * out of scope for that sprint ("Real navigation. The single largest
 * structural gap... once a navigator is installed, QuickActionsRow's two
 * stub callbacks... are the integration points").
 *
 * No `react-navigation` (or any navigation library) exists anywhere in
 * this workspace's `package.json`, and this sandbox has no
 * package-registry network access to add one (confirmed during the
 * Sprint Review task and again during the Development Authentication
 * sprint — `npm install` 403s). `apps/web-admin`'s own hand-built router
 * (`apps/web-admin/src/app/router/router.tsx`) set the precedent for
 * this project's response to "no routing library, no network access to
 * add one": build the minimal thing the actual screens need, not a
 * general-purpose router. This is the React Native equivalent of that
 * decision — a state-based screen stack, since React Native has no
 * `window.history`/URL to drive navigation from the way the web version
 * does. No deep-linking, no back-button-hardware wiring (Android's
 * hardware back button is not intercepted) — both real, disclosed
 * limitations of a hand-built stack this minimal, not silently assumed
 * to work.
 *
 * Screen params are a plain untyped `Record<string, string>` (mirroring
 * `router.tsx`'s own `:param` extraction shape) rather than a typed
 * per-screen params map — with only two screens this sprint, the
 * type-safety a full typed navigator (React Navigation's own approach)
 * would buy isn't worth building from scratch.
 *
 * `[Stewardship gaps sprint]` **`switchTab` added** alongside the
 * original `navigate`/`goBack` push-stack pair, wiring the real bottom
 * tab bar (`AppShell.tsx`, `@ecclesia/ui-native`'s `BottomNav`) Design
 * System §3.2 always specified. `navigate`/`goBack` are unchanged and
 * kept, not replaced — every one of this app's five screens is currently
 * a flat, top-level tab destination with nothing pushed on top of it, but
 * §3.2 itself names a real future case for a second stack level ("Tab →
 * Detail... Attendance tab → a specific Gathering's attendance capture
 * screen"), and `navigate`/`goBack` are exactly the already-built,
 * already-tested mechanism for that - removing them now only to
 * reintroduce the identical thing later would be pure churn.
 * `switchTab` is a distinct operation, not a `navigate` variant: it
 * *resets* the whole stack to a single entry (`canGoBack` becomes
 * `false`), matching real tab-bar semantics (switching tabs is not
 * "pushing a screen you can back out of") - a plain `navigate` for tab
 * switches would instead pile up unbounded back-history behind the tab
 * bar, which is not what any tab-bar navigation pattern does.
 *
 * `[Mobile Personas sprint]` Six new screen names added for the three new
 * personas' own middle two tabs (`ministry-roster`/`ministry-events` for
 * Ministry Leader, `finance-verify`/`finance-reconcile` for Finance
 * Officer, `pastor-alerts`/`pastor-cluster` for Resident Pastor) - `'dashboard'`
 * and `'profile'` are deliberately *not* duplicated per-persona: every
 * persona's tab bar has exactly one Dashboard and one Profile tab, and
 * `App.tsx`'s `CurrentScreen` already branches the Dashboard case on
 * `actor.role` to pick the right component - a second `ScreenName` per
 * persona for the same tab position would only complicate `AppShell`'s
 * already role-aware `TABS` for no navigational benefit (`switchTab`
 * doesn't need to know *which* Dashboard it's switching to, only that the
 * key is `'dashboard'`).
 *
 * `[Usher role milestone]` Two more added for the Usher persona's own
 * middle two tabs (`usher-attendance`/`visitor-intake`) - not named
 * `'attendance-capture'` (the Shepherd's own screen, a different
 * component with a different data shape, see `USHER_ROLE_PROPOSAL.md`
 * §4) even though both tabs are conceptually "record attendance."
 */

export type ScreenName =
  | 'dashboard'
  | 'attendance-capture'
  | 'offering-recording'
  | 'follow-up-queue'
  | 'ministry-roster'
  | 'ministry-events'
  | 'finance-verify'
  | 'finance-reconcile'
  | 'pastor-alerts'
  | 'pastor-cluster'
  | 'usher-attendance'
  | 'visitor-intake'
  | 'profile';

interface NavigationEntry {
  screen: ScreenName;
  params: Record<string, string>;
}

interface NavigationContextValue {
  current: NavigationEntry;
  navigate: (screen: ScreenName, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack: boolean;
  switchTab: (screen: ScreenName) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<NavigationEntry[]>([{ screen: 'dashboard', params: {} }]);

  const navigate = useCallback((screen: ScreenName, params: Record<string, string> = {}) => {
    setStack((prev) => [...prev, { screen, params }]);
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const switchTab = useCallback((screen: ScreenName) => {
    setStack([{ screen, params: {} }]);
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      current: stack[stack.length - 1],
      navigate,
      goBack,
      canGoBack: stack.length > 1,
      switchTab,
    }),
    [stack, navigate, goBack, switchTab],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigate/useCurrentScreen/useGoBack/useSwitchTab must be used within a NavigationProvider');
  }
  return context;
}

export function useNavigate(): (screen: ScreenName, params?: Record<string, string>) => void {
  return useNavigationContext().navigate;
}

export function useGoBack(): { goBack: () => void; canGoBack: boolean } {
  const { goBack, canGoBack } = useNavigationContext();
  return { goBack, canGoBack };
}

export function useSwitchTab(): (screen: ScreenName) => void {
  return useNavigationContext().switchTab;
}

export function useCurrentScreen(): { screen: ScreenName; params: Record<string, string> } {
  const { current } = useNavigationContext();
  return current;
}
