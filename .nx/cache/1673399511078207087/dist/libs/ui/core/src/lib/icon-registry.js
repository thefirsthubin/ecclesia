"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICON_REGISTRY = void 0;
/**
 * The single source of truth for "which icons exist in Ecclesia" (Design
 * System v1.0 Part 9 - "Select ONE icon library... never allow multiple
 * icon systems"). This file does not import lucide (or any icon library)
 * itself - it stays framework/library-agnostic, matching `ui-core`'s role
 * as shared logic only. `ui-web/src/lib/Icon` and
 * `ui-native/src/lib/Icon` each import lucide's *own* package
 * (`lucide-react` / `lucide-react-native` respectively) and use
 * `LUCIDE_ICON_KEY` below to look up the right exported component by
 * name - so a screen never imports lucide directly, only `<Icon name="..."/>`
 * from its platform's ui library, and the valid set of `name`s is defined
 * exactly once, here.
 *
 * Curated, not exhaustive: lucide ships >1000 icons; Ecclesia's design
 * system uses a bounded, meaningful set (Part 5.8 - icons are never the
 * sole carrier of meaning, and a small consistent set is easier to keep
 * visually coherent than an open-ended one). Extending this list is a
 * one-line addition here plus confirming the same lucide export name
 * exists in both `lucide-react` and `lucide-react-native` (they ship the
 * same icon set under the same names, by design).
 */
exports.ICON_REGISTRY = {
    check: 'Check',
    close: 'X',
    chevronDown: 'ChevronDown',
    chevronUp: 'ChevronUp',
    chevronLeft: 'ChevronLeft',
    chevronRight: 'ChevronRight',
    chevronsUpDown: 'ChevronsUpDown',
    search: 'Search',
    bell: 'Bell',
    alertTriangle: 'AlertTriangle',
    alertCircle: 'AlertCircle',
    infoCircle: 'Info',
    checkCircle: 'CheckCircle2',
    xCircle: 'XCircle',
    user: 'User',
    users: 'Users',
    calendar: 'Calendar',
    clock: 'Clock',
    menu: 'Menu',
    plus: 'Plus',
    minus: 'Minus',
    settings: 'Settings',
    home: 'Home',
    trendingUp: 'TrendingUp',
    trendingDown: 'TrendingDown',
    moreHorizontal: 'MoreHorizontal',
    eye: 'Eye',
    eyeOff: 'EyeOff',
    upload: 'Upload',
    download: 'Download',
    trash: 'Trash2',
    edit: 'Pencil',
    filter: 'Filter',
    arrowRight: 'ArrowRight',
    arrowLeft: 'ArrowLeft',
    refresh: 'RefreshCw',
    /** `[Stewardship gaps sprint]` Added for `apps/mobile`'s real bottom tab
     * bar (`AppShell.tsx`) - `coins` (Offering tab) and `clipboardList`
     * (Follow-ups tab) had no existing registry entry close enough in
     * meaning to reuse (`plus`/`checkCircle` would have been a stretch).
     * Confirmed present under these exact names in both `lucide-react` and
     * `lucide-react-native` (both pinned to `1.28.0` in this workspace)
     * before adding, per this file's own "confirming the same lucide export
     * name exists in both platforms" rule above. */
    coins: 'Coins',
    clipboardList: 'ClipboardList',
    /** `[Mobile Personas sprint]` Added for `apps/mobile`'s three new
     * role-aware bottom tab bars (`AppShell.tsx`) - `landmark` (Finance
     * Officer's Reconcile tab, a bank/deposit-reconciliation icon lucide
     * ships under this exact name) and `building` (Resident Pastor's
     * Cluster/Branch tab - `Building2`, lucide's multi-storey building
     * glyph, a closer fit than the existing `home` which is already
     * `Dashboard`'s icon on every persona's tab bar). Same "no existing
     * entry close enough in meaning" reasoning as `coins`/`clipboardList`
     * above; confirmed present under these exact export names in both
     * `lucide-react` and `lucide-react-native` (both pinned to `1.28.0`)
     * before adding. */
    landmark: 'Landmark',
    building: 'Building2',
};
//# sourceMappingURL=icon-registry.js.map