import { FC, useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { GlyphIcon } from './glyphs';
import type { IconSource } from '../icons/IconProvider';
import { TouchableRipple } from './touchableRipple';

export interface CheckboxProps {
  value: boolean | 'indeterminate'; // 'indeterminate' shows a dash, e.g. a "select all" with some selected
  onValueChange?: (value: boolean) => void; // indeterminate becomes checked
  disabled?: boolean;
  error?: boolean;
  accessibilityLabel?: string;
  checkIcon?: IconSource;         // replaces the built-in tick
  indeterminateIcon?: IconSource; // replaces the built-in dash
  style?: StyleProp<ViewStyle>;
}

const BOX = 18;
const TARGET = 40; // state layer circle

// M3 checkbox: an 18dp box with 2dp corners in a 40dp round state layer, 48dp tap area. Unchecked: 2dp
// onSurfaceVariant outline. Checked: primary fill with an onPrimary tick (error colors with `error`).
// The tick or dash springs in.
export const Checkbox: FC<CheckboxProps> = ({ value, onValueChange, disabled = false, error = false, accessibilityLabel, checkIcon, indeterminateIcon, style }) => {
  const { colors, motion, state, size, reducedMotion } = useTheme();
  const on = value !== false;
  const mark = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    mark.value = reducedMotion ? (on ? 1 : 0) : withSpring(on ? 1 : 0, motion.spring.fastSpatial);
  }, [on, reducedMotion, mark, motion.spring.fastSpatial]);
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: mark.value }] }));

  const accent = error ? colors.error : colors.primary;
  const onAccent = error ? colors.onError : colors.onPrimary;
  const disabledColor = withOpacity(colors.onSurface, state.disabledContent);
  const outline = disabled ? disabledColor : error ? colors.error : colors.onSurfaceVariant;
  const fill = disabled ? disabledColor : accent;
  const tapSlop = (size.touchTarget - TARGET) / 2;

  return (
    <TouchableRipple
      onPress={() => onValueChange?.(value !== true)}
      disabled={disabled || !onValueChange}
      rippleColor={on ? accent : colors.onSurface}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value === 'indeterminate' ? 'mixed' : value, disabled }}
      hitSlop={tapSlop}
      containerStyle={[{ width: TARGET, height: TARGET }, style]}
      shapeStyle={{ borderRadius: TARGET / 2 }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: BOX, height: BOX, borderRadius: 2, borderWidth: on ? 0 : 2, borderColor: outline, backgroundColor: on ? fill : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {on && (
          <Animated.View style={markStyle}>
            <GlyphIcon name={value === 'indeterminate' ? 'dash' : 'check'} source={value === 'indeterminate' ? indeterminateIcon : checkIcon} size={BOX} color={disabled ? colors.surface : onAccent} />
          </Animated.View>
        )}
      </View>
    </TouchableRipple>
  );
};
