/**
 * @fileoverview Generates a Material Design 3 color scheme from a seed color (used by createMaterialTheme).
 *
 * @description
 * Uses Material's own dynamic color engine (@material/material-color-utilities), the same one behind the
 * Material Theme Builder and Android's Material You, so every role gets the Theme Builder's tones and
 * contrast rules. Options (ColorOptions):
 * - hue / chroma / tone: the seed color in HCT (hue 0-360, colorfulness, lightness 0-100). The default seed
 *   is M3's baseline purple: hue 299, chroma 48, tone 40.
 * - variant: the scheme style (Theme Builder "Scheme"). tonalSpot (the default) is the Theme Builder
 *   default; fidelity stays closest to the seed color, vibrant and expressive are more colorful, neutral
 *   and monochrome are quieter.
 * - contrast: 'standard' (default), 'medium', 'high' (Theme Builder contrast) or a number from -1 to 1.
 * - specVersion: '2025' (default, the M3 Expressive rules) or '2021' (the classic M3 rules).
 * - colorBlindMode: 'none' (default), 'protanopia', 'deuteranopia' or 'tritanopia'. Shifts error and any
 *   accent color it could be confused with into hues that viewer tells apart (see adjustForColorBlindness).
 *
 * @examples
 * generateDynamicColors('light'); // M3 baseline
 * generateDynamicColors('dark', { hue: 157, chroma: 60, tone: 70 });
 * generateDynamicColors('light', { hue: 157, chroma: 60, variant: 'fidelity' }); // closest to the seed
 * generateDynamicColors('light', { hue: 270, chroma: 100, tone: 60, variant: 'vibrant', specVersion: '2025' });
 * generateDynamicColors('light', { hue: 157, chroma: 60, colorBlindMode: 'deuteranopia' });
 */

//Library Imports
import {
  DynamicScheme,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  TonalPalette,
} from '@material/material-color-utilities';

//Custom Imports
import type { ColorBlindMode, ColorOptions, ColorScheme, ColorSchemeVariant, ContrastLevel, ThemeMode } from './types';
import { withOpacity } from '../util/color';

//  _______  __    __  .__   __.   ______ .___________. __    ______   .__   __.     _______   _______   ______  __          ___      .______          ___   .___________. __    ______   .__   __.
// |   ____||  |  |  | |  \ |  |  /      ||           ||  |  /  __  \  |  \ |  |    |       \ |   ____| /      ||  |        /   \     |   _  \        /   \  |           ||  |  /  __  \  |  \ |  |
// |  |__   |  |  |  | |   \|  | |  ,----'`---|  |----`|  | |  |  |  | |   \|  |    |  .--.  ||  |__   |  ,----'|  |       /  ^  \    |  |_)  |      /  ^  \ `---|  |----`|  | |  |  |  | |   \|  |
// |   __|  |  |  |  | |  . `  | |  |         |  |     |  | |  |  |  | |  . `  |    |  |  |  ||   __|  |  |     |  |      /  /_\  \   |      /      /  /_\  \    |  |     |  | |  |  |  | |  . `  |
// |  |     |  `--'  | |  |\   | |  `----.    |  |     |  | |  `--'  | |  |\   |    |  '--'  ||  |____ |  `----.|  `----./  _____  \  |  |\  \----./  _____  \   |  |     |  | |  `--'  | |  |\   |
// |__|      \______/  |__| \__|  \______|    |__|     |__|  \______/  |__| \__|    |_______/ |_______| \______||_______/__/     \__\ | _| `._____/__/     \__\  |__|     |__|  \______/  |__| \__|

// Used for any option left out: M3's baseline seed in HCT, with the Theme Builder's and M3 Expressive's defaults
export const DEFAULT_COLOR_OPTIONS: Required<ColorOptions> = {
  hue: 299,
  chroma: 48,
  tone: 40,
  variant: 'tonalSpot',
  contrast: 'standard',
  specVersion: '2025',
  colorBlindMode: 'none',
};

const CONTRAST_LEVELS: Record<Exclude<ContrastLevel, number>, number> = { standard: 0, medium: 0.5, high: 1 };

const SCHEMES = {
  tonalSpot: SchemeTonalSpot,
  neutral: SchemeNeutral,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  monochrome: SchemeMonochrome,
  rainbow: SchemeRainbow,
  fruitSalad: SchemeFruitSalad,
} satisfies Record<ColorSchemeVariant, unknown>;

const roles = new MaterialDynamicColors();

const shift = (hue: number, delta: number) => ((hue + delta) % 360 + 360) % 360;

