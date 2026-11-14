import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Icon, IconSource } from '../icons/IconProvider';
import { TouchableRipple } from './touchableRipple';

interface IconButtonProps {
  icon: IconSource;
  onPress?: () => void;       // without it the icon is shown in the same circle but isn't pressable
  size?: number;              // icon size (default theme size.icon.medium); the round container is spacing.large bigger
  iconColor?: string;         // defaults to onSurfaceVariant (M3 standard icon button)
  containerColor?: string;    // M3 filled/tonal icon button background (e.g. primary / secondaryContainer)
  disabled?: boolean;
  accessibilityLabel?: string; // required for screen readers when pressable
  style?: StyleProp<ViewStyle>; // default margin is spacing.smallMed
}

// M3 icon button: a round 40dp button (24dp icon) with a ripple, and a tap area of at least 48dp. Standard by default; pass containerColor for the
// filled/tonal styles.
export const IconButton: FC<IconButtonProps> = ({ icon, onPress, size, iconColor, containerColor, disabled = false, accessibilityLabel, style }) => {
  const { colors, state, spacing, size: sizes } = useTheme();
  const iconSize = size ?? sizes.icon.medium;
  const container = iconSize + spacing.large;
  const color = disabled ? withOpacity(colors.onSurface, state.disabledContent) : iconColor ?? colors.onSurfaceVariant;
  const tapSlop = Math.max(0, (sizes.touchTarget - container) / 2);

  return (
    <TouchableRipple
      onPress={onPress}
      disabled={disabled || !onPress}
      rippleColor={color}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={tapSlop}
      containerStyle={[{ width: container, height: container, margin: spacing.smallMed }, style]}
      shapeStyle={{ borderRadius: container / 2, backgroundColor: disabled && containerColor ? withOpacity(colors.onSurface, state.disabledContainer) : containerColor }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon source={icon} size={iconSize} color={color} />
    </TouchableRipple>
  );
};
