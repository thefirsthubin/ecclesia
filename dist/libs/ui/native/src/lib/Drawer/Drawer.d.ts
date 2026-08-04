import { type ReactNode } from 'react';
export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    side?: 'left' | 'right';
    dismissible?: boolean;
    footer?: ReactNode;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Drawer`, built on RN's own
 * `Modal` primitive - the same choice `ui-native`'s `Modal` made (see that
 * file's doc comment for the full rationale). The panel is a full-height
 * `View` anchored to `side` instead of centered, `slideInLeft`/
 * `slideInRight` isn't a built-in RN `animationType`, so `slide`
 * (RN's own bottom-anchored slide) is intentionally *not* used here -
 * `fade` is used instead to avoid a visually-wrong bottom-slide for a
 * side panel; a true edge-slide transition would need
 * `react-native-reanimated` and is a disclosed follow-up, not this
 * component's scope.
 */
export declare function Drawer({ isOpen, onClose, title, children, side, dismissible, footer, testId }: DrawerProps): import("react").JSX.Element;
//# sourceMappingURL=Drawer.d.ts.map