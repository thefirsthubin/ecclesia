import { type GestureResponderEvent } from 'react-native';
import type { ActionVariant, IconName, Size } from '@ecclesia/ui-core';
export interface ButtonProps {
    children?: string;
    variant?: ActionVariant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    iconLeft?: IconName;
    iconRight?: IconName;
    accessibilityLabel?: string;
    onPress?: (event: GestureResponderEvent) => void;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Button` - same variant/size/
 * loading/icon API, `Pressable` instead of `<button>`. Height defaults
 * are RN's own touch-target floor (44pt iOS / 48dp Android,
 * `theme.touchTarget.minIOS`/`minAndroid` - Design System v1.0 Part 1.5),
 * not `ui-web`'s 40px default, since mobile is a stricter accessibility
 * floor by platform convention.
 */
export declare function Button({ children, variant, size, loading, disabled, iconLeft, iconRight, accessibilityLabel, onPress, testId, }: ButtonProps): import("react").JSX.Element;
//# sourceMappingURL=Button.d.ts.map