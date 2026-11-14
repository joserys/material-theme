import { FC } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Icon, IconSource } from '../icons/IconProvider';
import { GlyphIcon } from './glyphs';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export type ChipMode = 'assist' | 'filter' | 'input' | 'suggestion';

export interface ChipProps {
  label: string;
  mode?: ChipMode;      // default 'assist'
  icon?: IconSource;    // leading icon (18dp); a selected filter chip shows a tick instead
  selected?: boolean;   // filter and input chips
  onPress?: () => void;
  onClose?: () => void; // input chips: shows a trailing remove button
  elevated?: boolean;   // raised (level 1) instead of outlined
  disabled?: boolean;
  closeAccessibilityLabel?: string; // default "Remove <label>"
  checkIcon?: IconSource;  // replaces the built-in tick on a selected filter chip
  closeIcon?: IconSource;  // replaces the built-in remove mark on an input chip
  style?: StyleProp<ViewStyle>;
}

const HEIGHT = 32;
const ICON = 18;

// M3 chips: 32dp tall, small (8dp) corners, labelLarge, 48dp tap area. Assist (actions), filter (toggle a
// filter), input (an entered item, with remove) and suggestion. Outlined with outlineVariant, or elevated;
// selected chips fill with secondaryContainer and drop the outline.
export const Chip: FC<ChipProps> = ({
  label, mode = 'assist', icon, selected = false, onPress, onClose, elevated = false, disabled = false, closeAccessibilityLabel, checkIcon, closeIcon, style,
}) => {
  const { colors, shape, spacing, elevation, state, size } = useTheme();
  const isSelected = selected && (mode === 'filter' || mode === 'input');
  const disabledContent = withOpacity(colors.onSurface, state.disabledContent);
  const content = disabled ? disabledContent : isSelected ? colors.onSecondaryContainer : colors.onSurfaceVariant;
  const iconColor = disabled ? disabledContent : isSelected ? colors.onSecondaryContainer : mode === 'assist' ? colors.primary : colors.onSurfaceVariant;
  const container = disabled
    ? (elevated || isSelected ? withOpacity(colors.onSurface, state.disabledContainer) : 'transparent')
    : isSelected ? colors.secondaryContainer : elevated ? colors.surfaceContainerLow : 'transparent';
  const outlined = !elevated && !isSelected;
  const showTick = mode === 'filter' && selected;
  const leading = showTick ? <GlyphIcon name="check" source={checkIcon} size={ICON} color={iconColor} /> : icon !== undefined ? <Icon source={icon} size={ICON} color={iconColor} /> : null;
  const tapSlop = (size.touchTarget - HEIGHT) / 2;

  return (
    <View style={[{ flexDirection: 'row' }, style]}>
      <TouchableRipple
        onPress={onPress}
        disabled={disabled || !onPress}
        rippleColor={content}
        accessibilityRole={mode === 'filter' ? 'togglebutton' : 'button'}
        accessibilityLabel={label}
        accessibilityState={{ disabled, selected: mode === 'filter' || mode === 'input' ? selected : undefined }}
        hitSlop={{ top: tapSlop, bottom: tapSlop }}
        containerStyle={{ flexShrink: 1 }}
        shapeStyle={[{
          borderRadius: shape.corner.small,
          backgroundColor: container,
          borderWidth: outlined ? 1 : 0,
          borderColor: disabled ? withOpacity(colors.onSurface, state.disabledContainer) : colors.outlineVariant,
        }, elevated && !disabled ? elevation.level1 : null]}
        style={{
          height: HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: leading ? spacing.med : spacing.large,
          paddingRight: onClose ? spacing.small + 32 : spacing.large,
        }}
      >
        {leading && <View style={{ marginRight: spacing.med }}>{leading}</View>}
        <Text variant="labelLarge" numberOfLines={1} style={{ color: content, flexShrink: 1 }}>{label}</Text>
      </TouchableRipple>
      {onClose && (
        // A separate button over the chip's end, so removing never also presses the chip
        <TouchableRipple
          onPress={onClose}
          disabled={disabled}
          rippleColor={content}
          accessibilityLabel={closeAccessibilityLabel ?? `Remove ${label}`}
          hitSlop={8}
          containerStyle={{ position: 'absolute', right: spacing.small, top: (HEIGHT - 28) / 2, width: 28, height: 28 }}
          shapeStyle={{ borderRadius: 14 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <GlyphIcon name="close" source={closeIcon} size={ICON} color={content} />
        </TouchableRipple>
      )}
    </View>
  );
};
