import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';

export interface HeadingProps {
  children: ReactNode;
  /** 1-3 maps to the Design System's heading1-3 roles; "display" is the Part 6.5 hero-metric role (Part 4.3's "used sparingly, at most once per screen"). */
  level: 1 | 2 | 3 | 'display';
  /**
   * The semantic HTML tag - defaults to `h${level}` (or `h1` for
   * "display"). Override only when visual size and document heading
   * hierarchy must diverge (e.g. a "display" hero metric that is not
   * actually the page's top heading) - accessibility (correct heading
   * order) always wins over visual size (Part 1.5).
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: string;
  testId?: string;
}

export function Heading({ children, level, as, color, testId }: HeadingProps) {
  const theme = useTheme();
  const styleKey = level === 'display' ? 'display' : (`heading${level}` as const);
  const style = theme.typography[styleKey];
  const Component = as ?? (level === 'display' ? 'h1' : (`h${level}` as const));

  const cssStyle: CSSProperties = {
    margin: 0,
    fontFamily: theme.fontFamily.base,
    fontSize: style.fontSize,
    lineHeight: `${style.lineHeight}px`,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    color: color ?? theme.colors.text.primary,
  };

  return (
    <Component style={cssStyle} data-testid={testId}>
      {children}
    </Component>
  );
}
