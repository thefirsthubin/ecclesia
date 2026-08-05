import type { IconName } from '@ecclesia/ui-core';
export interface EmptyStateAction {
    label: string;
    onPress: () => void;
}
export interface EmptyStateProps {
    icon?: IconName;
    title: string;
    description?: string;
    action?: EmptyStateAction;
    tone?: 'neutral' | 'positive';
    testId?: string;
}
export declare function EmptyState({ icon, title, description, action, tone, testId }: EmptyStateProps): import("react").JSX.Element;
//# sourceMappingURL=EmptyState.d.ts.map