import type { ReactNode } from 'react';
import type { IconName } from '@ecclesia/ui-core';
export interface EmptyStateProps {
    icon?: IconName;
    title: string;
    description?: string;
    action?: ReactNode;
    /**
     * `neutral` (default - "no data yet"/"no results") reads plainly.
     * `positive` is Design System v1.0 Part 7.18's `all-clear` case - an
     * empty priority zone is *good news* ("Nothing needs your attention
     * today") and must read as calm reassurance, not as an error or a
     * broken screen.
     */
    tone?: 'neutral' | 'positive';
    testId?: string;
}
/** A designed state for "this list/table/zone has no content" (Design System v1.0 Part 7.18) - never a blank gap. */
export declare function EmptyState({ icon, title, description, action, tone, testId }: EmptyStateProps): import("react").JSX.Element;
//# sourceMappingURL=EmptyState.d.ts.map