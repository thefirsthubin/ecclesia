import type { Size } from '@ecclesia/ui-core';
export interface SpinnerProps {
    size?: Size;
    color?: string;
    label?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Spinner`. Uses the platform-
 * native `ActivityIndicator` rather than a hand-rolled rotating view -
 * RN's own component already animates correctly on both iOS and Android
 * and is what every accessibility service on those platforms expects to
 * see for a loading state, so re-implementing it (as `ui-web` reasonably
 * does, since the DOM has no native spinner) would be working against
 * the platform, not with it.
 */
export declare function Spinner({ size, color, label }: SpinnerProps): import("react").JSX.Element;
//# sourceMappingURL=Spinner.d.ts.map