const toContrastLevel = (contrast: ContrastLevel) =>
  typeof contrast === 'number' ? Math.min(1, Math.max(-1, contrast)) : CONTRAST_LEVELS[contrast];

// Color blind adjustments
//
// People with color blindness tell colors apart along fewer directions. Red-weak and green-weak vision
// (protanopia, deuteranopia) mixes up reds, oranges, yellows and greens, but still sees blue vs orange
// clearly. Blue-weak vision (tritanopia) mixes up blues with greens and yellows with violets, but still
// sees red vs teal clearly. So each mode:
// - moves error to a "danger" hue the viewer sees clearly (orange, or red for tritanopia),
// - moves every accent palette (primary, secondary, tertiary) that would be confused with that danger
//   hue into the hue range the viewer sees as clearly different (blues, or teals for tritanopia),
//   keeping the accents' order around the color wheel so they stay distinct from each other,
// then regenerates every role from the adjusted palettes, so tones and contrast still follow M3.

interface ColorBlindAdjustment {
  dangerHue: number;                  // error's new hue
  confusedRange: [number, number];    // accent hues (from, to, clockwise) that would blend with danger
  safeRange: [number, number];        // where those accents land: `from` maps to the first, `to` to the second
}

const COLOR_BLIND_ADJUSTMENTS: Record<Exclude<ColorBlindMode, 'none'>, ColorBlindAdjustment> = {
  // Reds become violets and greens become blues; error becomes orange
  protanopia: { dangerHue: 65, confusedRange: [330, 200], safeRange: [315, 205] },
  deuteranopia: { dangerHue: 65, confusedRange: [330, 200], safeRange: [315, 205] },
  // Reds, pinks and oranges become teals and cyans; error stays a clear red
  tritanopia: { dangerHue: 20, confusedRange: [320, 70], safeRange: [165, 215] },
};

const ERROR_CHROMA = 84; // Material's standard error colorfulness

// Clockwise distance from `from` to `hue`, 0-360
const arc = (from: number, hue: number) => shift(hue, -from);

// Maps a hue inside `confused` to the same relative spot inside `safe`; other hues stay as they are
const remapHue = (hue: number, { confusedRange: [cFrom, cTo], safeRange: [sFrom, sTo] }: ColorBlindAdjustment) => {
  const span = arc(cFrom, cTo);
  const along = arc(cFrom, hue);
  if (along > span) return hue;
  return shift(sFrom, (along / span) * (sTo - sFrom));
};

const adjustForColorBlindness = (scheme: DynamicScheme, mode: ColorBlindMode) => {
  if (mode === 'none') return scheme;
  const adjustment = COLOR_BLIND_ADJUSTMENTS[mode];
  const accent = (palette: TonalPalette) => TonalPalette.fromHueAndChroma(remapHue(palette.hue, adjustment), palette.chroma);
  const source = scheme.sourceColorHct;

  return new DynamicScheme({
    sourceColorHct: Hct.from(remapHue(source.hue, adjustment), source.chroma, source.tone),
    variant: scheme.variant,
    contrastLevel: scheme.contrastLevel,
    isDark: scheme.isDark,
    specVersion: scheme.specVersion,
    primaryPalette: accent(scheme.primaryPalette),
    secondaryPalette: accent(scheme.secondaryPalette),
    tertiaryPalette: accent(scheme.tertiaryPalette),
    // Neutrals follow primary's new hue so surfaces keep a matching tint
    neutralPalette: accent(scheme.neutralPalette),
    neutralVariantPalette: accent(scheme.neutralVariantPalette),
    errorPalette: TonalPalette.fromHueAndChroma(adjustment.dangerHue, ERROR_CHROMA),
  });
};

