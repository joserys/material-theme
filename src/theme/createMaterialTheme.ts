/**
 * @fileoverview Builds a complete Material Design 3 (M3 Expressive) theme: colors, type scale, shape, motion,
 * elevation and state layers.
 *
 * @description
 * createMaterialTheme(options) returns an AppTheme. ThemeProvider builds it for the app and every component
 * reads it with useTheme().
 * - colors: M3 color roles generated from the seed color and scheme options (ColorOptions, generateDynamicColors)
 * - fonts: the M3 type scale (display/headline/title/body/label) plus M3 Expressive "emphasized" weights.
 *   `fonts` sets the font per group or role; anything left out uses the system font.
 * - spacing, shape, motion (M3 Expressive springs + easing/durations), elevation, state layer opacities
 * - reducedMotion: the app's own Reduce Motion setting, read by every animated component
 * - navigation: the same colors/fonts shaped for @react-navigation's NavigationContainer
 *
 * @examples
 * createMaterialTheme({}); // every default: light, M3 baseline colors, system font
 * createMaterialTheme({ mode: 'dark', colors: { hue: 157, chroma: 60, variant: 'vibrant' }, fonts: { display: 'MyDisplayFont' } });
 */

//Library Imports
import { Platform, ViewStyle } from 'react-native';
import { Easing } from 'react-native-reanimated';

//Custom Imports
import { generateDynamicColors } from './colors';
import type {
  AppTheme, ElevationLevel, FontFace, FontOverrides, MotionTokens, ShapeTokens, SizeTokens, SpacingTokens,
  StateLayerTokens, ThemeOptions, TypescaleGroup, TypescaleKey, Typescale, TypeStyle,
} from './types';

// Platform UI font, used for every role without a custom font
const systemFont = Platform.select({ ios: 'System', default: 'sans-serif' });

// M3 type scale: [fontSize, lineHeight, letterSpacing, regular weight, emphasized weight]
const typescaleSpec: Record<TypescaleKey, [number, number, number, TypeStyle['fontWeight'], TypeStyle['fontWeight']]> = {
  displayLarge: [57, 64, -0.25, '400', '500'],
  displayMedium: [45, 52, 0, '400', '500'],
  displaySmall: [36, 44, 0, '400', '500'],
  headlineLarge: [32, 40, 0, '400', '500'],
  headlineMedium: [28, 36, 0, '400', '500'],
  headlineSmall: [24, 32, 0, '400', '500'],
  titleLarge: [22, 28, 0, '400', '500'],
  titleMedium: [16, 24, 0.15, '500', '700'],
  titleSmall: [14, 20, 0.1, '500', '700'],
  bodyLarge: [16, 24, 0.5, '400', '500'],
  bodyMedium: [14, 20, 0.25, '400', '500'],
  bodySmall: [12, 16, 0.4, '400', '500'],
  labelLarge: [14, 20, 0.1, '500', '700'],
  labelMedium: [12, 16, 0.5, '500', '700'],
  labelSmall: [11, 16, 0.5, '500', '700'],
};

// 'titleLarge' → 'title'
export const typescaleGroup = (key: string): TypescaleGroup =>
  (['display', 'headline', 'title', 'body', 'label'] as const).find(group => key.startsWith(group)) ?? 'body';

const buildTypescale = (overrides: FontOverrides): Typescale => {
  const scale = {} as Typescale;
  (Object.keys(typescaleSpec) as TypescaleKey[]).forEach(key => {
    const [fontSize, lineHeight, letterSpacing, regular, emphasized] = typescaleSpec[key];
    const face: FontFace = overrides[key] ?? overrides[typescaleGroup(key)] ?? systemFont;
    if (typeof face === 'string') {
      scale[key] = { fontFamily: face, fontSize, lineHeight, letterSpacing, fontWeight: regular };
      scale[`${key}Emphasized`] = { fontFamily: face, fontSize, lineHeight, letterSpacing, fontWeight: emphasized };
    } else {
      // One file per weight: the file is the weight, so fontWeight stays normal (no synthetic bold on Android)
      scale[key] = { fontFamily: face.regular, fontSize, lineHeight, letterSpacing, fontWeight: 'normal' };
      scale[`${key}Emphasized`] = { fontFamily: face.emphasized, fontSize, lineHeight, letterSpacing, fontWeight: 'normal' };
    }
  });
  return scale;
};

const spacing: SpacingTokens = {
  xsmall: 2,
  small: 4,
  smallMed: 6,
  med: 8,
  medLarge: 12,
  large: 16,
  largeIncreased: 20,
  xlarge: 32,
  xxlarge: 48,
};

