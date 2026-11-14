/**
 * @fileoverview Types for the theme built by createMaterialTheme and shared through ThemeProvider.
 * Follows the Material Design 3 / M3 Expressive token names.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import type { Easing } from 'react-native-reanimated';

export type ThemeMode = 'light' | 'dark';

/** A setting the app sets itself, or 'system' to follow the phone's own setting */
export type OrSystem<T> = T | 'system';

/** Color scheme style, the "Scheme" picker in the Material Theme Builder / Android's wallpaper styles */
export type ColorSchemeVariant =
  | 'fidelity' | 'tonalSpot' | 'neutral' | 'vibrant' | 'expressive'
  | 'content' | 'monochrome' | 'rainbow' | 'fruitSalad';

/** Theme Builder contrast: standard (0), medium (0.5), high (1), or any number from -1 (reduced) to 1 */
export type ContrastLevel = 'standard' | 'medium' | 'high' | number;

/**
 * Color blindness the colors are adjusted for: protanopia (red-weak), deuteranopia (green-weak, the
 * most common), tritanopia (blue-weak), or none.
 */
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

/** Everything the color scheme is generated from (see generateDynamicColors). Anything left out uses DEFAULT_COLOR_OPTIONS. */
export interface ColorOptions {
  hue?: number;                 // seed hue, 0-360
  chroma?: number;              // seed colorfulness, 0-~120
  tone?: number;                // seed lightness ("tonal level"), 0 (black) - 100 (white)
  variant?: ColorSchemeVariant; // scheme style
  contrast?: ContrastLevel;
  specVersion?: '2021' | '2025'; // M3 color spec; '2025' is the M3 Expressive color rules
  colorBlindMode?: ColorBlindMode; // shifts the generated colors so they stay tellable apart
}

/** M3 color roles (hex strings), plus the surface elevation tints and a modal backdrop. */
export interface ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  /** Scrim at modal opacity, drawn behind dialogs */
  backdrop: string;
  /** Surface colors for elevation levels 0-5 */
  elevation: Record<ElevationLevel, string>;
}

export type TypescaleKey =
  | 'displayLarge' | 'displayMedium' | 'displaySmall'
  | 'headlineLarge' | 'headlineMedium' | 'headlineSmall'
  | 'titleLarge' | 'titleMedium' | 'titleSmall'
  | 'bodyLarge' | 'bodyMedium' | 'bodySmall'
  | 'labelLarge' | 'labelMedium' | 'labelSmall';

/** The five M3 type scale groups */
export type TypescaleGroup = 'display' | 'headline' | 'title' | 'body' | 'label';

/** Every type scale role, plus its M3 Expressive "emphasized" (heavier) version, e.g. titleLargeEmphasized */
export type TypescaleVariant = TypescaleKey | `${TypescaleKey}Emphasized`;

export type TypeStyle = Required<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight'>>;

export type Typescale = Record<TypescaleVariant, TypeStyle>;

/**
 * Font for one type scale role: one family (the role's weights come from the type scale), or one font file
 * per weight (`regular` and `emphasized` PostScript names) for static fonts like Rubik-SemiBold.
 */
export type FontFace = string | { regular: string; emphasized: string };

/**
 * Fonts per type scale group and/or role. A role (e.g. `titleLarge`) wins over its group (`title`).
 * Anything left out uses the platform's system font.
 */
export type FontOverrides = Partial<Record<TypescaleKey | TypescaleGroup, FontFace>>;

/** Largest font scale (the phone's text size setting) each type scale group may grow to; none = no cap */
export type FontScaleCaps = Partial<Record<TypescaleGroup, number>>;

export type ElevationLevel = 'level0' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

export interface SpringConfig {
  damping: number;
  stiffness: number;
}

export interface MotionTokens {
  spring: Record<'fastSpatial' | 'fastEffects' | 'defaultSpatial' | 'defaultEffects' | 'slowSpatial' | 'slowEffects', SpringConfig>;
  easing: Record<
    'emphasized' | 'emphasizedDecelerate' | 'emphasizedAccelerate' | 'standard' | 'standardDecelerate'
    | 'standardAccelerate' | 'legacy' | 'legacyAccelerate' | 'legacyDecelerate' | 'linear',
    ReturnType<typeof Easing.bezier>
  >;
  duration: Record<
    'short1' | 'short2' | 'short3' | 'short4' | 'medium1' | 'medium2' | 'medium3' | 'medium4'
    | 'long1' | 'long2' | 'long3' | 'long4' | 'extraLong1' | 'extraLong2' | 'extraLong3' | 'extraLong4',
    number
  >;
}

export interface ShapeTokens {
  corner: {
    none: number;
    extraSmall: number;
    small: number;
    medium: number;
    large: number;
    largeIncreased: number;
    extraLarge: number;
    extraLargeIncreased: number;
    extraExtraLarge: number;
    /** Pill / circle: React Native clamps the radius to half the component's size */
    full: number;
  };
}

export type SpacingTokens = Record<'xsmall' | 'small' | 'smallMed' | 'med' | 'medLarge' | 'large' | 'largeIncreased' | 'xlarge' | 'xxlarge', number>;

/** M3 component sizes (dp) */
export interface SizeTokens {
  icon: { small: number; medium: number; large: number };
  touchTarget: number; // minimum touch target
  control: number;     // small button / connected button height
  fab: number;
  avatar: number;
}

/** Opacity of the state layer drawn over a component in each interaction state */
export type StateLayerTokens = Record<'hover' | 'focus' | 'pressed' | 'dragged' | 'disabledContainer' | 'disabledContent', number>;

/** The theme in the shape @react-navigation's NavigationContainer expects (no dependency on it) */
export interface NavigationTheme {
  dark: boolean;
  colors: { primary: string; background: string; card: string; text: string; border: string; notification: string };
  fonts: Record<'regular' | 'medium' | 'bold' | 'heavy', { fontFamily: string; fontWeight: TextStyle['fontWeight'] }>;
}

/** Everything the theme is built from (createMaterialTheme options). Anything left out uses its default. */
export interface ThemeOptions {
  mode?: ThemeMode;
  colors?: ColorOptions;
  /** Keep stable (define it outside the component) so the theme isn't rebuilt every render */
  fonts?: FontOverrides;
  /** Keep stable (define it outside the component) so the theme isn't rebuilt every render */
  fontScaleCaps?: FontScaleCaps;
  /** The app's own Reduce Motion setting: components jump to the end of their animations */
  reducedMotion?: boolean;
}

export interface AppTheme {
  mode: ThemeMode;
  dark: boolean;
  colors: ColorScheme;
  fonts: Typescale;
  fontScaleCaps: FontScaleCaps;
  reducedMotion: boolean;
  spacing: SpacingTokens;
  size: SizeTokens;
  motion: MotionTokens;
  shape: ShapeTokens;
  elevation: Record<ElevationLevel, ViewStyle>;
  state: StateLayerTokens;
  /** The same colors and fonts in the shape @react-navigation expects (NavigationContainer theme) */
  navigation: NavigationTheme;
}
