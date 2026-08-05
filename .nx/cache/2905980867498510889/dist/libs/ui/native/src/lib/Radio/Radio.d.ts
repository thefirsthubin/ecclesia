export interface RadioProps {
    label: string;
    checked: boolean;
    onPress: () => void;
    disabled?: boolean;
    testId?: string;
}
/**
 * A single option within a `RadioGroup` - React Native equivalent of
 * `ui-web`'s `Radio`. No native RN radio primitive exists, so this is a
 * `Pressable` ring + dot, with `accessibilityRole="radio"` carrying the
 * real semantics (same "artwork is decorative, props carry meaning" split
 * used throughout this library).
 */
export declare function Radio({ label, checked, onPress, disabled, testId }: RadioProps): import("react").JSX.Element;
//# sourceMappingURL=Radio.d.ts.map