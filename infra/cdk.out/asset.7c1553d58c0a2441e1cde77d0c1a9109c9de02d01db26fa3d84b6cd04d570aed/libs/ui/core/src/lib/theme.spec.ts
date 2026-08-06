import { buildTheme, lightTheme, darkTheme } from './theme';
import { ICON_REGISTRY } from './icon-registry';

describe('buildTheme', () => {
  it('resolves light mode colors from lightPalette', () => {
    const theme = buildTheme('light');
    expect(theme.mode).toBe('light');
    expect(theme.colors.surface.default).toBe('#FFFFFF');
  });

  it('resolves dark mode colors from darkPalette', () => {
    const theme = buildTheme('dark');
    expect(theme.mode).toBe('dark');
    expect(theme.colors.surface.default).toBe('#0A0A0A');
  });

  it('shares every non-color token table by identity across modes (Part 5.11 - only color is mode-dependent)', () => {
    const light = buildTheme('light');
    const dark = buildTheme('dark');
    expect(light.typography).toBe(dark.typography);
    expect(light.spacing).toBe(dark.spacing);
    expect(light.radius).toBe(dark.radius);
    expect(light.elevation).toBe(dark.elevation);
    expect(light.motion).toBe(dark.motion);
  });

  it('exports pre-built lightTheme/darkTheme singletons matching buildTheme output', () => {
    expect(lightTheme.mode).toBe('light');
    expect(darkTheme.mode).toBe('dark');
  });
});

describe('ICON_REGISTRY', () => {
  it('has no duplicate lucide keys (each semantic name maps to a distinct icon)', () => {
    const values = Object.values(ICON_REGISTRY);
    expect(new Set(values).size).toBe(values.length);
  });

  it('every entry uses PascalCase (matching lucide export names)', () => {
    for (const lucideKey of Object.values(ICON_REGISTRY)) {
      expect(lucideKey).toMatch(/^[A-Z][A-Za-z0-9]*$/);
    }
  });
});
