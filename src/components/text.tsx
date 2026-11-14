import { FC } from 'react';
import { Text as NativeText, TextProps as NativeTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { typescaleGroup } from '../theme/createMaterialTheme';
import type { TypescaleVariant } from '../theme/types';

export interface TextProps extends NativeTextProps {
  // M3 type scale role (e.g. 'titleLarge', 'bodyMedium', 'labelLargeEmphasized'). Default 'bodyMedium'.
  variant?: TypescaleVariant;
}

// Theme-aware text: applies the type scale role's font and the onSurface color (override with `style`).
// Grows with the phone's text size setting up to the theme's fontScaleCaps for its group (no cap if unset).
export const Text: FC<TextProps> = ({ variant = 'bodyMedium', style, ...props }) => {
  const { colors, fonts, fontScaleCaps } = useTheme();
  return (
    <NativeText
      maxFontSizeMultiplier={fontScaleCaps[typescaleGroup(variant)]}
      style={[fonts[variant], { color: colors.onSurface }, style]}
      {...props}
    />
  );
};
