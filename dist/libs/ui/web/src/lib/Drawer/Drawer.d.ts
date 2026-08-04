import { type ReactNode } from 'react';
export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    /** Labels the panel for assistive technology - same "always a real heading, not just an aria-label string" rule as `Modal`. */
    title: string;
    children: ReactNode;
    /** Which edge the panel slides in from. Defaults to `right` - the conventional side for a supplementary detail/filter panel that doesn't require the full-attention commitment of a centered `Modal`. */
    side?: 'left' | 'right';
    /** Same "explicit button press, never dismiss-by-accident" rule `Modal` documents - defaults to `true`. */
    dismissible?: boolean;
    footer?: ReactNode;
    testId?: string;
}
/**
 * A side panel for supplementary content or filters that doesn't need a
 * centered `Modal`'s full-attention framing (Design System v1.0 Part 7.8
 * names Drawer alongside Modal/Toast/Tooltip as needing the same
 * portal/overlay strategy - this is that strategy reapplied, not
 * re-solved: same `createPortal`-to-`document.body`, same
 * `zIndex.overlay`/`zIndex.modal` tokens, same minimal dependency-free
 * focus trap and focus-return-on-close behavior as `Modal.tsx` - see that
 * file's doc comment for the full rationale, not repeated here). The one
 * real difference is layout: full-height, edge-anchored, slides in rather
 * than fading in centered.
 */
export declare function Drawer({ isOpen, onClose, title, children, side, dismissible, footer, testId }: DrawerProps): import("react").ReactPortal | null;
//# sourceMappingURL=Drawer.d.ts.map