/** Reads every M3 color role from the generated scheme */
const generateThemeTokens = (scheme: DynamicScheme) => {
  const hex = (role: ReturnType<MaterialDynamicColors['primary']>) => hexFromArgb(role.getArgb(scheme));

  return {
    primary: hex(roles.primary()),
    onPrimary: hex(roles.onPrimary()),
    primaryContainer: hex(roles.primaryContainer()),
    onPrimaryContainer: hex(roles.onPrimaryContainer()),
    primaryFixed: hex(roles.primaryFixed()),
    primaryFixedDim: hex(roles.primaryFixedDim()),
    onPrimaryFixed: hex(roles.onPrimaryFixed()),
    onPrimaryFixedVariant: hex(roles.onPrimaryFixedVariant()),
    secondary: hex(roles.secondary()),
    onSecondary: hex(roles.onSecondary()),
    secondaryContainer: hex(roles.secondaryContainer()),
    onSecondaryContainer: hex(roles.onSecondaryContainer()),
    secondaryFixed: hex(roles.secondaryFixed()),
    secondaryFixedDim: hex(roles.secondaryFixedDim()),
    onSecondaryFixed: hex(roles.onSecondaryFixed()),
    onSecondaryFixedVariant: hex(roles.onSecondaryFixedVariant()),
    tertiary: hex(roles.tertiary()),
    onTertiary: hex(roles.onTertiary()),
    tertiaryContainer: hex(roles.tertiaryContainer()),
    onTertiaryContainer: hex(roles.onTertiaryContainer()),
    tertiaryFixed: hex(roles.tertiaryFixed()),
    tertiaryFixedDim: hex(roles.tertiaryFixedDim()),
    onTertiaryFixed: hex(roles.onTertiaryFixed()),
    onTertiaryFixedVariant: hex(roles.onTertiaryFixedVariant()),
    error: hex(roles.error()),
    onError: hex(roles.onError()),
    errorContainer: hex(roles.errorContainer()),
    onErrorContainer: hex(roles.onErrorContainer()),
    background: hex(roles.background()),
    onBackground: hex(roles.onBackground()),
    surface: hex(roles.surface()),
    onSurface: hex(roles.onSurface()),
    surfaceDim: hex(roles.surfaceDim()),
    surfaceBright: hex(roles.surfaceBright()),
    surfaceContainerLowest: hex(roles.surfaceContainerLowest()),
    surfaceContainerLow: hex(roles.surfaceContainerLow()),
    surfaceContainer: hex(roles.surfaceContainer()),
    surfaceContainerHigh: hex(roles.surfaceContainerHigh()),
    surfaceContainerHighest: hex(roles.surfaceContainerHighest()),
    inverseSurface: hex(roles.inverseSurface()),
    inverseOnSurface: hex(roles.inverseOnSurface()),
    shadow: hex(roles.shadow()),
    scrim: hex(roles.scrim()),
    surfaceVariant: hex(roles.surfaceVariant()),
    onSurfaceVariant: hex(roles.onSurfaceVariant()),
    outline: hex(roles.outline()),
    outlineVariant: hex(roles.outlineVariant()),
    inversePrimary: hex(roles.inversePrimary()),
  };
};

/** Neutral tone 20 at 40% opacity, the dimmed layer behind modals */
const generateBackdrop = (neutral: TonalPalette) => withOpacity(hexFromArgb(neutral.tone(20)), 0.4);

//  __________   ___ .______     ______   .______     .___________.    _______.
// |   ____\  \ /  / |   _  \   /  __  \  |   _  \    |           |   /       |
// |  |__   \  V  /  |  |_)  | |  |  |  | |  |_)  |   `---|  |----`  |   (----`
// |   __|   >   <   |   ___/  |  |  |  | |      /        |  |        \   \
// |  |____ /  .  \  |  |      |  `--'  | |  |\  \----.   |  |    .----)   |
// |_______/__/ \__\ | _|       \______/  | _| `._____|   |__|    |_______/

/**
 * Builds the full M3 color scheme for a mode from a seed color and scheme options (see @description).
 */
export const generateDynamicColors = (mode: ThemeMode = 'light', options: ColorOptions = {}): ColorScheme => {
  // Options passed as undefined (e.g. `colorBlindMode: settings.colorBlindMode` before it's set) use the default
  const given = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)) as ColorOptions;
  const { hue, chroma, tone, variant, contrast, specVersion, colorBlindMode } = { ...DEFAULT_COLOR_OPTIONS, ...given };
  const isDark = mode === 'dark';
  const source = Hct.from(hue, chroma, tone);
  const contrastLevel = toContrastLevel(contrast);

  const scheme = adjustForColorBlindness(new SCHEMES[variant](source, isDark, contrastLevel, specVersion), colorBlindMode);

  const tokens = generateThemeTokens(scheme);

  return {
    ...tokens,
    backdrop: generateBackdrop(scheme.neutralPalette),
    // Surface tint per elevation level, following M3 (cards level 2, dialogs level 3). Never
    // surfaceContainerLowest: in dark mode it's black, below the page.
    elevation: {
      level0: tokens.surface,
      level1: tokens.surfaceContainerLow,
      level2: tokens.surfaceContainer,
      level3: tokens.surfaceContainerHigh,
      level4: tokens.surfaceContainerHighest,
      level5: tokens.surfaceContainerHighest,
    },
  };
};
