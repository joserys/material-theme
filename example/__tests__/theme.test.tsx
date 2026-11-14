import { createMaterialTheme, DEFAULT_COLOR_OPTIONS, generateDynamicColors } from '@helloworldstudio/material-theme';

const HEX = /^#[0-9a-f]{6}$/i;
const SEED = { hue: 270, chroma: 100, tone: 60, variant: 'vibrant' as const, specVersion: '2025' as const };

describe('generateDynamicColors', () => {
  it('fills every color role with a hex color', () => {
    const { elevation, backdrop, ...roles } = generateDynamicColors('light', SEED);
    Object.entries(roles).forEach(([role, value]) => expect([role, value]).toEqual([role, expect.stringMatching(HEX)]));
    Object.values(elevation).forEach(value => expect(value).toMatch(HEX));
    expect(backdrop).toMatch(/^rgba\(/);
  });

  it('makes light and dark schemes that differ', () => {
    const light = generateDynamicColors('light', SEED);
    const dark = generateDynamicColors('dark', SEED);
    expect(light.surface).not.toBe(dark.surface);
    expect(light.onSurface).not.toBe(dark.onSurface);
  });

  it('changes colors for contrast and color-blind modes', () => {
    const standard = generateDynamicColors('light', SEED);
    expect(generateDynamicColors('light', { ...SEED, contrast: 'high' }).primary).not.toBe(standard.primary);
    expect(generateDynamicColors('light', { ...SEED, colorBlindMode: 'deuteranopia' }).error).not.toBe(standard.error);
  });

  it('works with only a hue', () => {
    expect(generateDynamicColors('light', { hue: 157 }).primary).toMatch(HEX);
  });

  it('defaults to the M3 baseline: tonal spot, 2025 rules, standard contrast', () => {
    expect(DEFAULT_COLOR_OPTIONS).toEqual({
      hue: 299, chroma: 48, tone: 40, variant: 'tonalSpot', contrast: 'standard', specVersion: '2025', colorBlindMode: 'none',
    });
    expect(generateDynamicColors('light')).toEqual(generateDynamicColors('light', DEFAULT_COLOR_OPTIONS));
  });
});

describe('createMaterialTheme', () => {
  it('builds a light theme in the system font with no options at all', () => {
    const theme = createMaterialTheme();
    expect(theme.dark).toBe(false);
    expect(theme.reducedMotion).toBe(false);
    expect(theme.colors.primary).toMatch(HEX);
    expect(theme.fonts.bodyMedium.fontFamily).toBe('System'); // Jest runs as iOS
    expect(theme.fonts.titleMedium.fontWeight).toBe('500');
    expect(theme.fonts.titleMediumEmphasized.fontWeight).toBe('700');
  });

  it('sets fonts by group, and a role wins over its group', () => {
    const theme = createMaterialTheme({
      colors: SEED,
      fonts: { display: 'Display', title: 'Title', titleLarge: 'TitleLarge' },
    });
    expect(theme.fonts.displayLarge.fontFamily).toBe('Display');
    expect(theme.fonts.displaySmallEmphasized.fontFamily).toBe('Display');
    expect(theme.fonts.titleMedium.fontFamily).toBe('Title');
    expect(theme.fonts.titleLarge.fontFamily).toBe('TitleLarge');
    expect(theme.fonts.bodyLarge.fontFamily).toBe('System');
  });

  it('uses one file per weight without faking the weight', () => {
    const theme = createMaterialTheme({ colors: SEED, fonts: { body: { regular: 'Sans-Regular', emphasized: 'Sans-Medium' } } });
    expect(theme.fonts.bodyLarge).toMatchObject({ fontFamily: 'Sans-Regular', fontWeight: 'normal' });
    expect(theme.fonts.bodyLargeEmphasized).toMatchObject({ fontFamily: 'Sans-Medium', fontWeight: 'normal' });
  });

  it('carries mode, reduced motion, font caps and a navigation theme', () => {
    const theme = createMaterialTheme({ mode: 'dark', colors: SEED, reducedMotion: true, fontScaleCaps: { display: 1.3 } });
    expect(theme.dark).toBe(true);
    expect(theme.reducedMotion).toBe(true);
    expect(theme.fontScaleCaps.display).toBe(1.3);
    expect(theme.navigation.colors.primary).toBe(theme.colors.primary);
    expect(theme.navigation.fonts.regular.fontFamily).toBe(theme.fonts.bodyLarge.fontFamily);
  });
});

describe('missing options', () => {
  it('uses the defaults for options passed as undefined', () => {
    expect(() => generateDynamicColors('light', { hue: 157, colorBlindMode: undefined, contrast: undefined })).not.toThrow();
    expect(generateDynamicColors('light', { hue: 157, colorBlindMode: undefined }).error)
      .toBe(generateDynamicColors('light', { hue: 157 }).error);
  });
});
