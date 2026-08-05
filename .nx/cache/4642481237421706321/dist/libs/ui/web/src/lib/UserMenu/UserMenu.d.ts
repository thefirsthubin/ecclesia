export interface UserMenuProps {
    name: string;
    /** e.g. "Resident Pastor" - a human-readable label, not the raw `Role` enum value. */
    roleLabel: string;
    onLogout: () => void;
    testId?: string;
}
/**
 * Top-bar user menu (Design System §3.1's "User Menu") - identity display
 * plus logout (STEP 4). A disclosure button, same keyboard-operable
 * pattern as `NotificationBell`.
 */
export declare function UserMenu({ name, roleLabel, onLogout, testId }: UserMenuProps): import("react").JSX.Element;
//# sourceMappingURL=UserMenu.d.ts.map