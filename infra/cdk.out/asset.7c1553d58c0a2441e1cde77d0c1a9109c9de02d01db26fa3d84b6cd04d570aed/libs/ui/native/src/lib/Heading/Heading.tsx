import { Text as RNText, type TextStyle } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface HeadingProps {
  children: string;
  level: 1 | 2 | 3 | 'display';
  color?: string;
  testId?: string;
}

function toRNFontWeight(weight: number): TextStyle['fontWeight'] {
  return String(weight) as TextStyle['fontWeight'];
}

/**
 * React Native equivalent of `ui-web`'s `Heading`. React Native has no
 * native `<h1>`-`<h6>` semantic hierarchy - the closest accessibility
 * equivalent is `accessibilityRole="header"` on every heading regardless
 * of level (RN/iOS/Android screen readers do not expose a numeric heading
 * level the way HTML does), so document-order is what conveys hierarchy
 * on this platform, not a level-specific role.
 */
export function Heading({ children, level, color, testId }: HeadingProps) {
  const theme = useTheme();
  const styleKey = level === 'display' ? 'display' : (`heading${level}` as const);
  const style = theme.typography[styleKey];

  return (
    <RNText
      testID={testId}
      accessibilityRole="header"
      style={{
        fontFamily: theme.fontFamily.base,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: toRNFontWeight(style.fontWeight),
        letterSpacing: style.letterSpacing,
        color: color ?? theme.colors.text.primary,
      }}
    >
      {children}
    </RNText>
  );
}
