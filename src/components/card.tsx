import { FC, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { TouchableRipple } from './touchableRipple';

export type CardMode = 'elevated' | 'filled' | 'outlined';

export interface CardProps {
  children?: ReactNode;
  mode?: CardMode;       // M3 elevated (default), filled or outlined card
  onPress?: () => void;  // makes the whole card one button, with a ripple
  disabled?: boolean;
  accessibilityLabel?: string; // what screen readers announce for a pressable card
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;        // outer: margins, flex, width...
  contentStyle?: StyleProp<ViewStyle>; // inside the card; padded spacing.large by default
}

// M3 card: medium (12dp) corners. Elevated sits on surfaceContainerLow with a level 1 shadow, filled on
// surfaceContainerHighest, outlined on surface with an outlineVariant border.
export const Card: FC<CardProps> = ({ children, mode = 'elevated', onPress, disabled = false, accessibilityLabel, accessibilityHint, style, contentStyle }) => {
  const { colors, shape, spacing, elevation, state } = useTheme();

  const background: Record<CardMode, string> = {
    elevated: colors.surfaceContainerLow,
    filled: colors.surfaceContainerHighest,
    outlined: colors.surface,
  };
  const cardStyle: ViewStyle = {
    borderRadius: shape.corner.medium,
    backgroundColor: background[mode],
    borderWidth: mode === 'outlined' ? 1 : 0,
    borderColor: disabled ? withOpacity(colors.outline, state.disabledContainer) : colors.outlineVariant,
    opacity: disabled ? state.disabledContent : 1,
    ...(mode === 'elevated' && !disabled ? elevation.level1 : null),
  };
  const inner = [{ padding: spacing.large }, contentStyle];

  if (!onPress) {
    return <View style={[cardStyle, style]}><View style={inner}>{children}</View></View>;
  }
  return (
    <TouchableRipple
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      containerStyle={style}
      shapeStyle={cardStyle}
      style={inner}
    >
      {children}
    </TouchableRipple>
  );
};
