import { type ReactNode } from 'react';
import type { StatusKey } from '@ecclesia/ui-core';
export interface ToastOptions {
    status?: StatusKey;
    message: string;
    description?: string;
    duration?: number;
}
interface ToastContextValue {
    show: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
}
/**
 * React Native equivalent of `ui-web`'s `ToastProvider`/`useToast`. RN has
 * no DOM-portal concept, so instead of portaling to a document root, this
 * provider renders the toast stack as an absolutely-positioned `View`
 * layered over its own `children` - the same expectation as `ui-web`'s
 * version, mount once near the app root. `pointerEvents="box-none"` on the
 * covering layer lets touches pass through to whatever's underneath
 * except where an actual toast card is rendered, so a toast never blocks
 * interaction with the rest of the screen the way `Modal`'s scrim
 * deliberately does.
 */
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useToast(): ToastContextValue;
export {};
//# sourceMappingURL=ToastProvider.d.ts.map