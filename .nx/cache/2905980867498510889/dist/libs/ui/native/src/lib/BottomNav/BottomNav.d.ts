import type { IconName } from '@ecclesia/ui-core';
export interface BottomNavItem {
    key: string;
    label: string;
    icon: IconName;
    active: boolean;
}
export interface BottomNavProps {
    items: BottomNavItem[];
    onPress: (key: string) => void;
    testId?: string;
}
/**
 * Persistent bottom tab bar - mobile's primary navigation surface
 * (Design System v1.0 §3.1's mobile-nav pattern, the direct counterpart
 * to `ui-web`'s `Sidebar`). **Native only** - `Sidebar` already covers
 * web's persistent-left-nav pattern, and there is no equivalent
 * bottom-tab convention on web admin. Deliberately an `onPress(key)`
 * callback, not `Sidebar`'s `linkAs` router-injection pattern - mobile
 * navigation in this codebase goes through whatever navigation library
 * `apps/mobile` uses (not a hand-built web-style `Link`), so this stays
 * agnostic the same way `Tabs`' `onChange` does, rather than assuming a
 * specific navigation library's API shape.
 *
 * Does **not** apply its own safe-area bottom inset - this library has no
 * dependency on `react-native-safe-area-context` (not installed in this
 * workspace), so wrapping this in the caller's own safe-area container is
 * the caller's responsibility, the same disclosed boundary `Toast`'s
 * native provider draws around "mount near the app root."
 */
export declare function BottomNav({ items, onPress, testId }: BottomNavProps): import("react").JSX.Element;
//# sourceMappingURL=BottomNav.d.ts.map