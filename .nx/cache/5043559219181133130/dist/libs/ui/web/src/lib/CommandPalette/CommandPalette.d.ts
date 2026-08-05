import type { IconName } from '@ecclesia/ui-core';
export interface CommandItem {
    id: string;
    label: string;
    icon?: IconName;
    /** Optional section heading items are grouped under (e.g. "Navigate", "Actions") - ungrouped items render under no heading, before any grouped ones. */
    group?: string;
    onSelect: () => void;
}
export interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    items: CommandItem[];
    placeholder?: string;
    testId?: string;
}
/**
 * A Cmd/Ctrl+K launcher for quick navigation and actions (Design System
 * v1.0 Part 7.8's command-palette concept) - **web only**. This is a
 * disclosed platform gap, not an oversight: there is no equivalent
 * keyboard-shortcut-launcher convention on mobile (no hardware keyboard
 * to bind Cmd+K to in the common case), so `ui-native` has no
 * `CommandPalette`. Reuses the same `createPortal`-to-`document.body` +
 * `zIndex.overlay`/`zIndex.modal` strategy `Modal`/`Drawer` established,
 * but with its own keyboard model - this is a `combobox` (WAI-ARIA
 * "editable combobox with list autocomplete" pattern: a text input with
 * `role="combobox"`, `aria-expanded`, `aria-controls` pointing at a
 * `role="listbox"`, and `aria-activedescendant` tracking the highlighted
 * option) rather than `Modal`'s own Tab-trap - arrow keys move the
 * active option, Enter activates it, Escape closes.
 *
 * This component does not itself own opening on a `Cmd+K`/`Ctrl+K`
 * keypress - that global listener is an app-shell concern (needs to
 * know whether focus is already inside a text field, whether another
 * overlay is open, etc.), out of this library's scope. The caller wires
 * the keypress to `isOpen`; this component only renders the palette
 * once open.
 */
export declare function CommandPalette({ isOpen, onClose, items, placeholder, testId }: CommandPaletteProps): import("react").ReactPortal | null;
//# sourceMappingURL=CommandPalette.d.ts.map