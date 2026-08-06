import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { TypographyRole } from '@ecclesia/ui-core';

export type TextVariant = Exclude<TypographyRole, 'display' | 'heading1' | 'heading2' | 'heading3'>;

export interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TextVariant;
  color?: string;
  testId?: string;
}

/** Converts `ui-tokens`' numeric `FontWeight` (400/500/600/700) into the string literal RN's `TextStyle.fontWeight` expects. */
function toRNFontWeight(weight: number): TextStyle['fontWeight'] {
  return String(weight) as TextStyle['fontWeight'];
}

/** React Native equivalent of `ui-web`'s `Text` - same token-driven rule, RN's `<Text>` primitive instead of `<p>`/`<span>`. */
export function Text({ children, variant = 'body', color, testId, ...rest }: TextProps) {
  const theme = useTheme();
  const style = theme.typography[variant];

  return (
    <RNText
      {...rest}
      testID={testId}
      style={{
        fontFamily: theme.fontFamily.base,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: toRNFontWeight(style.fontWeight),
        letterSpacing: style.letterSpacing,
        color: color ?? theme.colors.text.primary,
        fontVariant: style.tabularNumbers ? ['tabular-nums'] : undefined,
      }}
    >
      {children}
    </RNText>
  );
}
