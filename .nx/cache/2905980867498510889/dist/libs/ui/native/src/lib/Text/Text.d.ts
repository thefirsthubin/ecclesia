import { type TextProps as RNTextProps } from 'react-native';
import type { TypographyRole } from '@ecclesia/ui-core';
export type TextVariant = Exclude<TypographyRole, 'display' | 'heading1' | 'heading2' | 'heading3'>;
export interface TextProps extends Omit<RNTextProps, 'style'> {
    variant?: TextVariant;
    color?: string;
    testId?: string;
}
/** React Native equivalent of `ui-web`'s `Text` - same token-driven rule, RN's `<Text>` primitive instead of `<p>`/`<span>`. */
export declare function Text({ children, variant, color, testId, ...rest }: TextProps): import("react").JSX.Element;
//# sourceMappingURL=Text.d.ts.map