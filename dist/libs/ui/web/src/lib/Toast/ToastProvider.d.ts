import { type ReactNode } from 'react';
import type { StatusKey } from '@ecclesia/ui-core';
export interface ToastOptions {
    status?: StatusKey;
    message: string;
    description?: string;
    /** Milliseconds before auto-dismissal. `0` disables auto-dismiss (caller must dismiss, or the person closes it manually) - used sparingly, e.g. a toast with its own undo action. Defaults to 5000. */
    duration?: number;
}
interface ToastContextValue {
    show: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
}
/**
 * Transient status messaging (Design System v1.0 Part 7.8's Toast/Snackbar
 * concept). Unlike `Modal` (one caller, one `isOpen` flag tied to a
 * specific action), a toast can be triggered from anywhere in the tree -
 * a save handler deep in a form, a background sync completing - so this
 * is a context provider + `useToast()` hook, not a purely
 * caller-controlled presentational component. Mount once near the app
 * root (same expectation as `ThemeProvider`).
 *
 * Portals to `document.body` at `zIndex.toast` (the token reserved for
 * exactly this, previously unused), stacking newest-on-top in the
 * bottom-right corner. Each toast is `role="status"` +
 * `aria-live="polite"` (`"assertive"` for `danger`, since an error toast
 * is worth interrupting screen-reader output for) so assistive tech
 * announces it without the person needing to navigate to find it.
 */
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
/** Throws outside a `ToastProvider` - unlike `useTheme` (which silently falls back to light mode via a context default), there is no sane default toast queue to fall back to, so this fails loudly instead. */
export declare function useToast(): ToastContextValue;
export {};
//# sourceMappingURL=ToastProvider.d.ts.map