const motion: MotionTokens = {
  // Material's M3 Expressive motion scheme (damping ratio / stiffness), converted for Reanimated
  // (damping = 2 x ratio x sqrt(stiffness)). Spatial springs may overshoot a little; effects springs never do.
  spring: {
    fastSpatial: { damping: 34, stiffness: 800 },     // 0.6 / 800
    fastEffects: { damping: 123, stiffness: 3800 },   // 1.0 / 3800
    defaultSpatial: { damping: 31, stiffness: 380 },  // 0.8 / 380
    defaultEffects: { damping: 80, stiffness: 1600 }, // 1.0 / 1600
    slowSpatial: { damping: 23, stiffness: 200 },     // 0.8 / 200
    slowEffects: { damping: 57, stiffness: 800 }      // 1.0 / 800
  },
  easing: {
    emphasized: Easing.bezier(0.2, 0, 0, 1),
    emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1), //used for objects coming into view
    emphasizedAccelerate: Easing.bezier(0.3, 0, 0.8, 0.15), //used for objects going out of view
    standard: Easing.bezier(0.2, 0, 0, 1),
    standardDecelerate: Easing.bezier(0, 0, 0, 1),
    standardAccelerate: Easing.bezier(0.3, 0, 1, 1),
    legacy: Easing.bezier(0.4, 0, 0.2, 1),
    legacyAccelerate: Easing.bezier(0.4, 0, 1, 1),
    legacyDecelerate: Easing.bezier(0, 0, 0.2, 1),
    linear: Easing.bezier(0, 0, 1, 1)
  },
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
    extraLong1: 700,
    extraLong2: 800,
    extraLong3: 900,
    extraLong4: 1000
  }
};


const shape: ShapeTokens = {
  corner: {
    none: 0,
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    largeIncreased: 20,
    extraLarge: 28,
    extraLargeIncreased: 32,
    extraExtraLarge: 48,
    full: 1000
  }
}

const elevation: Record<ElevationLevel, ViewStyle> = {
  level0: {
    ...Platform.select({
      default: { boxShadow: [] },
      android: { elevation: 0 },
    }),
  },
  level1: {
    ...Platform.select({
      default: {
        boxShadow: [
          { inset: false, offsetX: 0, offsetY: 1, blurRadius: 2, color: 'rgba(0, 0, 0, 0.30)' },
          { inset: false, offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0, 0, 0, 0.15)' },
        ],
      },
      android: { elevation: 1 },
    }),
  },
  level2: {
    ...Platform.select({
      default: {
        boxShadow: [
          { inset: false, offsetX: 0, offsetY: 1, blurRadius: 2, color: 'rgba(0, 0, 0, 0.30)' },
          { inset: false, offsetX: 0, offsetY: 2, blurRadius: 5, color: 'rgba(0, 0, 0, 0.15)' },
        ],
      },
      android: { elevation: 3 },
    }),
  },
  level3: {
    ...Platform.select({
      default: {
        boxShadow: [
          { inset: false, offsetX: 0, offsetY: 1, blurRadius: 3, color: 'rgba(0, 0, 0, 0.30)' },
          { inset: false, offsetX: 0, offsetY: 4, blurRadius: 8, color: 'rgba(0, 0, 0, 0.15)' },
        ],
      },
      android: { elevation: 6 },
    }),
  },
  level4: {
    ...Platform.select({
      default: {
        boxShadow: [
          { inset: false, offsetX: 0, offsetY: 2, blurRadius: 3, color: 'rgba(0, 0, 0, 0.30)' },
          { inset: false, offsetX: 0, offsetY: 6, blurRadius: 10, color: 'rgba(0, 0, 0, 0.15)' },
        ],
      },
      android: { elevation: 8 },
    }),
  },
  level5: {
    ...Platform.select({
      default: {
        boxShadow: [
          { inset: false, offsetX: 0, offsetY: 4, blurRadius: 4, color: 'rgba(0, 0, 0, 0.30)' },
          { inset: false, offsetX: 0, offsetY: 8, blurRadius: 12, color: 'rgba(0, 0, 0, 0.15)' },
        ],
      },
      android: { elevation: 12 },
    }),
  },
};

// M3 component sizes (dp)
const size: SizeTokens = {
  icon: { small: 20, medium: 24, large: 32 }, // small = inside buttons, medium = standard, large = feature icons
  touchTarget: 48,
  control: 40, // small (default) button and connected button height
  fab: 56,
  avatar: 56,
};

// M3 state layer opacities (overlay drawn in the content color) and disabled opacities
const state: StateLayerTokens = {
  hover: 0.08,
  focus: 0.1,
  pressed: 0.1,
  dragged: 0.16,
  disabledContainer: 0.12,
  disabledContent: 0.38,
};

/**
 * createMaterialTheme
 * Builds the full theme object; ThemeProvider memoizes it.
 */
export const createMaterialTheme = ({
  mode = 'light',
  colors: colorOptions = {},
  fonts: fontOverrides = {},
  fontScaleCaps = {},
  reducedMotion = false,
}: ThemeOptions = {}): AppTheme => {
  const dark = mode === 'dark';
  const colors = generateDynamicColors(mode, colorOptions);
  const fonts = buildTypescale(fontOverrides);
  const navigationFont = (style: TypeStyle) => ({ fontFamily: style.fontFamily, fontWeight: style.fontWeight });

  return {
    mode,
    dark,
    colors,
    fonts,
    fontScaleCaps,
    reducedMotion,
    spacing,
    size,
    motion,
    shape,
    elevation,
    state,
    navigation: {
      dark,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.onSurface,
        border: colors.outline,
        notification: colors.error,
      },
      fonts: {
        regular: navigationFont(fonts.bodyLarge),
        medium: navigationFont(fonts.titleMedium),
        bold: navigationFont(fonts.titleLarge),
        heavy: navigationFont(fonts.titleLargeEmphasized),
      },
    },
  };
};
