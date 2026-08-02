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
export declare const ICON_REGISTRY: {
    readonly check: "Check";
    readonly close: "X";
    readonly chevronDown: "ChevronDown";
    readonly chevronUp: "ChevronUp";
    readonly chevronLeft: "ChevronLeft";
    readonly chevronRight: "ChevronRight";
    readonly chevronsUpDown: "ChevronsUpDown";
    readonly search: "Search";
    readonly bell: "Bell";
    readonly alertTriangle: "AlertTriangle";
    readonly alertCircle: "AlertCircle";
    readonly infoCircle: "Info";
    readonly checkCircle: "CheckCircle2";
    readonly xCircle: "XCircle";
    readonly user: "User";
    readonly users: "Users";
    readonly calendar: "Calendar";
    readonly clock: "Clock";
    readonly menu: "Menu";
    readonly plus: "Plus";
    readonly minus: "Minus";
    readonly settings: "Settings";
    readonly home: "Home";
    readonly trendingUp: "TrendingUp";
    readonly trendingDown: "TrendingDown";
    readonly moreHorizontal: "MoreHorizontal";
    readonly eye: "Eye";
    readonly eyeOff: "EyeOff";
    readonly upload: "Upload";
    readonly download: "Download";
    readonly trash: "Trash2";
    readonly edit: "Pencil";
    readonly filter: "Filter";
    readonly arrowRight: "ArrowRight";
    readonly arrowLeft: "ArrowLeft";
    readonly refresh: "RefreshCw";
};
export type IconName = keyof typeof ICON_REGISTRY;
export type LucideIconKey = (typeof ICON_REGISTRY)[IconName];
//# sourceMappingURL=icon-registry.d.ts.map