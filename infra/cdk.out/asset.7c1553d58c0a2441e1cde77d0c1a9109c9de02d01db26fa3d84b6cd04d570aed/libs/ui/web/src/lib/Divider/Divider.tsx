import { useTheme } from '../ThemeProvider';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  testId?: string;
}

/** A visual content separator (Design System v1.0 Part 5.7's border discipline). Purely decorative - hidden from assistive technology. */
export function Divider({ orientation = 'horizontal', testId }: DividerProps) {
  const theme = useTheme();
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-testid={testId}
      style={{
        border: 'none',
        backgroundColor: theme.colors.border.subtle,
        width: isHorizontal ? '100%' : 1,
        height: isHorizontal ? 1 : '100%',
      }}
    />
  );
}
