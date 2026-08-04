export interface ErrorStateProps {
    title: string;
    description?: string;
    onRetry?: () => void;
    testId?: string;
}
/** React Native equivalent of `ui-web`'s `ErrorState` - `accessibilityLiveRegion="assertive"` is RN's analogue of ARIA's `role="alert"`. */
export declare function ErrorState({ title, description, onRetry, testId }: ErrorStateProps): import("react").JSX.Element;
//# sourceMappingURL=ErrorState.d.ts.map