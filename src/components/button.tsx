import { FC, ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Icon, IconSource } from '../icons/IconProvider';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export type ButtonMode = 'contained' | 'contained-tonal' | 'outlined' | 'text' | 'elevated';

export interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  mode?: ButtonMode;     // M3 filled ('contained'), tonal, outlined, text or elevated. Default 'text'.
  icon?: IconSource;     // leading icon (a name from IconProvider, or your own icon)
  disabled?: boolean;
  buttonColor?: string;  // overrides the container color
  textColor?: string;    // overrides the label/icon color
  style?: StyleProp<ViewStyle>; // container: margins, flex, custom corners...
  emphasized?: boolean;  // M3 Expressive emphasized label (labelLargeEmphasized), for the actions that matter most
  accessibilityLabel?: string;
}

// M3 Expressive button (small size): 40dp tall, pill shaped, 16dp side padding, 20dp leading icon.
// On press the corners morph from round to the "small" corner, unless `style` sets its own corner radius.
export const Button: FC<ButtonProps> = ({
  children,
  onPress,
  mode = 'text',
  icon,
  disabled = false,
  buttonColor,
  textColor,
  style,
  emphasized = false,
  accessibilityLabel,
}) => {
  const { colors, shape, motion, state, elevation, spacing, size, reducedMotion } = useTheme();
  const height = size.control;

  const palette: Record<ButtonMode, { container: string, content: string }> = {
    contained: { container: colors.primary, content: colors.onPrimary },
    'contained-tonal': { container: colors.secondaryContainer, content: colors.onSecondaryContainer },
    outlined: { container: 'transparent', content: colors.primary },
    text: { container: 'transparent', content: colors.primary },
    elevated: { container: colors.surfaceContainerLow, content: colors.primary },
  };
  const hasContainer = mode === 'contained' || mode === 'contained-tonal' || mode === 'elevated';

  const containerColor = disabled
    ? (hasContainer ? withOpacity(colors.onSurface, state.disabledContainer) : 'transparent')
    : buttonColor ?? palette[mode].container;
  const contentColor = disabled ? withOpacity(colors.onSurface, state.disabledContent) : textColor ?? palette[mode].content;

  // Shape morph only when the caller hasn't set its own corners. The caller's corners go on the shape;
  // everything else (margins, flex...) on the outer, pressable container.
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const isCorner = (key: string) => /^border.*Radius$/.test(key);
  const customShape = Object.keys(flatStyle).some(isCorner);
  const cornerStyle = Object.fromEntries(Object.entries(flatStyle).filter(([key]) => isCorner(key)));
  const layoutStyle = Object.fromEntries(Object.entries(flatStyle).filter(([key]) => !isCorner(key)));
  // M3: 40dp visual, tap area at least 48dp tall
  const tapSlop = Math.max(0, (size.touchTarget - height) / 2);
  const radius = useSharedValue(height / 2);
  const shapeStyle = useAnimatedStyle(() => (customShape ? {} : { borderRadius: radius.value }));
  const morph = (to: number) => {
    if (!customShape && !reducedMotion) radius.value = withSpring(to, motion.spring.fastSpatial);
  };

  return (
    <TouchableRipple
      onPress={onPress}
      disabled={disabled}
      rippleColor={contentColor}
      onPressIn={() => morph(shape.corner.small)}
      onPressOut={() => morph(height / 2)}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={{ top: tapSlop, bottom: tapSlop }}
      containerStyle={[{ minWidth: size.touchTarget }, layoutStyle]}
      shapeStyle={[
        {
          borderRadius: height / 2,
          backgroundColor: containerColor,
          borderWidth: mode === 'outlined' ? 1 : 0,
          borderColor: disabled ? withOpacity(colors.onSurface, state.disabledContainer) : colors.outlineVariant,
        },
        mode === 'elevated' && !disabled ? elevation.level1 : null,
        cornerStyle,
        shapeStyle,
      ]}
      style={{ height, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.large }}
    >
      {icon && <Icon source={icon} size={size.icon.small} color={contentColor} style={{ marginRight: spacing.med }} />}
      <Text variant={emphasized ? 'labelLargeEmphasized' : 'labelLarge'} numberOfLines={1} style={{ color: contentColor }}>{children}</Text>
    </TouchableRipple>
  );
};
