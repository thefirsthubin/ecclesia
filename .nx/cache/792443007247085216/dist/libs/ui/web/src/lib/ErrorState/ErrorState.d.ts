export interface ErrorStateProps {
    title: string;
    /** Plain-language explanation of what happened - never a raw error code or stack trace (Design System v1.0 Part 7.20, NFR-USA-01). */
    description?: string;
    onRetry?: () => void;
    testId?: string;
}
/** A designed failure state with a path forward (Design System v1.0 Part 7.20) - never a dead end. */
export declare function ErrorState({ title, description, onRetry, testId }: ErrorStateProps): import("react").JSX.Element;
//# sourceMappingURL=ErrorState.d.ts.map