import type { StatusKey } from '@ecclesia/ui-core';
export interface BadgeProps {
    children: string;
    status?: StatusKey;
    variant?: 'subtle' | 'solid';
    testId?: string;
}
/** React Native equivalent of `ui-web`'s `Badge` - identical token usage, `View`+`Text` instead of a styled `<span>`. */
export declare function Badge({ children, status, variant, testId }: BadgeProps): import("react").JSX.Element;
//# sourceMappingURL=Badge.d.ts.map